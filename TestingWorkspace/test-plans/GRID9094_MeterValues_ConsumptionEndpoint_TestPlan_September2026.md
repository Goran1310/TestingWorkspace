# GRID-9094 - MeterValues Consumption Endpoint Test Plan (September 2026)

**Plan Created**: September 1, 2026
**Jira**: [GRID-9094](https://hansentechnologies.atlassian.net/browse/GRID-9094)
**Focus**: Verify a new Nexus.Core/BFF endpoint for metering point consumption preserves existing PL/SQL behavior
**Environment**: `Enoro.Ag.Test`
**Test Metering Point**: `24457` (source: http://dale-srvapp16.enoro.com:5009/mp/Overview/24457/Index)

---

## Ticket Context

Nexus Core needs a new endpoint for getting consumption for metering points. The endpoint's logic is based on:

```
felles.pkg_icaapi_meteringvalues.f_get_mv_timeseris
```

which, per implementation detail confirmed on the ticket, passes `customer id` and `delivery point id` directly (no intermediate record-id lookup) down to:

```
maalerverdi.pkg_meteringvalues_select.f_get_customer_meteringvalues
```

> ✅ **Resolved**: the new BFF/Nexus.Core endpoints were found running locally (Swagger at `https://localhost:7150/swagger/index.html`) with two routes:
> - `GET /v1/metervalue/consumption/by-customer?CustomerId={id}&DeliveryPointId={id}&DateFromUtc={date}&DateToUtc={date}&DirectionOfFlowNo={int}&UnitCode={int}&Resolution={string}&ContractTypeNo={int}`
> - `GET /v1/metervalue/consumption/by-metering-point?MeteringPointNo={id}&FromDate={date}&ToDate={date}&DirectionOfFlowNo={int}&Resolution={string}`
>
> This confirms the endpoint accepts **plain `CustomerId`/`DeliveryPointId`** (matching the ticket's "passed directly" claim) — the `RAW` record-id resolution (e.g. via `felles.efjurperson`) must happen **inside** the BFF/Nexus.Core layer, not something the caller supplies. It also confirms `Resolution` is a **string enum** (e.g. `Hour`) at this layer, presumably mapped internally to the PL/SQL's numeric `resolutionid` (matches our confirmed `c_resolution_hour=1`).

> ⚠️ **Unresolved discrepancy**: the `all_source` package spec for `felles.pkg_icaapi_meteringvalues` (see Phase 1/2) shows a function named `f_get_customer_meteringvalues` declared **inside that same package**, not in `maalerverdi.pkg_meteringvalues_select`. The package's own change-log comments also say (30.11.2023, ref 284133) that `f_get_mv_timeseris` functionality was "moved to `pkg_meterigvaulus_select` — rewritten as wrapper". It's unclear from the spec alone whether `felles.pkg_icaapi_meteringvalues.f_get_mv_timeseris` internally delegates to its own sibling `f_get_customer_meteringvalues`, or to a same-named function in the `maalerverdi`/`pkg_meteringvalues_select` schema mentioned in the ticket. Confirm by inspecting the **package body** (not just the spec) via `all_source ... type = 'PACKAGE BODY'`.

**Test Description (from ticket)**:
- Verify that the meter-value endpoint preserves the existing PL/SQL behavior.
- Confirm that requests and results are passed through without changing the underlying business logic.

## Known Gaps / Blockers

- The Nexus.Core/BFF **source repository** is still not available in this workspace, but the running endpoint is directly testable via local Swagger (`https://localhost:7150/swagger/index.html`) — see Phase 3.
- No SQL execution tool is available in this environment; all PL/SQL steps below must be run manually in SQL Developer against `Enoro.Ag.Test`.
- Delivery point record id (RAW) lookup table and confirmed numeric unit code for kWh are still unresolved — see Phase 1.

---

## Phase 1: Resolve Test Data

**Goal**: Determine the `customer id` and `delivery point id` for metering point 24457 in `Enoro.Ag.Test`, to use as input for both the direct PL/SQL baseline and the new endpoint.

- [x] Customer id and delivery point id for metering point 24457 provided directly (see table below).
- [x] Metering point master data confirmed ("Spørring grunndata"): Målepunkttype = **Produksjon** (production, subtype Vannkraft), Avregningsmetode = **Intervallavregnet** (interval-settled → hourly resolution), Anleggsstatus = Aktiv (03.03.2025-), Forventet årsforbruk unit = **kWh**.
- [ ] Confirm the metering point's active date range and direction of flow (In/Out) to pick a sensible `in_datefrom_utc` / `in_dateto_utc` test window.
- [ ] Record resolved values here once known:

| Parameter | Value | Source |
|-----------|-------|--------|
| Customer Id | `414704` | provided |
| Delivery Point Id | `707057500080531006` | provided |
| Customer Record Id (RAW) | `BC249A67EBD14539B434BF4A0A7AC209` | confirmed via `SELECT recordid FROM felles.efjurperson WHERE jurpersonid = 414704` |
| Delivery Point Record Id (RAW) | _TBD_ | find equivalent lookup table for delivery point id `707057500080531006` — `UTL_RAW.CAST_FROM_NUMBER` is disproven for the analogous customer lookup, so likely wrong here too |
| Direction of Flow | `19` (In / Production) | Målepunkttype = Produksjon → `DirectionOfFlowNo.In` (see `ChangeMpTypeProcessService.cs` convention: In=production, Out=consumption) |
| Unit Code | _TBD_ (numeric, NOT `'KWH'` string, and NOT `1`) | `in_unitcode` is `PLS_INTEGER`; ICA REST API test confirms `1` is invalid ("Unitcode 1 does not exists") — run `felles.pkg_mvapi_common.p_get_Units(0)` lookup and find the numeric code for kWh |
| Resolution Id | `1` (`c_resolution_hour`) | Confirmed from package spec constants: `c_resolution_measured=0, c_resolution_hour=1, c_resolution_day=2, c_resolution_week=3, c_resolution_month=4, c_resolution_term=5, c_resolution_year=6, c_resolution_15min=7, c_quarteryearly=8`. Avregningsmetode = Intervallavregnet → hourly → `1` |
| Date From (UTC) | _TBD_ | pick a window after 03.03.2025 (Anleggsstatus Aktiv since then) with known readings |
| Date To (UTC) | _TBD_ | pick a window with known readings |

**Real function signature** (confirmed via `all_source`, owner `FELLES`, package `PKG_ICAAPI_METERINGVALUES`):
```sql
function f_get_mv_timeseris(
    in_customer_recordid       in raw
   ,in_delivery_point_recordid in raw
   ,in_datefrom_utc            in date
   ,in_dateto_utc              in date
   ,in_directionofflowno       in pls_integer
   ,in_unitcode                in pls_integer
   ,in_resolutionid            in pls_integer)
  return maalerverdi.tt_meteringvalue_timeseries;
```
> ⚠️ Despite the ticket saying customer id/delivery point id are passed "directly", the parameters are typed `RAW`, not `NUMBER`. **Confirmed (disproving the earlier `UTL_RAW.CAST_FROM_NUMBER` assumption)**: `in_customer_recordid` is resolved via a real lookup table —
> ```sql
> SELECT recordid FROM felles.efjurperson a WHERE a.jurpersonid = 414704;
> -- returns: BC249A67EBD14539B434BF4A0A7AC209
> ```
> `in_delivery_point_recordid` almost certainly needs an equivalent lookup (not yet found) rather than `UTL_RAW.CAST_FROM_NUMBER` — find the table mapping a delivery point id (`707057500080531006`) to its `recordid` (likely a delivery-point/leveringspunkt table in the `felles` schema) and query it the same way.
>
> The return type is a PL/SQL collection (`maalerverdi.tt_meteringvalue_timeseries`), not a `CLOB`. The package also exposes `f_meteringvalues2json(in_tt_meteringvalue_timeseries) return clob` — use it to render the result as JSON for inspection/comparison.
>
> **ICA REST API test finding**: a direct test against the ICA REST API service (separate from this PL/SQL, but presumably wrapping it) with `unitcode=1` returned `[ICA_REST_API] -INFO- Unitcode 1 does not exists.` and an empty response body: `{"DirectionOfFlowNo":0,"MultiplierCodeNo":0,"UnitCodeNo":0,"IntervalReadings":null}`. This confirms unit code `1` is invalid and gives us the actual response JSON shape to compare the new Nexus.Core endpoint against in Phase 3.

---

## Phase 2: Capture PL/SQL Baseline

**Goal**: Capture the "expected" result set directly from the existing PL/SQL, to compare against the new endpoint's output later.

- [x] **Signature confirmed** via `all_source` — see Phase 1 for the real parameter list. Previous guessed call is replaced below.
- [ ] Run these lookup procs first to confirm valid direction-of-flow and unit codes (rather than guessing literals):
  ```sql
  -- Direction of flow lookup (0 = all/NA)
  DECLARE
    v_result CLOB;
  BEGIN
    v_result := felles.pkg_mvapi_common.p_get_DirectionOfFlows(0);
    DBMS_OUTPUT.PUT_LINE(v_result);
  END;
  /

  -- Unit lookup (0 = all/NA)
  DECLARE
    v_result CLOB;
  BEGIN
    v_result := felles.pkg_mvapi_common.p_get_Units(0);
    DBMS_OUTPUT.PUT_LINE(v_result);
  END;
  /
  ```
- [ ] Run the function directly with the resolved test data from Phase 1, using the confirmed signature (RAW record-ids, PLS_INTEGER codes, collection return type converted to JSON via `f_meteringvalues2json`):
  ```sql
  DECLARE
    v_result              maalerverdi.tt_meteringvalue_timeseries;
    v_result_json         CLOB;
    v_customer_recordid       RAW(16) := HEXTORAW('BC249A67EBD14539B434BF4A0A7AC209'); -- confirmed via felles.efjurperson lookup
    v_delivery_point_recordid RAW(16) := HEXTORAW('&delivery_point_recordid_hex');     -- TODO: resolve via equivalent lookup table
    v_datefrom_utc        DATE := TO_DATE('2026-08-01', 'YYYY-MM-DD'); -- TODO: confirm window with known readings
    v_dateto_utc          DATE := TO_DATE('2026-08-31', 'YYYY-MM-DD');
    v_directionofflowno   PLS_INTEGER := 19; -- confirmed: Produksjon (production) → DirectionOfFlowNo.In
    v_unitcode            PLS_INTEGER := NULL; -- TODO: numeric code for kWh, from felles.pkg_mvapi_common.p_get_Units(0) lookup (confirmed NOT 1)
    v_resolutionid        PLS_INTEGER := 1;  -- c_resolution_hour, confirmed from package spec constants
  BEGIN
    v_result := felles.pkg_icaapi_meteringvalues.f_get_mv_timeseris(
        in_customer_recordid       => v_customer_recordid,
        in_delivery_point_recordid => v_delivery_point_recordid,
        in_datefrom_utc            => v_datefrom_utc,
        in_dateto_utc              => v_dateto_utc,
        in_directionofflowno       => v_directionofflowno,
        in_unitcode                => v_unitcode,
        in_resolutionid            => v_resolutionid
    );
    v_result_json := felles.pkg_icaapi_meteringvalues.f_meteringvalues2json(v_result);
    DBMS_OUTPUT.PUT_LINE(v_result_json);
  END;
  /
  ```
  > Do not run until `v_unitcode` and `v_delivery_point_recordid` are filled in with confirmed values — `PLS_INTEGER := NULL` and the placeholder delivery-point hex will likely raise an error or return an empty result (as already observed via the ICA REST API test).
- [ ] Save the raw CLOB output as the baseline (`baseline_24457_<date>.json` or similar) for later comparison. Reference response shape observed from the ICA REST API test (single object, not the expected time-series list — due to invalid unit code): `{"DirectionOfFlowNo":0,"MultiplierCodeNo":0,"UnitCodeNo":0,"IntervalReadings":null}`.
- [ ] Optionally, also call the downstream function directly to sanity-check pass-through behavior (note the extra `in_contracttypeno` parameter and collection return type):
  ```sql
  DECLARE
    v_result              maalerverdi.tt_meteringvalue_timeseries;
    v_result_json         CLOB;
    v_customer_recordid       RAW(32) := UTL_RAW.CAST_FROM_NUMBER(414704);
    v_delivery_point_recordid RAW(32) := UTL_RAW.CAST_FROM_NUMBER(707057500080531006);
  BEGIN
    v_result := felles.pkg_icaapi_meteringvalues.f_get_customer_meteringvalues(
        in_customer_recordid       => v_customer_recordid,
        in_delivery_point_recordid => v_delivery_point_recordid,
        in_datefrom_utc            => TO_DATE('2026-08-01', 'YYYY-MM-DD'),
        in_dateto_utc              => TO_DATE('2026-08-31', 'YYYY-MM-DD'),
        in_directionofflowno       => 19,
        in_unitcode                => NULL,    -- TODO: same numeric unit code as above
        in_contracttypeno          => NULL,    -- TODO: confirm expected value (nullable per package comments)
        in_resolutionid            => 1
    );
    v_result_json := felles.pkg_icaapi_meteringvalues.f_meteringvalues2json(v_result);
    DBMS_OUTPUT.PUT_LINE(v_result_json);
  END;
  /
  ```

---

## Phase 3: New Endpoint Verification

**Goal**: Call the new Nexus.Core/BFF endpoint with equivalent inputs and diff the response against the Phase 2 baseline.

- [x] Endpoint routes confirmed via local Swagger (`https://localhost:7150/swagger/index.html`):
  - `GET /v1/metervalue/consumption/by-customer` (CustomerId + DeliveryPointId based)
  - `GET /v1/metervalue/consumption/by-metering-point` (MeteringPointNo based — simplest fit for our test case)
- [ ] **Simplest first test** — `by-metering-point`, using metering point 24457 directly (no unit code / delivery-point-recordid blockers apply here):
  ```bash
  curl --location 'https://localhost:7150/v1/metervalue/consumption/by-metering-point?MeteringPointNo=24457&FromDate=2026-08-01&ToDate=2026-08-31&DirectionOfFlowNo=19&Resolution=Hour' \
    --header 'accept: application/json'
  ```
  > `DirectionOfFlowNo=19` used here per our confirmed Produksjon → In mapping (Phase 1) — adjust if the endpoint rejects it in favor of a different enum convention (the Swagger example used `1`, but that may just be an arbitrary example value, not a confirmed "Out"/consumption default).
- [ ] **Second test** — `by-customer`, using the resolved customer id/delivery point id for metering point 24457 (unit code still a placeholder, pending Phase 1 resolution):
  ```bash
  curl --location 'https://localhost:7150/v1/metervalue/consumption/by-customer?CustomerId=414704&DeliveryPointId=707057500080531006&DateFromUtc=2026-08-01&DateToUtc=2026-08-31&DirectionOfFlowNo=19&UnitCode=72&Resolution=Hour&ContractTypeNo=0' \
    --header 'accept: application/json'
  ```
  > `UnitCode=72` is carried over from the Swagger example call — **not yet confirmed** as the correct kWh code for this environment. Replace once the `p_get_Units(0)` lookup (Phase 2) confirms it.
- [ ] Diff both endpoint responses against the Phase 2 PL/SQL baseline:
  - [ ] Same number of time series points
  - [ ] Same reading values (accounting for unit conversion, if any, at the BFF layer)
  - [ ] Same timestamps (UTC handling consistent)
  - [ ] Same handling of nulls/missing values
  - [ ] Confirm whether `by-customer` and `by-metering-point` return equivalent data for the same underlying metering point (they should, if both ultimately call the same PL/SQL)
- [ ] Verify error/edge cases pass through unchanged (e.g. invalid metering point, empty date range, no direction of flow match).

---

## Acceptance Criteria

1. PL/SQL baseline captured and stored for metering point 24457 across at least one representative date range.
2. New endpoint's response is byte-for-byte or field-for-field equivalent to the PL/SQL baseline (except for necessary JSON/DTO shaping) — no business logic differences.
3. No regressions in request parameter handling — all inputs to the endpoint map 1:1 to the PL/SQL function's inputs (customer id, delivery point id, date range, direction of flow, unit code, resolution id).

---

## Next Actions

1. Run the `by-metering-point` curl above now — it doesn't depend on the still-unresolved delivery-point-recordid or unit code, so it can be tested immediately.
2. Find the delivery-point recordid lookup table and the confirmed numeric unit code for kWh (Phase 1) to unblock the full PL/SQL baseline and the `by-customer` endpoint test.
3. Run Phase 2 baseline capture in SQL Developer against `Enoro.Ag.Test` once blockers above are resolved, then diff against both Phase 3 endpoint responses.

**Plan Status**: 🔄 Draft — Phase 3 unblocked via local Swagger; Phase 1/2 still blocked on delivery-point recordid and unit code lookups
**Assigned**: Test Planner Agent
**Last Updated**: September 1, 2026

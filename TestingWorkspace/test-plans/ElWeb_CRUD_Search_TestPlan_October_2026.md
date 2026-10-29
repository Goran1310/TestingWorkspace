# ElWeb - Full CRUD / Search Test Plan (October 2026)

**Plan Created**: October 1, 2026
**Repository**: [hansen-technologies/cis-e-elweb](https://github.com/hansen-technologies/cis-e-elweb) (Elis/ElWin for web)
**Focus**: Verify every Create / Update / Delete / Search / Search-by-id process available in ElWeb, at UI, BFF API and database level
**Environment**: `Utvikling` (tenant picker → Microsoft Entra scheme `NexusEntraID_utvikling`)
**ElWeb URL**: `https://hsnlnx-tstapp02.enoro.com:5007` · **BFF URL**: `https://hsnlnx-tstapp02.enoro.com:7187`
**Test Levels**: Manual UI + BFF API (Postman/Swagger) + SQL verification (SQL Developer against Utvikling)

---

## Context

ElWeb is a React SPA (TanStack Router, MUI) that calls a BFF through `apiFetch` (cookie auth, `credentials: include`). All pages share the same building blocks:

| Building block | Source | Behaviour to test |
|----------------|--------|-------------------|
| `useSearch` | `src/hooks/useSearch.ts` | `POST {entity}/search` with `{ criteria: [{field, value, operator}], page: 1, pageSize }`; empty fields skipped; empty criteria returns all records; `pageSize` = `searchResultLimit` from `config.json` (default 50) |
| Operators | `src/types/search.ts` | `=` exact, `~` contains (LIKE %v%), `>`, `<`, `>=`, `<=`, `*` raw pattern (user supplies `%`) |
| `useFormController` | `src/hooks/useFormController.ts` | New / Save → confirm dialog → onSave / Cancel; default keywords `TODAY`, `CURUSER` on New |
| `ConfirmSaveDialog` | `src/components/ConfirmSaveDialog.tsx` | Insert: lists all fields, button **Create**. Update: title **Save changes**, lists only changed fields (old → new) |
| `useSearchDetailTransition` | `src/hooks/useSearchDetailTransition.ts` | Search results → row select loads full record → SubView tabs scoped to parent identity |
| `SubView` | `src/components/SubView.tsx` | Oracle-metadata-driven detail tabs (`/api/v1/views/{parentId}/details/{tabId}`) |
| Field editor | `useFieldEditor`, `FieldEditorBanner` | Drag/drop, width, hide/unhide, Save Layout (`POST /v1/fieldcustomizations/{pageKey}/custom`), Reset |
| Jobs | `src/services/jobApi.ts`, `useJobs`, `useSignalDispatcher` | Customer only: list/execute jobs, signals `dialog`, `openTask`, `closeTask`, `refresh`, `report`, `message`, `url` |

### Capability Matrix (verified from source, `main` branch)

Legend: ✅ supported · ⛔ intentionally not supported (negative test) · ⚠️ partial / stub

| # | Page | Route | Page key | PK field (Oracle key) | Create | Update | Delete | Search | Search by id |
|---|------|-------|----------|----------------------|--------|--------|--------|--------|--------------|
| 1 | Customer | `/customers/customer` | `customer` | `customerId` (`JURPERSONID`) | ✅ `POST /v1/customers/` | ✅ `PUT /v1/customers/{id}` | ⛔ | ✅ `POST` search | ✅ `GET /v1/customers/{id}` |
| 2 | Element type | `/contract/elementtype` | `elementtype` | `elementType` (`PRODUKTNR`) | ✅ `POST /api/v1/element-types` | ✅ `PUT /api/v1/element-types/{id}` | ✅ `DELETE /api/v1/element-types/{id}` | ✅ `POST /api/v1/element-types/search` | ✅ `GET /api/v1/element-types/{id}` |
| 3 | Zone settings | `/metering-point/zone-settings` | `zone-settings` | `zoneNumber` | ✅ `POST /api/v1/zone-settings` | ✅ `PUT /api/v1/zone-settings/{id}` | ✅ `DELETE /api/v1/zone-settings/{id}` | ✅ `POST /api/v1/zone-settings/search` | ✅ `GET /api/v1/zone-settings/{id}` |
| 4 | Offer type | `/sales/offer-type` | `offer-type` | `id` (`TILBODSTYPENR`) | ✅ `POST /api/v1/offer-types` | ✅ `PUT /api/v1/offer-types/{id}` | ⛔ | ✅ `GET /api/v1/offer-types?name=` | ✅ `GET /api/v1/offer-types/{id}` |
| 5 | Meter type register | `/metering-point/metertyperegister` | `metertyperegister` | `meterTypeRegisterId` (`TYPEGRUPPEID`) | ✅ `POST /api/v1/metertyperegisters` | ✅ `PUT /api/v1/metertyperegisters/{id}` | ⛔ | ✅ `POST /api/v1/metertyperegisters/search` | ✅ `GET /api/v1/metertyperegisters/{id}` |
| 6 | Contract type | `/contracts/contract-type` | `contract-type` | `contractTypeNumber` (`KONTRAKTTYPENR`) | ⛔ (no New button) | ✅ `PUT /api/v1/contract-types/{id}` | ⛔ | ✅ `POST /api/v1/contract-types/search` | ✅ `GET /api/v1/contract-types/{id}` |
| 7 | Event reason | `/common/event-reason` | `event-reason` | `reasonNo` (`REASONNO`) | ✅ `POST /v1/event-reasons` | ⛔ create-only | ⛔ | ✅ `POST /api/v1/event-reasons/search` | ✅ `GET /v1/event-reasons/{id}` (PK sole criterion) |
| 8 | Facility type | `/supervision/facility-type` | `facility-type` | `facilityTypeNo` (`TYPEANLEGGNR`) | ✅ `POST /api/v1/facility-types/` | ⛔ "cannot be changed after they are created" | ⛔ | ✅ `POST /api/v1/facility-types/search` | ✅ `GET /api/v1/facility-types/{id}` |
| 9 | Inspection type | `/supervision/inspectiontype` | `inspectiontype` | `inspectionTypeNo` | ✅ `POST /api/v1/inspection-types/` | ⛔ "cannot be changed after they are created" | ⛔ | ✅ `POST /api/v1/inspection-types/search` | ✅ `GET /api/v1/inspection-types/{id}` |
| 10 | County | `/customers/county` | `county` | `countyNo` (`FYLKENR`) | ⛔ `canCreate=false` | ⛔ `canUpdate=false` | ⛔ | ✅ `POST /api/v1/counties/search` | ✅ `GET /api/v1/counties/{id}` |
| 11 | Event type | `/common/eventtype` | `eventtype` | `eventTypeNo` hidden (`REASONCONTEXTNO`) | ⛔ read-only | ⛔ | ⛔ | ✅ `POST /api/v1/eventtypes/search` (name default `~`) | ✅ `GET /api/v1/eventtypes/{id}` (only if PK unhidden) |
| 12 | Error codes | `/common/errorcodes` | `errorcodes` | `codeListNo` (ElWin `FEILKODER`) | ⛔ read-only | ⛔ | ⛔ | ✅ `POST /api/v1/errorcodes/search` (always) | ✅ `GET /api/v1/errorcodes/{id}` on row select |
| 13 | Template type | `/ledger/template-type` | `template-type` | `templateTypeNo` (`TEMPLATETYPE`) | ⛔ read-only | ⛔ | ⛔ | ✅ `GET /api/v1/template-types?templateTypeName=` | ⛔ (row select reuses search row) |
| 14 | Automated processes | `/invoicing/automated-processes` | `automated-processes` | `functionNumber` (`FUNCTIONNO`) | ⛔ read-only | ⛔ | ⛔ | ✅ `POST /api/v1/automated-processes/search` | ✅ `GET /api/v1/automated-processes/{id}` (PK sole criterion) + `GET /{id}/next-possible` |
| 15 | Address | `/customers/address` | `customers-address` | — | ⚠️ `onSave` is a TODO (console.log) | ⚠️ | ⛔ | ⚠️ no `onSearch` → no-op | ⛔ |

**Out of scope**: demo/dev routes `/`, `/about`, `/components/*`, `/test/developer`.

## Known Gaps / Blockers

- SQL runs via the SQLcl/SQL Developer connection **Utvikling** (autocommit OFF — explicit `COMMIT`/`ROLLBACK` required).
- Oracle objects resolved in Phase 0.2 (Oct 1, 2026). Open items: `TILSYN.V_FEILKODER` not readable (ORA-01031); meter type register PK mapping (`TYPEGRPID` vs `TYPEGRUPPEID`) to confirm against API response.
- BFF source is not in this workspace — expected HTTP status codes for unsupported operations (Phase 4) are recorded as **observed**, not asserted.
- ~~`NexusEntraID_utvikling` scheme name is inferred~~ — ✅ confirmed via `GET {bff}/api/auth/tenants` (Oct 1, 2026).
- Auth endpoints live under `/api/auth/*` on the BFF (`/auth/tenants` and `/auth/me` return 404).

---

## Phase 0: Environment Setup & Test Data

**Goal**: Log in to Utvikling, confirm BFF wiring, resolve Oracle tables, collect existing test ids.

### 0.1 Login & environment

- [x] Open ElWeb URL for Utvikling: `https://hsnlnx-tstapp02.enoro.com:5007` (ref page: `/components/contractImport`)
- [x] Tenant picker is shown (1–4 tenants = buttons, 5+ = dropdown + Continue). Select **Utvikling**. Expected: single tenant → one direct login button.
- [x] Login redirect (verified without browser, Oct 1): `GET {bff}/api/auth/login?scheme=NexusEntraID_utvikling&returnUrl=/` → `302` to `login.microsoftonline.com/a00ea397-07e5-4d3c-af62-1d63438d4931/oauth2/v2.0/authorize` (client_id `8e97f22f-d757-4b32-8965-dc4097b87193`, redirect `{bff}/signin-NexusEntraID_utvikling`, PKCE S256).
- [x] Interactive Entra login completes and returns to ElWeb authenticated (Oct 1, 2026).
- [x] Unauthenticated `GET {bff}/api/auth/me` → `302` to `/api/auth/login?ReturnUrl=%2Fapi%2Fauth%2Fme` (no data leaked).
- [x] Authenticated `GET {bff}/api/auth/me` → `isAuthenticated: true`, name/email `Goran.Lovincic@hansencx.com`, provider `AuthenticationTypes.Federation`, 12 claims.
- [x] `GET {bff}/api/auth/tenants` → `[{"scheme":"NexusEntraID_utvikling","displayName":"Utvikling"}]`
- [x] `/config.json` → `bffApiUrl` = `https://hsnlnx-tstapp02.enoro.com:7187`, `searchResultLimit` = `50`
- [x] DevTools → Application → Session Storage: `elweb:bffApiUrl` = `null` → no `?bff=` handoff, app uses `config.json` value (expected).
- [ ] Postman: create environment `ElWeb-Utvikling` with `bffUrl`, and copy the auth cookie from the browser session (cookie-based BFF auth).

### 0.2 Resolve Oracle objects (discovery)

```sql
-- Locate tables owning the master-key columns used by ElWeb
SELECT owner, table_name, column_name
FROM   all_tab_columns
WHERE  column_name IN ('JURPERSONID','FYLKENR','KONTRAKTTYPENR','PRODUKTNR','REASONNO',
                       'REASONCONTEXTNO','TILBODSTYPENR','TYPEGRUPPEID','TYPEANLEGGNR','FUNCTIONNO')
AND    owner NOT IN ('SYS','SYSTEM')
ORDER  BY column_name, owner, table_name;

-- Candidate tables by name
SELECT owner, object_name, object_type
FROM   all_objects
WHERE  object_type IN ('TABLE','VIEW')
AND    (object_name LIKE '%FYLKE%' OR object_name LIKE '%PRODUKTREG%' OR object_name LIKE '%TYPEANLEGG%'
     OR object_name LIKE '%EVENTREASON%' OR object_name LIKE '%TEMPLATETYPE%' OR object_name LIKE '%FEILKODE%'
     OR object_name LIKE '%AUTOPROCESS%' OR object_name LIKE '%TILBODSTYPE%' OR object_name LIKE '%KONTRAKTTYPE%'
     OR object_name LIKE '%ZONE%' OR object_name LIKE '%SONE%' OR object_name LIKE '%INSPECT%' OR object_name LIKE '%KONTROLL%'
     OR object_name LIKE '%TYPEGRUPPE%');
```

Resolved objects (run Oct 1, 2026 via SQLcl connection **Utvikling**, Oracle 19.30, NLS AMERICAN/NORWAY, autocommit OFF):

| Page | Table / view (owner.name) | PK column | Key columns |
|------|---------------------------|-----------|-------------|
| Customer | `FELLES.EFJURPERSON` (table) | `JURPERSONID` | `JURTYPE, ETTERNAMN, FORNAMN, FOODSELDATO, FORETAKSNR, ADRESSE, POSTNR, POSTSTAD, LANDKODE, EPOST, TELEFONNR, MOBILTLFNR, NOTAT, TERMINATIONDATE, TERMINATIONREASONID, NONDIGITAL` |
| Element type | `KUNDE.EKPRODUKT` (view; base `KUNDE.EKPRODUKT_PTAB`) | `PRODUKTNR` | `PRODUKTKODE, DATOTYPE, EININGID, PRODUKTNAMN, PRODUKTTEKST` |
| Element type – elements | `KUNDE.EKELEMENT` (table) | `ELEMENTNR` | FK `PRODUKTNR` |
| Zone settings | `FELLES.EFZONE` (table) | `ZONENO` | `ZONENAME, PLANNEDCITYDISTRICT, RESTRICTEDBYFUSESIZE, FROMDISTANCEMETER, TODISTANCEMETER, DEFAULTINTERRUPTIONAREANO` |
| Offer type | `INTERNPRIS.EITILBODSTYPE` (table) | `TILBODSTYPENR` | `TILBODSTYPENAMN, DEFAULTNETTOMARGIN, MINNETTOMARGIN, MAXNETTOMARGIN, LOGG*` |
| Meter type register | `KOMPONENT.EMTYPEGRUPPE` (table) | `TYPEGRPID` | `TYPEGRUPPEID, FABRIKAT, TYPE, GYLDIGFRA, GYLDIGTIL, LOGG*` — ⚠️ confirm whether ElWeb `meterTypeRegisterId` maps to `TYPEGRPID` or `TYPEGRUPPEID` |
| Contract type | `RESKONTRO.ERKONTRAKTTYPE` (view; base `ERKONTRAKTTYPE_PTAB`) | `KONTRAKTTYPENR` | `KONTRAKTTYPENAMN, EIGENRESKONTRO, INKASSOTYPENR, COMBINEDINVOICEIGNORENY, COMBINEDINVOICEFORCENY, COMBINEDINVOICEIGNORECHECKNY, KONTRAKTTYPGROUP` |
| Event reason | `FELLES.EFREASON` (table) | `REASONNO` | `REASONNAME` |
| Facility type | `TILSYN.ETTYPEANLEGG` (table) | `TYPEANLEGGNR` | `TYPEANLEGG, FRADATO, TILDATO, VIRKSOMHETSTYPENR, RESULTATOMRAADENR, RISIKOKLASSENR, TILSYNSFREKVENS` |
| Inspection type | `TILSYN.ETINSPEKSJONSTYPE` (table) | `INSPEKSJONSTYPENR` | `INSPEKSJONSKODE, INSPEKSJONSTYPE, FORKLARING` |
| County | `FELLES.EFFYLKE` (table) | `FYLKENR` | `FYLKENAMN, FYLKEKODE, LANDKODE, FROMDATE, TODATE` |
| Event type | `FELLES.EFREASONCONTEXT` (view; base `EFREASONCONTEXT_PTAB`) | `REASONCONTEXTNO` | `REASONCONTEXTNAME` |
| Error codes | `TILSYN.V_FEILKODER` (view) | `KODELISTENR` (+ `TEKSTKODENR`) | `TEKST, FORSKRIFTNR, FORSKRIFTSNAMN` — ⚠️ **ORA-01031 insufficient privileges** for current DB user; request grant or verify via UI/API only |
| Template type | `RESKONTRO.ERTEMPLATETYPE` (table) | `TEMPLATETYPENO` | `TEMPLATETYPENAME` |
| Automated processes | `FELLES.EFAUTOPROCESSFUNC_PTAB` (table) | `FUNCTIONNO` | `FUNCTIONNAME, FUNCTIONREFERENCE, DIAGNOSTICREFERENCE` |
| Automated processes – next possible | `FELLES.EFAUTOPROCESSPOSSIBLEFUNC` (table) | `FUNCTIONNO, POSSIBLENEXTFUNCTIONNO` | `TRANSFORMSQL` |

### 0.3 Existing test data (read-only pages and update targets)

```sql
-- Pattern: pick 3 existing ids per entity (replace table/PK)
SELECT <<pk>>, t.* FROM <<owner.table>> t WHERE ROWNUM <= 3 ORDER BY <<pk>>;
-- Row count for "empty search returns all / capped at limit" checks
SELECT COUNT(*) FROM <<owner.table>>;
```

Baseline captured Oct 1, 2026 (Utvikling):

| Page | Existing id(s) → name | Search text (partial name) | Total rows | Id range | Notes |
|------|----------------------|---------------------------|-----------|----------|-------|
| Customer | `13383196` Oen OleRonny, `13383195` Igelkjon Sondre, `13383193` Suryavanshi Sumit | `Igelkj` | 114106 | -13 – 13383196 | > limit → `hasMore` expected on empty search |
| County | `1` ØSTFOLD, `2` AKERSHUS, `3` OSLO | `AKERS` | 62 | 1 – 89 | > limit (50) |
| Contract type | `0` Strøm, `1` Ventelo, `2` IMS | `Vent` | 37 | 0 – 39 | update target – record original values for rollback (0.4) |
| Event type | `1` Kommunikasjon, `2` Invoice, `3` Migration, `4` DeferRemittance | `Migr` | 4 | 1 – 4 | |
| Error codes | — | — | n/a | n/a | no DB privilege (ORA-01031); take ids from UI |
| Template type | `1` Manuell Faktura, `2` Autofaktura ved fakturering | `Manuell` | 2 | 1 – 2 | |
| Automated processes | `0` Initialisering – Utplukk av Kontrakter, `1`, `2` | `Initiali` | 27 | 0 – 91 | ids 0/1/2 have ≥1 next-possible row |
| Facility type | `1` Syke-/aldershjem/Helseinstitusjoner, `2` Sykehus, `3` Helsesentre | `Syke` | 28 | 1 – 28 | |
| Inspection type | `1` I / Inspeksjon, `2` M / Marknadskontroll, `3` I / Hendelsesstyrt innrapportering | `Inspek` | 10 | 1 – 10 | |
| Event reason | `1` Manglende timeverdier, `2` Justering av produkt/priser, `3` Større tilbudsprosess | `Manglende` | 17 | 1 – 19 | |
| Offer type | `1` Standard, `2` Test1, `3` Test2 | `Test` | 19 | 1 – 19 | |
| Meter type register | `1` (1 / AEG A41G), `2` (2 / AEG A41G), `3` (3 / AEG B11W) | `AEG` | 1103 | 1 – 1114 | > limit |
| Element type | `1` Ikke i bruk, `2` Avskrivning, `3` Basisforbruk | `forbruk` | 128 | 1 – 178 | > limit |
| Zone settings | `1` Zone 1, `2` Zone 2, `3` Zone 3 | `Zone` | 3 | 1 – 3 | |

### 0.4 Naming convention & cleanup

- [ ] All created data uses prefix `ELWEB_TEST_` (or `ETST` where field length is limited) plus date, e.g. `ELWEB_TEST_20261001_01`.
- [ ] Record every created id in the **Created Data Log** (Phase 6) immediately after creation.
- [x] Contract type has no create/delete → original values captured (Oct 1, 2026) for rollback in Phase 6:

| KONTRAKTTYPENR | NAMN | EIGENRESKONTRO | INKASSOTYPENR | COMBINEDINVOICEIGNORENY | COMBINEDINVOICEFORCENY | COMBINEDINVOICEIGNORECHECKNY | KONTRAKTTYPGROUP |
|---|---|---|---|---|---|---|---|
| 1 | Ventelo | 1 | 50 | 0 | 1 | 1 | (null) |
| 2 | IMS | 1 | 50 | 0 | 0 | 0 | I |

Use **2 (IMS)** as the CT-04/CT-05 update target (no combined-invoice flags set).

---

## Phase 1: Cross-Cutting Behaviour

**Goal**: Verify shared search/form behaviour once, using **Customer** (full CRUD) and **County** (read-only) as reference pages.

**API runner**: [test-scripts/ElWeb-Phase1-Api.ps1](../test-scripts/ElWeb-Phase1-Api.ps1) — run with `$env:ELWEB_COOKIE = Get-Clipboard -Raw; ./test-scripts/ElWeb-Phase1-Api.ps1; Remove-Item Env:ELWEB_COOKIE`. Writes `ElWeb-Phase1-Results-*.json` (no cookie stored).

> `apiFetch` prefixes `/api` to any path that lacks it, so `/v1/customers` in the SPA source = `{bff}/api/v1/customers` on the wire.

**DB-derived expected values** (`FELLES.EFFYLKE`, 62 rows, Oct 1, 2026):

| Criterion | Expected `totalCount` |
|-----------|----------------------|
| `countyName = OSLO` | 1 (id 3) |
| `countyName ~ AKERS` | 2 (ids 2, 70) |
| `countyName * ØST%` | 2 (ids 1, 69) |
| `countyNo > 20` / `< 20` / `>= 20` / `<= 20` | 43 / 18 / 44 / 19 |
| `countyNo >= 20` AND `countyName ~ AKERS` | 1 (id 70) |
| `countyNo > 3` | 59 |
| empty criteria | 62 total, 50 rows, `hasMore=true` |

### 1.1 Search operators (`useSearch`)

| ID | Step | Expected | UI | API | Result |
|----|------|----------|----|-----|--------|
| X-01 | Enter a name, operator `=` | Exact match only; request criterion `{"operator":"="}` | [x] | [ ] | ✅ PASS (HAR, Oct 1): County `countyName = "Oslo"` → `POST /api/v1/counties/search` → 200, 1 row `{countyNo:3, countyName:OSLO}`. Note: `=` is **case-insensitive** ("Oslo" matched "OSLO") |
| X-02 | Operator `~` with partial name | LIKE `%value%` matches | [ ] | [ ] | |
| X-03 | Operator `*` with `ABC%` | Raw pattern applied | [ ] | [ ] | |
| X-04 | Numeric field with `>`, `<`, `>=`, `<=` | Correct range; boundaries inclusive only for `>=`/`<=` | [ ] | [ ] | |
| X-05 | Multiple fields filled | All non-empty visible fields sent as criteria (AND) | [ ] | [ ] | |
| X-06 | Value with leading/trailing spaces | Trimmed before sending | [ ] | [ ] | |
| X-07 | Hidden field with value | Not sent (only visible fields build criteria) | [ ] | [ ] | |
| X-08 | All fields empty → Search | Request with `criteria: []`; returns first `pageSize` records, `totalCount` = DB count, `hasMore` true if > limit | [x] | [ ] | ❌ FAIL on Customer (HAR): `POST /api/v1/customers/search` `{criteria:[],page:1,pageSize:50}` → **405** ProblemDetails `UPSTREAM_ERROR` "API Error: " — see DEF-01. County still to run |
| X-09 | No match | Toast **"No records found"**, results panel empty | [ ] | [ ] | |
| X-10 | BFF returns error (e.g. invalid field via Postman) | Toast built from ProblemDetails `detail`/`title`; UI shows "Search failed…" | [x] | [ ] | ⚠️ Observed on Customer 405: ProblemDetails `detail` is just "API Error: " (empty upstream message) → user gets no meaningful text — see DEF-02 |

### 1.2 Search by id (direct PK lookup)

| ID | Step | Expected | Result |
|----|------|----------|--------|
| X-11 | Enter existing PK, operator `=` → Search | `GET /{entity}/{id}` called (no `/search`), record loaded into form, SubView opens | ✅ PASS (HAR): Customer `GET /api/v1/customers/41114` → 200; all values match `FELLES.EFJURPERSON` (name, DOB 1980-10-13, mobile, email, created 2015-05-04/ANNEJ, changed 2026-02-27). SubView `GET /api/v1/views/KUNDE` → 31 tabs. County single search match auto-loaded via `GET /api/v1/counties/3` → 200; SubView `FYLKE` → tab `V_TRANS_EFFYLKE` |
| X-12 | Enter non-existing PK | `404` → **"Record not found"** | |
| X-13 | PK with operator `>` | Goes through `POST /search` instead of direct GET | |
| X-14 | PK + another field (event reason, automated processes) | Direct lookup **not** used; search used so other criteria are respected | |
| X-15 | Change PK field while a record is loaded (customer, facility type, automated processes) | Form auto-resets to search mode | |
| X-16 | Non-numeric PK (`abc`) | Graceful error, no crash; record API status | |

### 1.3 Form controller / confirm dialog

| ID | Step | Expected | Result |
|----|------|----------|--------|
| X-17 | Click **New** | Form cleared; `TODAY`/`CURUSER` defaults resolved where configured | |
| X-18 | New → fill → **Save** | `ConfirmSaveDialog` (insert mode) lists all fields, button **Create** | |
| X-19 | Dialog **Cancel** | No request sent; form keeps entered values | |
| X-20 | Load record → change 2 fields → Save | Dialog title **Save changes** lists only the 2 changed fields with old/new | |
| X-21 | Load record, no change | Save button disabled | |
| X-22 | **Cancel** button with data | Form reset, results cleared, SubView closed | |
| X-23 | Save failure (stop BFF / invalid data) | Error toast; form stays dirty so user can retry | |

### 1.4 Auth / session

| ID | Step | Expected | Result |
|----|------|----------|--------|
| X-24 | Delete auth cookie → Search | `apiFetch` treats 3xx/401 as auth error, user is sent to tenant picker | |
| X-25 | Logout | `GET /api/auth/logout?returnUrl=…` clears cookie, back to start page | |
| X-26 | API call without cookie | `401`/redirect — no data returned | ✅ PASS (Oct 1): `GET /api/v1/counties/3` → `302` to `/api/auth/login?ReturnUrl=…`; `POST /api/v1/counties/search` → `401`; empty bodies |

---

## Phase 2: Full CRUD Pages

**Goal**: Create → Search by id → Search → Update → Delete (where supported) for each page, verified in UI, API and DB.

Per test case, tick: **UI** = performed via ElWeb · **API** = same request via Postman · **DB** = SQL verification.

### 2.1 Customer — `/customers/customer`

Lookups: `GET /v1/customers/lookups` (customer type, contact type, language, …).

| ID | Operation | Steps | Expected | UI | API | DB |
|----|-----------|-------|----------|----|-----|----|
| CU-01 | Lookups | Open page | Dropdowns (customer type, contact type, language, termination reason) populated | [ ] | [ ] | – |
| CU-02 | Create person | New → customerType=person, lastName=`ELWEB_TEST_P`, firstName, dateOfBirth, address, postalCode, email → Save → Create | `POST /v1/customers/` → `{customerId}`; toast "Customer created successfully"; customerId shown | [ ] | [ ] | [ ] |
| CU-03 | Create company | New → customerType=company, lastName=`ELWEB_TEST_C`, businessNumber | Created; id returned | [ ] | [ ] | [ ] |
| CU-04 | Create – missing required | Leave required fields empty → Save | Validation / ProblemDetails error, nothing inserted | [ ] | [ ] | [ ] |
| CU-05 | Search by id | customerId=`<new id>`, `=` | `GET /v1/customers/{id}`; all saved values shown | [ ] | [ ] | – |
| CU-06 | Search by criteria | lastName `~ ELWEB_TEST` | Both test customers listed; row click loads full record | [ ] | [ ] | – |
| CU-07 | Update | Change email, phoneNumber, notes → Save | Dialog shows 3 changed fields; `PUT /v1/customers/{id}`; "Customer saved successfully" | [ ] | [ ] | [ ] |
| CU-08 | Update termination | Set terminationDate + terminationReason → Save | Persisted | [ ] | [ ] | [ ] |
| CU-09 | Update – clear field | Clear email → Save | Sent as `null`; DB column null | [ ] | [ ] | [ ] |
| CU-10 | Delete | Loaded record | **No Delete button**; `DELETE /v1/customers/{id}` via API → record status (expect 404/405) | [ ] | [ ] | [ ] |
| CU-11 | Not found | customerId=`999999999` | "Record not found" / 404 | [ ] | [ ] | – |

```sql
SELECT jurpersonid, jurtype, etternamn, fornamn, foodseldato, foretaksnr, adresse, postnr, poststad,
       epost, telefonnr, mobiltlfnr, notat, terminationdate, terminationreasonid, loggbrukarny, loggbrukarsist
FROM   felles.efjurperson
WHERE  jurpersonid IN (<<CU-02 id>>, <<CU-03 id>>);
```

### 2.2 Element type — `/contract/elementtype`

Lookups: `GET /api/v1/element-types/lookups`; elements: `GET /api/v1/element-types/{id}/elements` (tab `EKELEMENT`).

| ID | Operation | Steps | Expected | UI | API | DB |
|----|-----------|-------|----------|----|-----|----|
| ET-01 | Lookups | Open page | Unit / period dropdowns populated | [ ] | [ ] | – |
| ET-02 | Create | New → fill name `ELWEB_TEST_ET`, unit, period → Save → Create | `POST /api/v1/element-types` returns new number; "Element type created successfully"; form locks with new id | [ ] | [ ] | [ ] |
| ET-03 | Create – BFF validation | Invalid/missing required value | Toast shows ProblemDetails `detail`/`title` (fallback "Save failed (HTTP nnn)") | [ ] | [ ] | [ ] |
| ET-04 | Search by id | elementType=`<new id>` | Record loaded | [ ] | [ ] | – |
| ET-05 | Search | Name `~ ELWEB_TEST` | Results sorted by elementType ascending | [ ] | [ ] | – |
| ET-06 | Elements | Double-click result / open Element tab | `GET /{id}/elements` rows shown (empty for new type) | [ ] | [ ] | [ ] |
| ET-07 | Update | Change name/unit → Save | `PUT /{id}` then refresh `GET /{id}`; form shows persisted values | [ ] | [ ] | [ ] |
| ET-08 | Delete – cancel | Delete → dialog "Delete element type {id}? This action cannot be undone." → Cancel | Nothing deleted | [ ] | – | [ ] |
| ET-09 | Delete – confirm | Delete → Delete | `DELETE /{id}`; "Element type {id} deleted successfully"; form & results cleared | [ ] | [ ] | [ ] |
| ET-10 | Delete in use | Delete an element type referenced by contracts | Error toast (BFF message); row still exists | [ ] | [ ] | [ ] |
| ET-11 | After delete | Search by deleted id | Not found | [ ] | [ ] | [ ] |

```sql
SELECT * FROM kunde.ekprodukt WHERE produktnr = <<ET-02 id>>;
SELECT COUNT(*) FROM kunde.ekelement WHERE produktnr = <<id>>;   -- ET-06/ET-10
```

### 2.3 Zone settings — `/metering-point/zone-settings`

Service: `src/services/zoneSettingsApi.ts` (errors formatted by `formatZoneSettingsError`).

| ID | Operation | Steps | Expected | UI | API | DB |
|----|-----------|-------|----------|----|-----|----|
| ZS-01 | Create | New → fill fields → Save → Create | `POST /api/v1/zone-settings` returns zoneNumber; form reloaded via `GET /{id}` | [ ] | [ ] | [ ] |
| ZS-02 | Create – duplicate/invalid | Duplicate key / invalid value | Formatted ProblemDetails error | [ ] | [ ] | [ ] |
| ZS-03 | Search by id | zoneNumber=`<new>` | Loaded | [ ] | [ ] | – |
| ZS-04 | Search | Non-key criteria | `POST /api/v1/zone-settings/search` with `pageSize`=limit; results listed | [ ] | [ ] | – |
| ZS-05 | Update | Change a field → Save | `PUT /{id}`, then `GET /{id}` refresh shows new value | [ ] | [ ] | [ ] |
| ZS-06 | Delete | Delete button | `DELETE /{id}`; record removed; form reset. **Note: verify whether a confirm prompt exists** | [ ] | [ ] | [ ] |
| ZS-07 | Delete non-existing (API) | `DELETE /api/v1/zone-settings/999999` | 404 | – | [ ] | – |

```sql
SELECT * FROM felles.efzone WHERE zoneno = <<ZS-01 id>>;
```

### 2.4 Offer type — `/sales/offer-type`

| ID | Operation | Steps | Expected | UI | API | DB |
|----|-----------|-------|----------|----|-----|----|
| OT-01 | Create | New → name `ELWEB_TEST_OT`, defaultNetMargin, minNetMargin, maxNetMargin → Save | `POST /api/v1/offer-types`; "Offer type created successfully"; form reset to New | [ ] | [ ] | [ ] |
| OT-02 | Create – margins invalid | min > max / negative | Record BFF behaviour (validation expected) | [ ] | [ ] | [ ] |
| OT-03 | Search by name | name `ELWEB_TEST` | `GET /api/v1/offer-types?name=ELWEB_TEST` | [ ] | [ ] | – |
| OT-04 | Search all | Empty name | `GET /api/v1/offer-types` (no query) returns all | [ ] | [ ] | – |
| OT-05 | Search by id | id=`<new>`, `=` | `GET /api/v1/offer-types/{id}` | [ ] | [ ] | – |
| OT-06 | Update | Change margins → Save | `PUT /{id}` with body incl. `id`; "Offer type saved successfully"; result row updated in place | [ ] | [ ] | [ ] |
| OT-07 | Delete | Loaded record | No Delete button; API DELETE → record status | [ ] | [ ] | [ ] |
| OT-08 | Log info | Loaded record | `LogInfo` (created/changed by/date) shown and matches DB | [ ] | – | [ ] |

```sql
SELECT * FROM internpris.eitilbodstype WHERE tilbodstypenr = <<OT id>>;
```

### 2.5 Meter type register — `/metering-point/metertyperegister`

| ID | Operation | Steps | Expected | UI | API | DB |
|----|-----------|-------|----------|----|-----|----|
| MT-01 | Create | New → fill → Save | `POST /api/v1/metertyperegisters`; "Created successfully" | [ ] | [ ] | [ ] |
| MT-02 | Search by id | meterTypeRegisterId=`<id>` | `GET /{id}` | [ ] | [ ] | – |
| MT-03 | Search | Criteria | `POST /api/v1/metertyperegisters/search` (custom hook, request has only `criteria`) | [ ] | [ ] | – |
| MT-04 | Update | Change → Save | `PUT /{id}`; "Saved successfully" | [ ] | [ ] | [ ] |
| MT-05 | Save failure | Invalid data | "Save failed" | [ ] | [ ] | [ ] |
| MT-06 | Delete | Loaded record | No Delete button; API DELETE → record status | [ ] | [ ] | [ ] |
| MT-07 | SubView | Load record | SubView `TYPEGRUPPEID` tabs scoped to record; collapse/expand works | [ ] | – | – |

```sql
SELECT * FROM komponent.emtypegruppe WHERE typegrpid = <<MT id>>;
```

---

## Phase 3: Limited-Write Pages

**Goal**: Verify only the allowed write operations exist and are enforced.

### 3.1 Contract type — `/contracts/contract-type` (Update only)

| ID | Operation | Steps | Expected | UI | API | DB |
|----|-----------|-------|----------|----|-----|----|
| CT-01 | No create | Open page | No **New** button | [ ] | – | – |
| CT-02 | Search by id | contractTypeNumber=`<id>` | `GET /api/v1/contract-types/{id}` | [ ] | [ ] | – |
| CT-03 | Search | Criteria | `POST /api/v1/contract-types/search` | [ ] | [ ] | – |
| CT-04 | Update | Toggle ownLedger / invoiceStatusGroup → Save | `PUT /{id}` with configuration body; "Contract type saved successfully" | [ ] | [ ] | [ ] |
| CT-05 | Business rule | ignoreCombinedInvoice=1 **and** forceCombinedInvoice=1 → Save | "Ignore Combined Invoice and Force Combined Invoice cannot both be selected"; **no PUT sent** | [ ] | – | [ ] |
| CT-06 | Business rule via API | Same combination via Postman PUT | Record BFF response (should also reject) | – | [ ] | [ ] |
| CT-07 | Create via API | `POST /api/v1/contract-types/` | Record status (expect 404/405) | – | [ ] | [ ] |
| CT-08 | Restore | Revert CT-04 changes | DB values equal original | [ ] | – | [ ] |

### 3.2 Event reason — `/common/event-reason` (Create only)

| ID | Operation | Steps | Expected | UI | API | DB |
|----|-----------|-------|----------|----|-----|----|
| ER-01 | Create | New → reasonName `ELWEB_TEST_ER` → Save → Create | `POST /v1/event-reasons {reasonName}` → `reasonNo` shown; "Created successfully" | [ ] | [ ] | [ ] |
| ER-02 | Create empty name | Save with blank name | Sent as `""`; record BFF validation; "Save failed" | [ ] | [ ] | [ ] |
| ER-03 | Search by id | reasonNo only, `=` | `GET /v1/event-reasons/{id}` | [ ] | [ ] | – |
| ER-04 | Search by id + name | reasonNo + reasonName | Uses `POST /api/v1/event-reasons/search` (not direct GET) | [ ] | [ ] | – |
| ER-05 | Lookup error | Non-existing id | "Lookup failed" | [ ] | [ ] | – |
| ER-06 | No update | Load record, edit name | No Save button while loaded | [ ] | – | – |
| ER-07 | Update via API | `PUT /v1/event-reasons/{id}` | Record status (expect 404/405) | – | [ ] | [ ] |

```sql
SELECT * FROM felles.efreason WHERE reasonno = <<ER-01 id>>;
```

### 3.3 Facility type — `/supervision/facility-type` (Create only)

Lookups: `GET /api/v1/facility-types/lookups` (inspectionAreas, activityTypes, riskClasses).

| ID | Operation | Steps | Expected | UI | API | DB |
|----|-----------|-------|----------|----|-----|----|
| FT-01 | Lookups | Open page | Inspection area / activity type / risk class dropdowns populated | [ ] | [ ] | – |
| FT-02 | Lookups fail | Block lookups request (DevTools) | ErrorView shown; fields do **not** fall back to free number input | [ ] | – | – |
| FT-03 | Create | New → facilityType `ELWEB_TEST_FT`, fromDate, toDate, inspectionAreaNo, activityTypeNo, riskClassNo, inspectionFrequency → Save → Create | `POST /api/v1/facility-types/`; new number adopted; form locks | [ ] | [ ] | [ ] |
| FT-04 | Create – invalid dates | toDate < fromDate | ProblemDetails error ("Create failed" fallback) | [ ] | [ ] | [ ] |
| FT-05 | Search by id | facilityTypeNo=`<id>` | `GET /api/v1/facility-types/{id}`; 404 → "Record not found" | [ ] | [ ] | – |
| FT-06 | Search | Criteria | `POST /api/v1/facility-types/search` | [ ] | [ ] | – |
| FT-07 | Update blocked | Load record → Save button | Disabled while loaded; if forced: "Facility types cannot be changed after they are created" | [ ] | – | [ ] |
| FT-08 | Update via API | `PUT /api/v1/facility-types/{id}` | Record status (expect 404/405) | – | [ ] | [ ] |
| FT-09 | SubView | Load record | Tabs scoped by `TYPEANLEGGNR` | [ ] | – | – |

```sql
SELECT * FROM tilsyn.ettypeanlegg WHERE typeanleggnr = <<FT-03 id>>;
```

### 3.4 Inspection type — `/supervision/inspectiontype` (Create only)

| ID | Operation | Steps | Expected | UI | API | DB |
|----|-----------|-------|----------|----|-----|----|
| IT-01 | Create | New → inspectionCode, inspectionType `ELWEB_TEST_IT`, explanation → Save → Create | `POST /api/v1/inspection-types/` returns number; "Created successfully" | [ ] | [ ] | [ ] |
| IT-02 | Create – duplicate code | Reuse existing inspectionCode | ProblemDetails error | [ ] | [ ] | [ ] |
| IT-03 | Search by id | inspectionTypeNo=`<id>` | `GET /api/v1/inspection-types/{id}`; 404 → "Record not found" | [ ] | [ ] | – |
| IT-04 | Search | Criteria | `POST /api/v1/inspection-types/search` | [ ] | [ ] | – |
| IT-05 | Update blocked | Load record | Save disabled; "Inspection types cannot be changed after they are created" | [ ] | – | [ ] |
| IT-06 | Update via API | `PUT /api/v1/inspection-types/{id}` | Record status | – | [ ] | [ ] |

```sql
SELECT * FROM tilsyn.etinspeksjonstype WHERE inspeksjonstypenr = <<IT-01 id>>;
```

---

## Phase 4: Read-Only Pages

**Goal**: Search + search-by-id work; no write action exists in UI; direct write API calls are rejected.

| ID | Page | Test | Expected | UI | API | DB |
|----|------|------|----------|----|-----|----|
| CO-01 | County | Search by id `countyNo` | `GET /api/v1/counties/{id}` loads record | [ ] | [ ] | [ ] |
| CO-02 | County | Search by name `~` | `POST /api/v1/counties/search` | [ ] | [ ] | [ ] |
| CO-03 | County | Buttons | Only Search / Cancel / EditToggle (no New/Save) | [ ] | – | – |
| CO-04 | County | API `POST /api/v1/counties/`, `PUT /{id}`, `DELETE /{id}` | Rejected; DB unchanged | – | [ ] | [ ] |
| EV-01 | Event type | Search by name (default operator `~`) | Partial match works without changing operator | [ ] | [ ] | [ ] |
| EV-02 | Event type | Search by id with PK hidden | PK not used (hidden) – goes via search | [ ] | – | – |
| EV-03 | Event type | Unhide `eventTypeNo` in editor → search by id | `GET /api/v1/eventtypes/{id}` | [ ] | [ ] | – |
| EV-04 | Event type | Loaded record | Fields read-only; only Search/Cancel/EditToggle | [ ] | – | – |
| EV-05 | Event type | API POST/PUT/DELETE | Rejected | – | [ ] | [ ] |
| EC-01 | Error codes | Search with criteria matching many | `POST /api/v1/errorcodes/search`; list shown | [ ] | [ ] | [ ] |
| EC-02 | Error codes | Search matching exactly one | Record auto-loaded **and** results panel stays open | [ ] | [ ] | – |
| EC-03 | Error codes | Row select | `GET /api/v1/errorcodes/{id}`; failure → "Could not load the selected error code" | [ ] | [ ] | – |
| EC-04 | Error codes | Buttons / API writes | No New/Save; API writes rejected | [ ] | [ ] | [ ] |
| TT-01 | Template type | Search by name | `GET /api/v1/template-types?templateTypeName=…` | [ ] | [ ] | [ ] |
| TT-02 | Template type | No match | "No template types found" | [ ] | [ ] | – |
| TT-03 | Template type | Row select | Row loaded into form without extra GET | [ ] | – | – |
| TT-04 | Template type | Buttons / API writes | No New/Save/Delete; API writes rejected | [ ] | [ ] | [ ] |
| AP-01 | Automated processes | Search by `functionNumber` only, `=` | `GET /api/v1/automated-processes/{id}`; detail tab opens | [ ] | [ ] | [ ] |
| AP-02 | Automated processes | functionNumber + other field | Goes via `/search` (shortcut not taken) | [ ] | [ ] | – |
| AP-03 | Automated processes | Bulk search | Results list; detail tab **not** auto-opened | [ ] | [ ] | – |
| AP-04 | Automated processes | Select row | "Next possible process" tab loads `GET /{id}/next-possible` | [ ] | [ ] | [ ] |
| AP-05 | Automated processes | next-possible fails | "Could not load next possible processes" | [ ] | – | – |
| AP-06 | Automated processes | Buttons / API writes | Only Search/Cancel/EditToggle; writes rejected | [ ] | [ ] | [ ] |
| AD-01 | Address | Search | No-op (no `onSearch`) – log as **known gap** | [ ] | – | – |
| AD-02 | Address | New → Save | Nothing persisted (`onSave` TODO) – log as **known gap** | [ ] | – | [ ] |

```sql
-- AP-04: compare next-possible list with DB
SELECT * FROM felles.efautoprocesspossiblefunc WHERE functionno = <<AP id>>;
-- Read-only pages: row counts before/after Phase 4 must be identical
SELECT COUNT(*) FROM <<owner.table>>;
```

Record observed status codes for write attempts:

| Endpoint | POST | PUT | DELETE |
|----------|------|-----|--------|
| `/api/v1/counties` | | | |
| `/api/v1/eventtypes` | | | |
| `/api/v1/errorcodes` | | | |
| `/api/v1/template-types` | | | |
| `/api/v1/automated-processes` | | | |
| `/api/v1/contract-types` (POST/DELETE only) | | – | |
| `/v1/event-reasons` (PUT/DELETE only) | – | | |
| `/api/v1/facility-types` (PUT/DELETE only) | – | | |
| `/api/v1/inspection-types` (PUT/DELETE only) | – | | |
| `/v1/customers` (DELETE only) | – | – | |
| `/api/v1/offer-types` (DELETE only) | – | – | |
| `/api/v1/metertyperegisters` (DELETE only) | – | – | |

---

## Phase 5: Extras — SubView, Field Editor, Customer Jobs

### 5.1 SubView detail tabs

| ID | Page | SubView parentId | Expected | Result |
|----|------|------------------|----------|--------|
| SV-01 | Customer | `KUNDE` (identity `JURPERSONID`) | Tabs load data for loaded customer | ⚠️ Tabs load (31), first tab `V_EFJURPERSONROLLER` data `{JURPERSONID:41114}` → 0 rows, but ~20 s fields call — DEF-04 |
| SV-02 | County | `FYLKE` (`FYLKENR`) | Tabs scoped to county | |
| SV-03 | Element type | `PRODUKTREGISTER` (`PRODUKTNR`), detail tab `EKELEMENT` | Element tab shows rows | |
| SV-04 | Event type | `EVENTREASONCONTEXT` (`REASONCONTEXTNO`) | Scoped | |
| SV-05 | Event reason | `EVENTREASON` (`REASONNO`) | Scoped | |
| SV-06 | Offer type | `TILBODSTYPENR` | Scoped | |
| SV-07 | Facility type | `TYPEANLEGGTILSOBJ` (`TYPEANLEGGNR`) | Scoped | |
| SV-08 | Meter type register | `TYPEGRUPPEID` | Scoped | |
| SV-09 | Template type | `TEMPLATETYPE` | Results shown | |
| SV-10 | Automated processes | `AUTOPROCESSFUNCTION` (`FUNCTIONNO`), excluded `EFAUTOPROCESSPOSSIBLEFUNC` | Excluded tab replaced by English "Next possible process" | |
| SV-11 | Any | Switch record | Tabs refetch for new parent (no stale data) | |
| SV-12 | Any | Collapse / expand panel | State honoured; search keeps panel open | |
| SV-13 | Any | Search results > limit | Total count displayed; `hasMore` indicated | |

### 5.2 Field editor (layout customization)

Run on Customer, plus one read-only page (Error codes) and one create-only page (Facility type).

| ID | Step | Expected | Result |
|----|------|----------|--------|
| FE-01 | Click settings (EditToggle) | Editor banner shown; `GET /v1/fieldcustomizations/{pageKey}/custom` | |
| FE-02 | Drag a field to another column/row | Position changes | |
| FE-03 | Change width | Width applied | |
| FE-04 | Hide field | Moves to Hidden section; excluded from search criteria | |
| FE-05 | Unhide field | Back in layout | |
| FE-06 | Save Layout | `POST /v1/fieldcustomizations/{pageKey}/custom`; edit mode exits | |
| FE-07 | Reload page | Custom layout persists for the user | |
| FE-08 | Log in as other user | Other user sees default layout | |
| FE-09 | Reset | Default layout restored locally (custom not deleted server-side) | |
| FE-10 | Cancel in editor | Unsaved layout changes discarded | |

### 5.3 Customer jobs drawer

| ID | Step | Expected | Result |
|----|------|----------|--------|
| JB-01 | No customer loaded | Jobs drawer disabled | |
| JB-02 | Load customer → open drawer | `GET`/`POST /v1/customers/{id}/jobs` → list with label, icon, tooltip, enabled | ❌ FAIL (HAR): `POST /api/v1/customers/41114/jobs` → 404 — DEF-03 |
| JB-03 | Disabled job (`enabled=false` / `enableJobWhen` not met) | Cannot execute | |
| JB-04 | Execute job without input | `POST /v1/customers/{id}/jobs/{jobName}`; drawer closes; signal dispatched | |
| JB-05 | Job with `requiresInput` | Form loaded via `…/jobs/{jobName}/form`; submit sends input | |
| JB-06 | Signal `refresh` | Customer reloaded via `GET /v1/customers/{id}` | |
| JB-07 | Signal `message` / `dialog` / `url` / `report` | Correct UI reaction | |
| JB-08 | Job failure | Toast `Job "<name>" failed` | |
| JB-09 | DB effect | Verify job side effects in DB (job-specific) | |

---

## Phase 6: Results, Defects & Cleanup

### 6.1 Results matrix

| Page | Create | Update | Delete | Search | Search by id | Negative | SubView | Notes |
|------|--------|--------|--------|--------|--------------|----------|---------|-------|
| Customer | | | n/a | | | | | |
| Element type | | | | | | | | |
| Zone settings | | | | | | | | |
| Offer type | | | n/a | | | | | |
| Meter type register | | | n/a | | | | | |
| Contract type | n/a | | n/a | | | | | |
| Event reason | | n/a | n/a | | | | | |
| Facility type | | n/a | n/a | | | | | |
| Inspection type | | n/a | n/a | | | | | |
| County | n/a | n/a | n/a | | | | | |
| Event type | n/a | n/a | n/a | | | | | |
| Error codes | n/a | n/a | n/a | | | | | |
| Template type | n/a | n/a | n/a | | n/a | | | |
| Automated processes | n/a | n/a | n/a | | | | | |
| Address | gap | gap | n/a | gap | n/a | | n/a | not implemented |

### 6.2 Created Data Log

| Page | Test ID | Created id | Created at | Cleaned up |
|------|---------|-----------|-----------|------------|
| | | | | [ ] |

### 6.3 Defects

| # | Test ID | Summary | Severity | Jira |
|---|---------|---------|----------|------|
| DEF-01 | X-08 / CU-06 | Customer search by criteria broken: `POST /api/v1/customers/search` returns **405** (`UPSTREAM_ERROR`) — BFF route exists but upstream (Nexus.Core) does not accept POST search | High | |
| DEF-02 | X-10 | Upstream errors surface as ProblemDetails `detail: "API Error: "` with no message — user cannot tell what failed | Medium | |
| DEF-03 | JB-02 | Customer jobs: `POST /api/v1/customers/{id}/jobs` returns **404** (empty body); SPA retries 4× per load and posts the full form record as body | High | |
| DEF-04 | SV-01 | SubView performance: `GET /api/v1/views/KUNDE/details/V_EFJURPERSONROLLER/fields` took **~20 s**, data `POST` ~9.8 s (empty result) | Medium | |
| DEF-05 | FE-01 / FE-08 | Field customizations requested with `?userId=default` instead of the logged-in user — per-user layouts may be shared across users (verify in FE-08) | Medium | |

Known findings to raise if confirmed:
- Address page save/search not implemented (`useStandardPage` with TODO `onSave`, no `onSearch`).
- Zone settings delete — confirm whether a confirmation prompt exists (element type has one).

### 6.4 Cleanup (Utvikling)

Prefer UI/API delete where supported (element type, zone settings). For the rest, run after review — **confirm table names from Phase 0 and get approval before executing DELETE on shared Utvikling data**.

```sql
-- Preview first
SELECT 'OT' t, tilbodstypenr id FROM internpris.eitilbodstype WHERE tilbodstypenamn LIKE 'ELWEB_TEST_%'
UNION ALL SELECT 'ER', reasonno FROM felles.efreason WHERE reasonname LIKE 'ELWEB_TEST_%'
UNION ALL SELECT 'FT', typeanleggnr FROM tilsyn.ettypeanlegg WHERE typeanlegg LIKE 'ELWEB_TEST_%'
UNION ALL SELECT 'IT', inspeksjonstypenr FROM tilsyn.etinspeksjonstype WHERE inspeksjonstype LIKE 'ELWEB_TEST_%'
UNION ALL SELECT 'MT', typegrpid FROM komponent.emtypegruppe WHERE fabrikat LIKE 'ELWEB_TEST_%'
UNION ALL SELECT 'CU', jurpersonid FROM felles.efjurperson WHERE etternamn LIKE 'ELWEB_TEST_%';

-- Then delete per entity (verify child references first)
DELETE FROM internpris.eitilbodstype   WHERE tilbodstypenamn LIKE 'ELWEB_TEST_%';
DELETE FROM komponent.emtypegruppe     WHERE fabrikat LIKE 'ELWEB_TEST_%';
DELETE FROM felles.efreason            WHERE reasonname LIKE 'ELWEB_TEST_%';
DELETE FROM tilsyn.ettypeanlegg        WHERE typeanlegg LIKE 'ELWEB_TEST_%';
DELETE FROM tilsyn.etinspeksjonstype   WHERE inspeksjonstype LIKE 'ELWEB_TEST_%';
-- Customers: prefer termination via UI (CU-08) over physical delete
COMMIT;

-- Contract type: restore original values recorded in Phase 0.3 (ERKONTRAKTTYPE is a view; update via base table if needed)
UPDATE reskontro.erkontrakttype_ptab SET <<cols>> = <<original values>> WHERE kontrakttypenr = <<id>>;
COMMIT;
```

- [ ] Field customizations: Reset + Save Layout on each page used in 5.2.
- [ ] Re-run Phase 0.3 row counts — read-only tables unchanged.
- [ ] Results matrix complete, defects logged.

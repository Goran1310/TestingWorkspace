# MeterValues Coverage Test Plan - Week37_Sep26

**Plan Created**: September 7, 2026  
**Scope**: `Perigon.Modules.MeterValues` and `Perigon.Modules.MeterValues.Domains`  
**Coverage Source**: `C:\Users\goran.lovincic\Downloads\code-coverage-report-3631\coveragereport`  
**Status**: Planned

---

## Executive Summary

This plan targets the MeterValues-specific gaps measured in coverage report 3631. The report contains 200 MeterValues classes with **3,535 of 4,794 executable lines covered (73.7%)** and **537 of 1,308 branches covered (41.1%)**.

Coverage work is organized by testability and business value. The first batch covers the large, low-coverage repository surface using unit tests and mocked database abstractions. The next batches cover untested controller action behaviour and selected service branch gaps. DTO-only and registration-only gaps are not a priority because they add little behavioural confidence.

## Test Scope

### Included

- NUnit + NSubstitute unit tests for MeterValues repositories, services, and controllers
- Stored-procedure routing, parameter construction, result propagation, and empty-result handling
- Controller action results, session-backed state, and meaningful request validation branches
- Existing test projects:
  - `tests/Perigon.Modules.MeterValues.Domains.UnitTests`
  - `tests/Perigon.Modules.MeterValues.UnitTests`

### Excluded

- Live Oracle integration testing
- Browser/UI end-to-end scenarios
- DTO property-only coverage without validation or mapping logic
- `MeterValuesModulesRegistrator`, policy-builder, and Autofac wiring coverage unless a registration defect is reported

## Coverage Findings And Priorities

| Priority | Class | Current Coverage | Uncovered Lines | Uncovered Branches | Coverage Gap |
|---|---|---:|---:|---:|---|
| P0 | `MeteringSeriesGroupsRepository` | 18.8% | 146 | 34 | Broad CRUD, membership, search, and QC procedure surface. |
| P0 | `EntityLevelRepository` | 18.3% | 125 | 10 | Grid, transformer, metering point, series, value, and time-series retrievals. |
| P0 | `CommonRepository` | 16.3% | 118 | 0 | Shared lookup methods are largely untested. |
| P1 | `GlobalSearchController` | 0% | 128 | 54 | All query/form/clear action paths are untested. |
| P1 | `MeteringSeriesGroupsController` | 29.1% | 90 | 37 | Group CRUD/member workflows have substantial uncovered behaviour. |
| P1 | `GlobalSearchRepository` | 22.7% | 51 | 0 | Search procedure parameter and result handling is mostly untested. |
| P1 | `HomeController` | 0% | 48 | 6 | Dashboard, missing-values, run-control, and documentation actions are untouched. |
| P1 | `MeteringPointRepository` | 27.8% | 44 | 6 | Metering-point retrieval and search repository paths remain low. |
| P1 | `CalculationsRepository` | 25.4% | 44 | 4 | Calculation procedure result and feedback paths remain low. |
| P2 | `MeterValuesMetadataService` | 63.6% | 20 | 24 | Branch density warrants explicit behavioural tests. |
| P2 | `MeteringSeriesGroupsService` | 93.7% | 9 | 34 | Line coverage is high, but decision coverage remains incomplete. |

## Sprint A - Repository Foundation

### MeteringSeriesGroupsRepository

Extend or create focused method tests for the following uncovered public operations:

- Reads: `GetMeteringSeriesGroupsAsync`, `GetMeteringSeriesGroupAsync`, `GetMSGroupsMembersAsync`, `GetMSGroupsMemberAsync`, `GetMSGroupTypesAsync`, `GetQualityControlParametersAsync`, `GetMSGroupsSearchAsync`
- Group changes: `NewMeteringSeriesGroup`, `EditMeteringSeriesGroup`, `CreateMSGroup`
- Membership changes: `AddMSGroupsMembersAsync`, `DeleteMSGroupsMembersAsync`, `AddToMSGroup`, `EditMSGroupMemberDatesAsync`
- Quality control: `EditQualityControlParametersAsync`, `RunQualityControl`

**Scenarios and acceptance criteria**

1. Each read method returns the configured data and uses the expected procedure name and key search/filter values.
2. Each change method propagates configured IDs, feedback, or result objects and supplies required input parameters.
3. Cover empty enumerable and no-result responses where the implementation exposes them.
4. Cover date-boundary and optional-member inputs in methods that branch on them.

### EntityLevelRepository

Create or extend tests for:

- `GetMeteringGridAreaAsync`
- `GetTransformerCircuitAsync` and `GetTransformerCircuitsAsync`
- `GetMeteringPointAsync` and `GetMeteringPointsAsync`
- `GetMeteringSerieAsync`, `GetMeteringSeriesAsync`, and `GetMeteringSeriesMPSAsync`
- `GetMeterValueAsync`, `GetMeterValuesAsync`, `GetMeterValueTimeSeriesAsync`, and `GetMeterValueBulkReadingsAsync`

**Acceptance criteria**

- Verify `IOracleDatabaseConnection.ExecuteProcedureAsync<T>` procedure routing and the request-derived Oracle parameters.
- Assert return propagation for populated and empty configured repository responses.
- Cover overloads or distinct request forms individually; do not rely only on constructor coverage.

### CommonRepository

Create method-level tests for the untouched shared lookup surface:

- `GetMSGroupTypes`, `GetDirectionOfFlow`, `GetHubStatus`, `GetCommodity`, `GetAggregate`, `GetToubucket`, `GetUnit`, `GetReader`
- `GetComputationtype`, `GetGridAreatype`, `GetOffsetRule`, `GetMSGroupSourceTable`, `GetMultipliers`, `GetAccumulations`
- `GetSettlementMethods`, `GetReadingTypes`, `GetMeasurementKinds`

**Acceptance criteria**

- Group tests by common `ExecuteProcedureAsync<T>` shape only after verifying individual procedure names and result types.
- Each test asserts the returned collection/value and one interaction with the database abstraction.

## Sprint B - Search And Controller Workflows

### GlobalSearchRepository And GlobalSearchController

Add repository tests for `Search`, then controller tests for:

- `MeteringpointQuery`
- `TranslateLocalizedKeysIntoEnglish`
- `SplitDelSiteAddress`
- `MeteringpointForm`
- `MeteringpointClearForm`

**Scenarios and acceptance criteria**

1. Valid criteria return mapped results and preserve the expected form/search state.
2. Empty criteria or empty repository responses produce the implementation's intended empty result.
3. Address splitting covers populated, partial, and absent address input.
4. Clear-form behaviour resets the relevant session/view-model state and does not retain stale criteria.
5. Cover alternative localized-key input so the controller’s translation branch is executed.

### MeteringSeriesGroupsController

Add targeted tests for uncovered group and member actions:

- `Query`, `Index`, `GetMSGroupWithMembers`, `MSOverview`
- `EditQualityControlParameters`, both `NewMSGroup` forms, `SearchMp`
- `AddMember`, `AddMembers`, `AddMembersBody`, `RefreshMemberTable`
- `DeleteMember`, `DeleteMembers`, `EditMemberDates`, `SetTerms`, `MSGroupRunControl`, `SearchWithMPNo`

**Acceptance criteria**

- Assert action result type/payload, service arguments, and route values.
- Cover successful and empty/not-found paths, plus invalid/edge member data where validation is implemented in the controller.
- Verify session-backed group search state is preserved or cleared as intended.

### HomeController And QueryController

Add focused tests for currently untested public actions:

- `HomeController`: `Index`, `MissingValues`, `SetTermsMissingValues`, `RunControl`, `Documentation`
- `QueryController`: saved-search filter CRUD, favourites, `ReadingTypeAttributes`, `SearchMeteringSeries`, `GetMSGroupTypes`, `GetMSGroups`, `CreateMSGroup`, `AddToMSGroup`, `GetUsername`

## Sprint C - Residual Business-Logic Branches

### MeterValuesMetadataService

Add tests to cover the remaining 24 branches by exercising each metadata source/result combination. Assert the returned metadata shape, not just service calls.

### MeteringSeriesGroupsService

Add tests for the 34 uncovered branches despite its 93.7% line coverage. Prioritize optional dates, empty member/group data, duplicate/invalid input handling, and status/result differences.

### Deferred Repository Follow-Up

After Sprints A-B, add tests for the remaining low-coverage repositories:

- `MeteringPointRepository` (44 lines, 6 branches)
- `CalculationsRepository` (44 lines, 4 branches)
- `QualityControlRepository` (27 lines, 4 branches)
- `HomeRepository` (12 lines)
- `OverviewRepository` (8 lines)

## Test Design Constraints

- Configure `ExecuteProcedureAsync<T>` with the exact return type used by the method under test.
- When a repository uses `IDatabaseConnection.InTransation<T>`, configure the concrete inferred `T` and invoke the callback; a substitute return alone can leave the lambda body uncovered.
- Use `Arg.Is<T>` to verify properties of objects constructed inside the system under test.
- Do not `await` NSubstitute `Received()` verification calls.
- Use period decimal separators in string test data where parsing is involved.

## Risks And Mitigations

| Risk | Mitigation |
|---|---|
| High repository count produces repetitive, shallow tests. | Group only structurally identical methods and assert the distinct procedure name and important parameters for every method. |
| Substitutes do not execute database transaction callbacks. | Configure the exact generic callback signature and invoke it from the mock return delegate. |
| Session-dependent controllers require complex setup. | Reuse the module's existing session test helpers and begin with action paths that do not need rendering infrastructure. |
| High branch gaps remain hidden behind high line coverage. | Track branch deltas for `MeterValuesMetadataService` and `MeteringSeriesGroupsService` separately from line coverage. |
| Report results become stale after implementation. | Regenerate coverage after every completed sprint and use the final differential report for completion. |

## Validation

```powershell
dotnet build Perigon.slnx

dotnet test tests/Perigon.Modules.MeterValues.Domains.UnitTests/Perigon.Modules.MeterValues.Domains.UnitTests.csproj --filter "FullyQualifiedName~MeteringSeriesGroupsRepository|FullyQualifiedName~EntityLevelRepository|FullyQualifiedName~CommonRepository|FullyQualifiedName~GlobalSearchRepository"

dotnet test tests/Perigon.Modules.MeterValues.UnitTests/Perigon.Modules.MeterValues.UnitTests.csproj --filter "FullyQualifiedName~GlobalSearchController|FullyQualifiedName~MeteringSeriesGroupsController|FullyQualifiedName~HomeController|FullyQualifiedName~QueryController|FullyQualifiedName~MeterValuesMetadataService|FullyQualifiedName~MeteringSeriesGroupsService"
```

Before marking the plan complete, run the repository-standard differential coverage command against the actual PR base and current head. Record only the final completed differential report.

## Progress Tracker

- [x] Coverage report 3631 inspected
- [x] MeterValues coverage baseline and class-level gaps extracted
- [x] Week37_Sep26 MeterValues test plan created
- [ ] Sprint A repository tests implemented and passing
- [ ] Sprint B search and controller tests implemented and passing
- [ ] Sprint C business-logic branch tests implemented and passing
- [ ] Differential coverage report generated and reviewed
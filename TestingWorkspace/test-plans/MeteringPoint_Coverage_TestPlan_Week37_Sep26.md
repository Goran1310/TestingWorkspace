# MeteringPoint Coverage Test Plan - Week37_Sep26

**Plan Created**: September 7, 2026  
**Scope**: `Perigon.Modules.MeteringPoint` and `Perigon.Modules.MeteringPoint.Domains`  
**Coverage Source**: `C:\Users\goran.lovincic\Downloads\code-coverage-report-3631\coveragereport`  
**Status**: Planned

---

## Executive Summary

This plan targets uncovered executable code in the MeteringPoint module identified from coverage report 3631. The report covers 746 MeteringPoint classes: **13,586 of 16,445 executable lines (82.6%)** and **2,254 of 4,957 branches (45.5%)**.

The first implementation batch prioritizes repository code that is completely untested and can be exercised with fast NUnit and NSubstitute unit tests. Process repositories and the branch-heavy overview controller are planned as follow-up batches because they need broader setup and behavioural assertions.

## Test Scope

### Included

- Unit tests in `tests/Perigon.Modules.MeteringPoint.UnitTests/Domains/Repositories`
- Oracle procedure routing, input parameter construction, transaction callback execution, and returned-result behaviour
- Null, empty, and alternative-input cases where production code branches
- Controller unit tests only for the highest-value uncovered paths in `OverviewController`

### Excluded

- Direct Oracle integration tests
- UI or browser end-to-end tests
- Production refactoring solely to improve coverage
- Generated DTOs and trivial property-only classes unless they contain business logic

## Coverage Findings And Priorities

| Priority | Class | Current Coverage | Uncovered Lines | Coverage Gap |
|---|---|---:|---:|---|
| P0 | `PtabRepository` | 0% | 422 | 51 lookup/retrieval methods have no executable coverage. |
| P0 | `UserWidgetSettingsRepository` | 0% | 87 | Template reads, properties read, create/update, delete, and category retrieval are untested. |
| P0 | `AcAddressRepository` | 0% | 63 | Country, region, municipality, postal-code, and street lookup methods are untested. |
| P1 | `GlobalSearchRepository` | 17.5% | 66 | The transaction callback is not invoked by existing tests; both surname and business-name parameter branches are uncovered. |
| P1 | `UserWidgetConfigRepository` | 0% | 52 | User-widget configuration persistence paths are untouched. |
| P1 | `AddressRepository` | 24.1% | 69 | Meteringpoint360 address data retrieval and mapping remain mostly uncovered. |
| P1 | `ConstructionPowerProcessRepository` | 42.0% | 51 | Process persistence/retrieval methods need targeted tests. |
| P1 | `FaultHandlingCompProcessRepository` | 44.0% | 47 | Process state and response paths remain partially uncovered. |
| P2 | `OverviewController` | 83.5% | 31 | 180 branches are uncovered; prioritize decision paths over simple action reachability. |

## Sprint A - Common Repository Baseline

### PtabRepository

Create `PtabRepositoryTests.cs` with parameterized or grouped tests for the 51 uncovered methods. Cover representative method families first, then complete the remaining procedure names and return types:

- Lookup methods: `GetDocTypes`, `GetCustomerTypes`, `GetWrittenForms`, `GetHanportStatus`, `GetMarketMessagesDocType`
- Metering/configuration methods: `GetMpTypes`, `GetSubMpTypes`, `GetConsSubMpTypes`, `GetProdSubMpTypes`, `GetSettlementMethods`, `GetSettlementStatus`
- Equipment/technical methods: `GetComponentTypes`, `GetStorageTypes`, `GetComponentReasons`, `GetReadingTypes`, `GetReadingEacTypes`, `GetComponentLocations`, `GetAntennaTypes`
- Contract/tariff methods: `GetContractGroupPower`, `GetInvoiceLayouts`, `GetContractStartreasons`, `GetPrePaymentOptions`, `GetContractEndReasons`, `GetPaymentTerms`, `GetPowerTariff`, `GetGridTariff`, `GetConsumptionTariff`, `GetElCertTariff`, `GetBuyPowerTariff`
- Remaining methods: `GetDirectionOfFlows`, `GetInstallCodes`, `GetInstallCodeReason`, `GetCabelMaterials`, `GetGridTypes`, `GetCabelMethods`, `GetMeteringGroupTypes`, `GetMetervaluesReaders`, `GetLimitypes`, `GetDeliverypriorities`, `GetUsers`, `GetReceiverGroups`, `GetSettlementGroups`, `GetBusinessCodes`, `GetCompCodes`, `GetRelations`, `GetCurrentOrNextContract`, `GetRegister`, `GetVatCodes`, `GetPriority`, `GetReadingGroup`, `GetUsageTypeNo`, `GetEACRegtypes`

**Acceptance criteria**

- Each public repository method executes its transaction callback and returns the configured query result.
- Each test verifies the expected stored procedure name and relevant input parameters.
- No test uses a real database connection.

### AcAddressRepository

Create `AcAddressRepositoryTests.cs` for:

- `GetCountries` with country code routing
- `GetRegions` with region and country code routing
- `GetMunicipalities` with municipality, region, and country inputs
- `GetPostalCodes` with postal-code lookup input
- `GetStreets` with address-search inputs

**Acceptance criteria**

- Every method invokes `IDatabaseConnection.InTransation` with the concrete `Devart.Data.Oracle.OracleConnection` callback type.
- Tests assert returned enumerables and validate the procedure-specific input values.

### UserWidgetSettingsRepository

Create `UserWidgetSettingsRepositoryTests.cs` for:

- `GetUserWidgetTemplates`
- `GetUserWidgetTemplateById`
- `GetUserWidgetTemplatePropertiesById`
- `CreateOrUpdate`
- `Delete`
- `GetMeteringPointCategory`

**Acceptance criteria**

- Retrieval tests cover a populated response and empty result where applicable.
- Mutation tests verify their procedure call and configured feedback/result handling.
- The `MPOverview-widgetTemplateSetupDisplayName` identifier is passed on template retrieval calls.

## Sprint B - Existing Partial Coverage

### GlobalSearchRepository

Extend `GlobalSearchRepositoryTests.cs` so the transaction lambda executes rather than returning from a substitute before its body runs.

- One scenario with `GS_LastName` populated validates `lastName` and `lastName_alt`.
- One scenario with `GS_LastName` null validates the business-name fallback parameters.
- Assert the remaining search parameters and the returned search results.

### Process Repositories

Add focused missing-path tests in the existing repository test layout for:

- `ConstructionPowerProcessRepository` (51 uncovered lines)
- `FaultHandlingCompProcessRepository` (47 uncovered lines)
- `ConstructionPowerCustomerRepository` (46 uncovered lines)
- `ChangeMpTypeSummaryRepository` (39 uncovered lines)
- `FaultHandlingCompMeteringpointRepository` (34 uncovered lines)

**Acceptance criteria**

- Cover successful procedure result, empty/no-result behaviour, and negative/zero feedback where exposed.
- Verify procedure selection and parameter values with property-based argument matching.

## Sprint C - Controller Branches

Add focused unit tests for uncovered decision paths in `OverviewController` after reviewing its detailed report page and source.

- Prioritize all meaningful request/session/optional-data branches before adding action-only tests.
- Assert returned action results, route values, and dependency calls.
- Defer paths requiring browser rendering or database integration.

## Risks And Mitigations

| Risk | Mitigation |
|---|---|
| Transaction callbacks are not executed by a loose substitute setup. | Configure `InTransation<T>` with the exact `Func<Devart.Data.Oracle.OracleConnection, Task<T>>` type and invoke the callback in the return delegate. |
| Oracle provider type ambiguity prevents test compilation. | Alias Devart and ODP.NET Oracle types when both are referenced. |
| Large `PtabRepository` test file becomes repetitive and brittle. | Group methods by return type/query pattern; use small local helpers only after the first repeated, validated test pattern. |
| Coverage rises without verifying business-relevant routing. | Assert procedure name, key input values, return propagation, and both sides of real conditionals. |
| Existing report is stale after changes. | Regenerate coverage and use the new report as the completion baseline. |

## Validation

```powershell
dotnet build Perigon.slnx
dotnet test tests/Perigon.Modules.MeteringPoint.UnitTests/Perigon.Modules.MeteringPoint.UnitTests.csproj --filter "FullyQualifiedName~PtabRepositoryTests|FullyQualifiedName~AcAddressRepositoryTests|FullyQualifiedName~UserWidgetSettingsRepositoryTests|FullyQualifiedName~GlobalSearchRepositoryTests"
```

Before marking this plan complete, run the repository-standard differential coverage command against the actual PR base and current head. Record only the final completed differential report.

## Progress Tracker

- [x] Coverage report 3631 inspected
- [x] MeteringPoint-specific uncovered classes ranked by executable uncovered lines
- [x] Week37_Sep26 test plan created
- [ ] Sprint A common repository tests implemented and passing
- [ ] Sprint B partial repository tests implemented and passing
- [ ] Sprint C controller branch tests implemented and passing
- [ ] Differential coverage report generated and reviewed
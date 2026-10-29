# Perigon MeteringPoint Module — Prioritized Test Plan
**Report Date**: April 13, 2026  
**Status Updated**: April 23, 2026  
**Coverage Report**: `code-coverage-report-2699` (28x Cobertura, ReportGenerator)  
**Target Project**: `Perigon.Modules.MeteringPoint.UnitTests`  
**Scope**: `Perigon.Modules.MeteringPoint` and `Perigon.Modules.MeteringPoint.Domains` assemblies only  

---

## Executive Summary

| Assembly | Line Coverage | Branch Coverage | Coverable Lines |
|---|---|---|---|
| `Perigon.Modules.MeteringPoint` | **58.8%** (6630 / 11263) | **~17.5%** (1447 / 8273) | 47,720 total lines |
| `Perigon.Modules.MeteringPoint.Domains` | **50.6%** (2702 / 5339) | **48.7%** (39 / 80) | 39,197 total lines |

**Overall project baseline**: Line 24.4%, Branch 8%  
Both MeteringPoint assemblies are **above average** for the solution — but large surface areas remain zero-covered, especially controllers, AutoMapper profiles, authorization infrastructure, and domain repositories.

### Plan Status (April 15, 2026)

| Workstream | Status | Notes |
|---|---|---|
| P1-CTRL (zero-coverage controllers) | DONE | Target controller tests created and passing. |
| P1-VALID (validators) | DONE | `EditAddressVMValidator` and `MeteringSeriesValidator` covered. |
| P1-AUTOMAPPER | DONE | Mapper/profile test suites exist across all listed workflow groups. |
| P1-REPO | DONE | All listed low-coverage repositories have corresponding test classes; high-value branch paths expanded. |
| P2-CTRL | PARTIAL | April 23 update: `FaultHandlingComp.ComponentStepController` expanded to targeted 100% class line/branch coverage; `ConstructionPower.CommonController` and `FaultHandlingComp.ReceiptController` branch gaps expanded; remaining meaningful gap is primarily `NewMeteringPointController` branch combinations. |
| P2-REPOS | PARTIAL | Core process repositories expanded; additional low-risk branches remain in several 50% repository suites. |
| P2-AUTH | DONE | `HasAdminTaskAuthorizationHandler` and `PolicyBuilder` covered. |
| P2-CONFIG | DONE | `MPAppConfiguration`, `OverviewSettings`, `HanportProcessSettings` covered, including defaults + binding metadata. |
| P2-VIEWMODELS | PARTIAL | Behavior covered through consumer tests (controller/service/mapper), but no standalone VM test classes (intentionally avoided). |
| P3-DOMAINS-DTO | DEFERRED-CLOSED | Pure data containers retained as low-value/deferred per plan policy. |
| P3-INFRA | DEFERRED-CLOSED | DI wiring and registrator remain integration-level concerns. |

---

## April 23 Delta Update

- Added focused controller tests in MeteringPoint UnitTests for:
  - `FaultHandlingComp.ComponentStepControllerTests`
  - `ConstructionPower.CommonControllerTests`
  - `FaultHandlingComp.ReceiptControllerTests`
- Verified all affected test classes pass.
- Targeted coverage run confirmed `Perigon.Modules.MeteringPoint.Controllers.FaultHandlingComp.ComponentStepController` at **100% line** and **100% branch** in class-level Cobertura metrics.
- Plan remains **PARTIAL** for `P2-CTRL` only because `NewMeteringPointController` still has uncovered branch combinations.

---

## Coverage Distribution Snapshot

### `Perigon.Modules.MeteringPoint` — Non-View Classes

| Category | Count | Dominant Status |
|---|---|---|
| Controllers (0%) | 5 | **Not tested** |
| Controllers (58–99%) | ~25 | Partially/well tested |
| Services (95–100%) | ~50 | Well tested |
| AutoMapper Profiles (0%) | **30+** | Not tested |
| Validators (0%) | 2 | Not tested |
| Authorization / Autofac (0%) | 10 | Not tested |
| ViewModels / VMs (0–28%) | ~20 | Partial/not tested |
| ViewModels / VMs (100%) | ~130 | Well tested |

### `Perigon.Modules.MeteringPoint.Domains` — Per Class

| Category | Count | Coverage Range |
|---|---|---|
| Repositories | ~30 | 24% – 58% |
| DTOs (0%) | ~50 | Not tested |
| DTOs (100%) | ~150 | Well tested |
| UWS Widget Config DTOs (0%) | 10+ | Not tested |

---

## P1 — Critical Gaps (Zero Coverage, High Business Value)

### P1-CTRL: Controllers with 0% Coverage

These controllers are entry points for key module features. Any bugs here are never caught by automated tests.

| Controller | Full Name | Recommended Test Class |
|---|---|---|
| `CommonController` | `Perigon.Modules.MeteringPoint.Controllers.Common.CommonController` | `CommonControllerTests` |
| `GlobalSearchController` | `Perigon.Modules.MeteringPoint.Controllers.Common.GlobalSearchController` | `GlobalSearchControllerTests` |
| `AddressController` | `Perigon.Modules.MeteringPoint.Controllers.Meteringpoint360.AddressController` | `AddressControllerTests` |
| `OverviewController` | `Perigon.Modules.MeteringPoint.Controllers.Meteringpoint360.OverviewController` | `OverviewControllerTests` |
| `InternalApiOverviewController` | `Perigon.Modules.MeteringPoint.Controllers.Meteringpoint360.InternalApiOverviewController` | `InternalApiOverviewControllerTests` |

**Test scenarios per controller (minimum):**
- `Index()` / main GET actions — returns correct view or JSON
- POST actions — happy path, validation failure, service exception
- Error handling — what happens when the underlying service throws?

---

### P1-REPO: Repositories with Low Coverage (24–50%)

All repositories represent Oracle data access. Covering them validates SQL parameters, result mapping, and edge cases in query construction.

| Repository | Current Coverage | Priority |
|---|---|---|
| `AddressRepository` | **24.1%** | Highest |
| `AddressWidgetRepository` | **32.7%** | High |
| `MeteringpointWidgetRepository` | **37.7%** | High |
| `HanportProcessRepository` | **32.2%** | High |
| `ChangeMpTypeMeteringpointRepository` | **36.5%** | High |
| `FaultHandlingCompMeteringpointRepository` | **37%** | High |
| `ConstructionPowerMeteringpointRepository` | **37.2%** | High |
| `CompHandlingMeteringpointRepository` | **36.3%** | High |
| `PropertyRepository` | **42.3%** | Medium |
| `DocumentRepository` | **47.1%** | Medium |
| `TechnicalRepository` | **45.6%** | Medium |
| `ConstructionPowerProcessRepository` | **42%** | Medium |
| `FaultHandlingCompProcessRepository` | **44%** | Medium |

**Recommended test file**: `MeteringPoint.Domains.Repositories.*Tests.cs`  
**Pattern**: Mock `IOracleDatabaseConnection`, use `Arg.Is<T>(predicate)` for internally-constructed query objects.

---

### P1-VALID: Validators with 0% Coverage

| Validator | Full Name | Recommended Test Class |
|---|---|---|
| `EditAddressVMValidator` | `Perigon.Modules.MeteringPoint.ViewModels.Meteringpoint360.Address.EditAddressVMValidator` | `EditAddressVMValidatorTests` |
| `MeteringSeriesValidator` | (located in the assembly root) | `MeteringSeriesValidatorTests` |

**Test scenarios:**
- Valid input → no validation errors
- Missing required fields → validation error with correct message
- Boundary values (max length strings, null vs. empty)

---

### P1-AUTOMAPPER: AutoMapper Profiles (All at 0%)

AutoMapper profiles define data transformation contracts. Untested profiles hide mapping errors that only surface at runtime.

**30+ profiles across all workflows — all at 0%:**

**ChangeMpType:** `ExecuteProfile`, `MeteringpointSearchProfile`, `ProcessProfile`, `TemplateProfile`  
**ComponentHandling:** `ComponentOverviewProfile`, `ComponentSearchProfile`, `ComponentStepProfile`, `EndReadingMeteringSeriesProfile`, `ExecuteProfile`, `MeteringpointSearchProfile`, `MeteringPointSummaryProfile`, `MeteringSeriesTemplateProfile`, `OverviewCountProfile`, `ReceiptProfile`, `TechnicalDataProfile`  
**ConstructionPower:** `AddressSearchProfile`, `CustomerSearchProfile`, `MeteringpointSearchProfile`, `ProcessProfile`, `TrafoSearchProfile`  
**FaultHandlingComp:** `ExecuteProfile`, `MeteringpointSearchProfile`, `ProcessProfile`  
**HanportProcess:** `ExecuteProfile`, `MeteringpointSearchProfile`, `ProcessProfile`  
**Meteringpoint360:** `AddressProfile`, `EquipmentProfile`, `MarketMessageProfile`, `OverviewProfile`, `PropertyProfile`, `RelationProfile`, `StatusLogProfile`, `TechnicalProfile`, `WorkorderProfile`  
**NewMeteringPoint:** `NewMeteringPointOverviewProfile`, `NewMeteringPointProfile`  
**SharedProductions:** `SharedProductionSearchProfile`  
**Common:** `AcAddressProfile`, `BusinessProcessVisualisationProfile`, `MarketMessageWidgetProfile`, `MeteringSeriesProfile`, `WorkorderProfile`

**Recommended approach**: One test file per workflow namespace. Use `AutoMapper.Mapper` directly with `AssertConfigurationIsValid()` plus spot-check specific mappings.

```csharp
// Example pattern
[Test]
public void Configuration_ShouldBeValid()
{
    var config = new MapperConfiguration(cfg => cfg.AddProfile<ExecuteProfile>());
    config.AssertConfigurationIsValid();
}

[Test]
public void Map_ShouldMapSourceToDestination_WhenAllFieldsPresent()
{
    var mapper = new MapperConfiguration(cfg => cfg.AddProfile<ExecuteProfile>()).CreateMapper();
    var source = new ExecuteDataVM { /* fields */ };
    var result = mapper.Map<ExecuteDTO>(source);
    Assert.That(result.SomeField, Is.EqualTo(source.SomeField));
}
```

---

## P2 — Moderate Gaps (Partial Coverage, High Complexity)

### P2-CTRL: Partially-Covered Controllers

| Controller | Current Coverage | Missing Branch% | Focus Area |
|---|---|---|---|
| `NewMeteringPointController` | **58.4%** | High | Null/exception paths, validation branches |
| `ComponentStepController` | **79.8%** | Medium | Edge cases, error outputs |
| `ConstructionPower.CommonController` | **90.4%** | Low | Small gap — complete remaining actions |
| `FaultHandlingComp.ReceiptController` | **90.9%** | Low | Complete remaining actions |

---

### P2-REPOS: Repositories at 45–58% Coverage

These have some tests but significant uncovered paths remain:

| Repository | Coverage | Priority |
|---|---|---|
| `CompHandlingProcessRepository` | 50% | Medium |
| `CompHandlingTemplatesRepository` | 50% | Medium |
| `FaultHandlingCompComponentRepository` | 50% | Medium |
| `FaultHandlingCompSummaryRepository` | 50% | Medium |
| `HanportProcessSummaryRepository` | 50% | Medium |
| `DeliveryWidgetRepository` | 50% | Medium |
| `MapsWidgetRepository` | 58.3% | Medium |
| `ConstructionPowerSummaryRepository` | 49.1% | Medium |
| `ChangeMpTypeSummaryRepository` | 47.2% | Medium |

---

### P2-AUTH: Authorization Infrastructure (0% Coverage)

| Class | Full Name |
|---|---|
| `HasAdminTaskAuthorizationHandler` | `Perigon.Modules.MeteringPoint.Utils.Authorization.HasAdminTaskAuthorizationHandler` |
| `PolicyBuilder` | `Perigon.Modules.MeteringPoint.Utils.Authorization.PolicyBuilder` |

**Note**: Authorization handlers are high-value tests — they protect admin-only operations. Test with mock `AuthorizationHandlerContext`.

---

### P2-CONFIG: Configuration Classes (0% Coverage)

**Status**: DONE (April 15, 2026)

Implemented in `MPAppConfigurationTests` with:
- default constructor value checks
- form metadata attribute checks for display/description
- in-memory configuration binding verification

| Class | Full Name |
|---|---|
| `HanportProcessSettings` | `Perigon.Modules.MeteringPoint.Utils.Configurations.HanportProcessSettings` |
| `MPAppConfiguration` | `Perigon.Modules.MeteringPoint.Utils.Configurations.MPAppConfiguration` |
| `OverviewSettings` | `Perigon.Modules.MeteringPoint.Utils.Configurations.OverviewSettings` |

**Pattern**: Test that properties bind correctly from `IConfiguration` / options pattern.

---

### P2-VIEWMODELS: Low-Coverage ViewModels Carrying Business Logic

**Status**: PARTIAL

Most high-impact VM logic is covered through existing consumer tests (controller/service/mapper), for example technical and mapping flows. Standalone VM test files are intentionally limited to align with module testing style and to avoid low-value duplication.

These are not pure data bags — they have calculated/conditional properties:

| ViewModel | Coverage | Note |
|---|---|---|
| `FaultHandlingComp.Meteringpoint.SearchResultVM` | **3.7%** | Almost fully untested |
| `HanportProcess.Meteringpoint.MeteringPointSearchVM` | **12.5%** | Very low |
| `SharedProduction.SharedProductionMemberVM` | **20%** | Low |
| `ChangeMpType.Meteringpoint.SearchResultVM` | **22.2%** | Low |
| `Meteringpoint360.Technical.TechnicalDetailsVM` | **7.6%** | Very low |
| `ComponentHandling.Summary.TechnicalDataVM` | **6%** | Very low |
| `Common.MarketMessageWidgetVM` | **9.5%** | Very low |

---

## P3 — Lower Priority (Partial Coverage, Lower Complexity)

**Status**: DEFERRED-CLOSED (Documentation decision)

Low-value/documentation-only gaps are now formally closed as deferred. These are intentionally not pursued for additional unit tests unless coverage policy changes.

### P3-DOMAINS-DTO: Zero-Coverage Domain DTOs

These are mostly simple data containers for Oracle query results/requests. Untested, but typically low-risk unless they have computed properties or parsing logic.

**Key clusters at 0%:**
- Common lookup DTOs: `ComponentType`, `CustomerTypes`, `Deliverypriorities`, `DocumentType`, `EACRegisterTypes`, `SettlementMethods`, `UsageType`, etc.
- UWS (User Widget Configuration) DTOs: `UWS_OverviewUserWidgetTemplateSetup`, `UWS_UserWidgetConfigSerialized`, `UWS_UserWidgetConfiguration`, `UWS_UserWidgetDeviceSetup`, `UWS_UserWidgetsConfigs`, `UWS_UserWidgetSetup`, `UWS_UserWidgetTemplate`, `UWS_UserWidgetTemplateSetup`, `UWS_UserWidgetTemplateSetups`, `UWS_UserWidgetTemplateSetupSet`
- Process-specific DTOs: `ChangeMpTypeSummaryWidget`, `ConstructionPowerSummaryMeteringseries`, `HanportProcessMPComponent`, `HanportProcessMpMeteringseries`

**Recommendation**: Focus on DTOs that have methods, computed properties, or are used in deserialization. Pure data containers (`{ get; set; }` only) can be skipped.

### P3-INFRA: Infrastructure / DI Registration

| Class | Notes |
|---|---|
| `MeteringPointModulesRegistrator` | DI registration — low unit test value; integration test territory |
| Autofac modules (`AuthorizationModule`, `FactoryModule`, `RepositoryModule`, `ServiceModule`, `ValidationModule`) | DI wiring — minimal unit test value |

**Recommendation**: Defer these unless there is explicit registration validation being targeted.

---

## Implementation Order

```
Sprint 1 (P1 High Value):
  [DONE] P1-VALID — EditAddressVMValidator, MeteringSeriesValidator
  [DONE] P1-AUTOMAPPER — ChangeMpType, FaultHandlingComp, ComponentHandling, ConstructionPower, Meteringpoint360, Common, NewMeteringPoint, SharedProduction
  [DONE] P1-REPO — AddressRepository, HanportProcessRepository, ChangeMpTypeMeteringpointRepository and peer low-coverage repositories

Sprint 2 (P1 Controllers + P2):
  [DONE] P1-CTRL — CommonController, OverviewController
  [DONE] P1-CTRL — GlobalSearchController, AddressController, InternalApiOverviewController
  [PARTIAL] P2-CTRL — Component/ConstructionPower/FaultHandlingComp controller branch-gap expansion completed; remaining branch-gap focus is NewMeteringPointController
  [DONE] P2-AUTH — HasAdminTaskAuthorizationHandler, PolicyBuilder

Sprint 3 (P1 Remaining Automapper + P2 Repos):
  [DONE] P1-AUTOMAPPER — Remaining profile groups completed
  [PARTIAL] P2-REPOS — Expanded on process and summary repositories; low-risk tails remain

Sprint 4 (P3 Cleanup):
  [DONE] P2-CONFIG — Configuration binding/default/metadata tests completed
  [PARTIAL] P2-VIEWMODELS — Covered via consumer tests; no broad standalone VM suite
  [DEFERRED-CLOSED] P3-DOMAINS-DTO — Pure DTO containers intentionally skipped
  [DEFERRED-CLOSED] P3-INFRA — DI wiring intentionally excluded from unit scope
```

---

## Closure Decision

This plan is now **closed for the current objective**:
- high-value and moderate-value items were implemented where test ROI is strong
- remaining low-value items were explicitly documented and deferred
- deferred items can be reopened if policy changes require blanket DTO/DI coverage

---

## NUnit Implementation Guidelines (Hansen Standards)

### Test Scaffolding Template

```csharp
using NSubstitute;
using NUnit.Framework;
using Perigon.Modules.MeteringPoint.Controllers.Common;
using Perigon.Modules.MeteringPoint.Domains.Interfaces.Common;

namespace Perigon.Modules.MeteringPoint.UnitTests.Controllers.Common;

[TestFixture]
[TestOf(typeof(CommonController))]
public class CommonControllerTests
{
    private ICommonService _service;
    private CommonController _controller;

    [SetUp]
    public void SetUp()
    {
        _service = Substitute.For<ICommonService>();
        _controller = new CommonController(_service);
    }

    [Test]
    [Description("Returns dropdown data when service responds successfully")]
    public async Task GetDropdowns_ShouldReturnData_WhenServiceSucceeds()
    {
        // Arrange
        var expected = new DropdownsVM { /* populate */ };
        _service.GetDropdownsAsync().Returns(expected);

        // Act
        var result = await _controller.GetDropdowns() as OkObjectResult;

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Value, Is.EqualTo(expected));
        });
    }
}
```

### Key Reminders from Lessons Learned

1. **Never `await` NSubstitute `Received()` calls** — verification is synchronous:
   ```csharp
   // ✅ Correct
   _repository.Received(1).GetAsync(Arg.Any<int>());
   // ❌ Wrong
   await _repository.Received(1).GetAsync(Arg.Any<int>());
   ```

2. **For internally-created objects, use `Arg.Is<T>(predicate)` not `Arg.Any<T>()`:**
   ```csharp
   _repository.FindAsync(Arg.Is<SearchRequest>(r => r.MpId == "123")).Returns(dto);
   ```

3. **UrlHelper extension methods cannot be mocked directly** — mock `IUrlHelper.Action(UrlActionContext)` instead.

4. **Decimal separator**: Use `.` (period) in test data regardless of local culture settings.

5. **Use `Assert.Multiple(() => { ... })` for grouping related property assertions.**

---

## Coverage Target

| Target | Goal |
|---|---|
| `Perigon.Modules.MeteringPoint` Line | 75%+ |
| `Perigon.Modules.MeteringPoint` Branch | 40%+ |
| `Perigon.Modules.MeteringPoint.Domains` Line | 70%+ |
| `Perigon.Modules.MeteringPoint.Domains` Branch | 65%+ |

---

## Excluded from Scope

- Razor view files (`AspNetCoreGeneratedDocument.*`) — 200+ files at 0%, all excluded; view testing is integration-test territory
- Autofac DI modules — infrastructure wiring, not unit-testable
- `MeteringPointModulesRegistrator` — application startup, not unit-testable

---

*Generated from code-coverage-report-2699 | April 2026*

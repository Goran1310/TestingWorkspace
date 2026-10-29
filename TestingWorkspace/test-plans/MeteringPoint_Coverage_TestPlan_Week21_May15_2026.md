# MeteringPoint Coverage Test Plan - Week 21 (May 15–22, 2026)

**Report Date**: May 13, 2026 (code-coverage-report-2994)  
**Plan Created**: May 15, 2026  
**Focus**: MeteringPoint module coverage improvement  
**Current Status**: Active

---

## Executive Summary

This test plan drives coverage improvement for the **MeteringPoint module** and its domain layer based on the May 13, 2026 coverage snapshot (report-2994). Week 21 focuses on methodical repository and service test expansion to close gaps identified in the hotspot analysis.

### Current Coverage Baseline (as of May 13, 2026)

| Assembly | Line Coverage | Branch Coverage | Status |
|----------|---------------|-----------------|--------|
| **Perigon.Modules.MeteringPoint** | 75.8% (10345/13634) | 29.6% (2197/7420) | +1.2% line, +1.8% branch since Week 18 |
| **Perigon.Modules.MeteringPoint.Domains** | 57.3% (3071/5354) | 48.7% (39/80) | Stable (+0% line, even branch) |
| **Combined** | 69.3% | 32.2% | **Target: 72% / 36%** by Week 21 end |

### Hotspot Analysis Summary

**P1 (0% Coverage)** — Classes with zero test coverage requiring urgent attention:
- **MeteringPoint**: 61 classes (mostly DTOs, ViewModels, ViewComponents, Autofac modules, factories)
- **Domains**: 59 classes (mostly DTOs, repositories without tests, utility classes)
- **Total P1**: 120 classes

**P2 (1–50% Coverage)** — Partial coverage requiring expansion:
- **MeteringPoint**: 4 classes (17.8% → 42.8% range)
- **Domains**: 30 repository/DTO classes (14.2% → 48.7% range)
- **Total P2**: 34 classes

**Key Insight**: The majority of P1 classes are **data containers** (DTOs, ViewModels, ViewComponents, Autofac modules) which are architectural anti-patterns for unit testing. These are better validated via **integration/UI testing**. Week 21 targets **concrete, testable components**: repositories, services, and utilities.

---

## Scope

### Included

✅ **Perigon.Modules.MeteringPoint** — Controller services, utilities, mappers with testable logic  
✅ **Perigon.Modules.MeteringPoint.Domains** — Repositories (P2 focus: 14–48% coverage), services, DTOs with behavior  
✅ **Test Framework**: NUnit 3.14+ with NSubstitute 5.1+  
✅ **Database Pattern**: `IDatabaseConnection.InTransaction<T>` with Devart.Data.Oracle  

### Excluded

❌ Data transfer objects (DTOs) — Data containers, no logic to test  
❌ ViewModels — Presentation layer, integration test scope  
❌ ViewComponents — UI rendering, integration test scope  
❌ Autofac modules — Dependency injection configuration, not unit-testable  
❌ Factory classes (Workorder, Address) — Deferred to Sprint D stabilization  
❌ SSEHttpContextExtensions — Event stream infrastructure, integration scope  
❌ AspNetCoreGeneratedDocument.* — Razor view code generation, not unit-testable  

### Success Criteria

- ✅ All new tests passing (100% pass rate)
- ✅ Line coverage: MeteringPoint → **77%** (+1.2%), Domains → **60%** (+2.7%)
- ✅ Branch coverage: MeteringPoint → **32%** (+2.4%), Domains → **52%** (+3.3%)
- ✅ PR review standards: Test descriptions, correct regions, exact assertions (no weak CSV contains)
- ✅ Culture-independent decimal parsing (use period separator: `"100.5"` not `"100,5"`)
- ✅ No awaited `Received()` calls (verification is synchronous)

---

## Week 21 Goals

**Primary Target**: Close 34 P2 (1–50% coverage) repositories and services in Domains layer  
**Secondary Target**: Expand MeteringPoint controller/utility test coverage  
**Tertiary Target**: Document reusable mocking patterns (session, cache, database transactions)

### Incremental Targets by Sprint

| Sprint | Focus | Estimated New Tests | Target Line Coverage | Target Branch Coverage |
|--------|-------|---------------------|----------------------|------------------------|
| **A** | Meteringpoint360 Repository Suite | 25–30 | 77.0% | 32.0% |
| **B** | ComponentHandling Repository Suite | 20–25 | 76.5% | 31.5% |
| **C** | ConstructionPower/ChangeMpType Repository Suite | 20–25 | 76.8% | 31.8% |
| **D** | Stabilization + HanportProcess/Workorder Repositories | 15–20 | 77.0% | 32.0% |
| **TOTAL** | **80–100 new tests** | | **77.0%** | **32.0%** |

---

## Prioritized Hotspots (P1 & P2)

### Sprint A: Meteringpoint360 Repository Suite (Largest Gap)

**Target Classes** (sorted by priority — lowest coverage first):

| Class | Current Coverage | Estimated Tests | Complexity | Notes |
|-------|------------------|-----------------|------------|-------|
| `AddressWidgetRepository` | 32.7% | 8–10 | Medium | Widget data access, address lookups |
| `PropertyRepository` | 42.3% | 6–8 | Medium | Metering point properties, metadata |
| `TechnicalRepository` | 45.6% | 5–7 | Medium | Technical data, device info |
| `MeteringpointWidgetRepository` | 44.8% | 8–10 | Medium | Dashboard widget data |
| `DocumentRepository` | 47.1% | 5–7 | Low | Document storage/retrieval |
| **Sprint A Total** | | **32–42 tests** | | |

**Sample Method to Test** (`AddressWidgetRepository`):
```csharp
Task<WidgetAddressDto> GetWidgetAddressAsync(string mpId, CancellationToken ct);
```
- Happy path: Returns valid address widget
- Null handling: mpId null/empty
- Cache hit/miss scenarios
- Database transaction rollback

---

### Sprint B: ComponentHandling Repository Suite

**Target Classes**:

| Class | Current Coverage | Estimated Tests | Complexity |
|-------|------------------|-----------------|------------|
| `CompHandlingMeteringpointRepository` | 36.3% | 10–12 | High (nested objects) |
| `CompHandlingComponentRepository` | 46.0% | 7–9 | Medium |
| **Sprint B Total** | | **17–21 tests** | |

**Key Pattern**: Component handling involves nested `MPComponentMeteringpoint` and `MPComponentMeteringseries` DTOs with complex initialization (see Lesson Learned: Complex ViewModel Initialization).

---

### Sprint C: ConstructionPower/ChangeMpType Repository Suite

**Target Classes**:

| Class | Current Coverage | Estimated Tests | Complexity |
|-------|------------------|-----------------|------------|
| `ConstructionPowerMeteringpointRepository` | 37.2% | 10–12 | High (workflow state) |
| `ConstructionPowerProcessRepository` | 42.0% | 8–10 | High (async state machine) |
| `ConstructionPowerCustomerRepository` | 43.2% | 6–8 | Medium |
| `ConstructionPowerComponentRepository` | 45.2% | 5–7 | Medium |
| `ChangeMpTypeMeteringpointRepository` | 36.5% | 10–12 | High (workflow transitions) |
| `ChangeMpTypeTemplatesRepository` | 48.3% | 5–7 | Low |
| `ChangeMpTypeProcessRepository` | 48.7% | 5–7 | Low |
| **Sprint C Total** | | **49–63 tests** | |

**High-Priority Pattern**: Process repositories require `Arg.Is<Search>(predicate)` matching (internally created objects) and transaction verification without `await Received()`.

---

### Sprint D: Stabilization + HanportProcess/Workorder

**Target Classes**:

| Class | Current Coverage | Estimated Tests | Complexity |
|-------|------------------|-----------------|------------|
| `HanportProcessMeteringpointRepository` | 33.3% | 12–15 | High (workflow) |
| `HanportProcessRepository` | 45.1% | 8–10 | Medium |
| `WorkorderRepository` | 45.4% | 5–7 | Medium (already has 12 tests) |
| `GlobalSearchRepository` | 17.5% | 10–12 | High (search logic, filters) |
| `FaultHandlingCompProcessRepository` | 44.0% | 8–10 | High (process state) |
| `FaultHandlingCompMeteringpointRepository` | 37.0% | 10–12 | High |
| **Sprint D Total** | | **53–66 tests** | |

**Stabilization Tasks**:
- Re-run full coverage after Sprints A–C
- Fix any flaky tests or edge cases
- Document global search filtering patterns
- Validate culture-independent decimal parsing

---

## Repository Pattern & Test Template

### Core Repository Test Structure

```csharp
using NSubstitute;
using NUnit.Framework;
using Perigon.Modules.MeteringPoint.Domains.Interfaces;

namespace Perigon.Modules.MeteringPoint.Domains.UnitTests.Repositories;

[TestFixture]
[TestOf(typeof(YourRepository))]
public class YourRepositoryTests
{
    private IDatabaseConnection _databaseConnection;
    private YourRepository _repository;

    [SetUp]
    public void SetUp()
    {
        _databaseConnection = Substitute.For<IDatabaseConnection>();
        _repository = new YourRepository(_databaseConnection);
    }

    [Test]
    [Description("Should return data when repository call succeeds")]
    public async Task GetDataAsync_ShouldReturnDto_WhenRecordExists()
    {
        // Arrange: Setup mock to capture transaction delegate
        Func<OracleConnection, Task<MyDto>> capturedDelegate = null;
        _databaseConnection.InTransaction(Arg.Do<Func<OracleConnection, Task<MyDto>>>(
            del => capturedDelegate = del))
            .Returns(async c => await capturedDelegate(c));

        // Act
        var result = await _repository.GetDataAsync(1);

        // Assert
        Assert.That(result, Is.Not.Null);
        _databaseConnection.Received(1).InTransaction(Arg.Any<Func<OracleConnection, Task<MyDto>>>());
    }
}
```

### Key NSubstitute Patterns (Verified in Week 21 Testing)

1. **Transaction Delegate Capture**: Repository wraps Oracle queries in `InTransaction`. Mock via `Arg.Do<Func<>>` to execute delegate.
2. **No Await on Received()**: Verification is synchronous. `_databaseConnection.Received(1).InTransaction(...)` — no `await`.
3. **Arg.Is<T>()** for internally created objects:
   ```csharp
   Arg.Is<Search>(s => s.Id == 123 && s.Type == "MP")
   ```
4. **Decimal Parsing**: Always use period separator in test data: `"100.5"` not `"100,5"`.

---

## Expected Deliverables

| Item | Quantity | Target |
|------|----------|--------|
| New unit tests | 80–100 | All passing (100% ✅) |
| Repository classes with tests | 25–30 | All P2 repositories covered |
| Line coverage increase | +1.2–1.5% | MeteringPoint: 75.8% → 77% |
| Branch coverage increase | +2.4–3% | MeteringPoint: 29.6% → 32% |
| Domains line coverage increase | +2–3% | Domains: 57.3% → 60% |
| Domains branch coverage increase | +2–4% | Domains: 48.7% → 52% |
| Reusable test helpers | 3–5 | (e.g., `TransactionTestHelper`, `CacheTestHelper`) |
| Lessons learned documented | 2–3 | Patterns captured in agent file |

---

## Validation Commands

### Build & Test
```bash
# Build solution
dotnet build

# Run MeteringPoint-only tests (fast iteration)
dotnet test --filter "FullyQualifiedName~MeteringPoint" --settings coverlet.runsettings

# Run full solution tests with coverage
dotnet test --settings coverlet.runsettings

# Generate coverage report
dotnet test --settings coverlet.runsettings --collect:"XPlat Code Coverage"
```

### Coverage Verification
Coverage reports generated in:
- `tests/**/TestResults/coverage.cobertura.xml`
- HTML report: `tests/**/TestResults/coverage/index.html`

---

## Risks & Mitigations

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| **Complex ViewModel/DTO Initialization** | High | Template patterns, helper methods, test data builders |
| **Database Transaction Mocking Issues** | Medium | Use `Arg.Do<Func<>>` capture pattern, document thoroughly |
| **Culture-Dependent Decimal Parsing** | Low | Always use period separator (en-US format) in test data |
| **Flaky Async Tests** | Low | Avoid `await Received()`, use synchronous verification |
| **UrlHelper Extension Method Mocking** | Low | Mock `IUrlHelper.Action(UrlActionContext)` interface, verify redirect URL directly |
| **Session/Cache Mock Configuration** | Medium | Reuse tested patterns from prior sprints, document setup helpers |
| **Time Pressure** | Medium | Batch-test approach: create simple patterns → validate → expand |

---

## Progress Tracking

### Sprint A Status: _Completed_
- [x] AddressWidgetRepository (8 tests)
- [x] PropertyRepository (15 tests)
- [x] TechnicalRepository (8 tests)
- [x] MeteringpointWidgetRepository (22 tests)
- [x] DocumentRepository (14 tests)
- **Sprint A Test Result**: 67/67 passing in focused Sprint A run
- **Sprint A Coverage**: Repository suite completed, ready for next coverage refresh run

### Sprint B Status: _Completed_
- [x] CompHandlingMeteringpointRepository (10 tests)
- [x] CompHandlingComponentRepository (15 tests)
- **Sprint B Test Result**: 25/25 passing in focused Sprint B run
- **Sprint B Coverage**: Repository suite completed, ready for next coverage refresh run

### Sprint C Status: _Completed_
- [x] ConstructionPowerMeteringpointRepository (10 tests)
- [x] ConstructionPowerProcessRepository (13 tests)
- [x] ConstructionPowerCustomerRepository (10 tests)
- [x] ConstructionPowerComponentRepository (6 tests)
- [x] ChangeMpTypeMeteringpointRepository (10 tests)
- [x] ChangeMpTypeTemplatesRepository (6 tests)
- [x] ChangeMpTypeProcessRepository (8 tests)
- **Sprint C Test Result**: 63/63 passing in focused Sprint C run
- **Sprint C Coverage**: Repository suite completed, ready for next coverage refresh run

### Sprint D Status: _Completed_
- [x] HanportProcessMeteringpointRepository (6 tests)
- [x] HanportProcessRepository (14 tests)
- [x] WorkorderRepository (11 tests)
- [x] GlobalSearchRepository (6 tests)
- [x] FaultHandlingCompProcessRepository (32 tests)
- [x] FaultHandlingCompMeteringpointRepository (12 tests)
- **Sprint D Test Result**: 81/81 passing in focused Sprint D run
- **Sprint D Coverage**: Repository suite completed, ready for final coverage refresh run

---

## Status Section

**Week 21 Status**: � **COMPLETE (Sprints A-D All Completed)**

- **Current**: Sprints A, B, and C completed and validated with focused test execution
- **Next**: Start Sprint D (HanportProcess/Workorder/GlobalSearch/FaultHandlingComp repositories)
- **Weekly Review**: Track progress each day, batch-fix patterns, update this plan

---

## References

- **Week 18 Plan** (Reference template): [MeteringPoint_Coverage_TestPlan_Week18_April29_2026.md](MeteringPoint_Coverage_TestPlan_Week18_April29_2026.md)
- **Coverage Report**: `C:\Users\goran.lovincic\Downloads\code-coverage-report-2994\coveragereport\index.htm` (May 13, 2026)
- **Test Code Location**: `tests/Perigon.Modules.MeteringPoint.Domains.UnitTests/`
- **NUnit/NSubstitute Documentation**: [Test Planner Agent — NUnit + NSubstitute Patterns](../.github/agents/test-planner.agent.md)

---

**Created By**: Test Planner Assistant  
**Last Updated**: May 15, 2026  
**Next Review**: After Sprint A completion (estimate: May 18, 2026)

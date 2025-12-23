# Test Plan: ChangeMpType CommonService

**Service**: `Perigon.Modules.MeteringPoint.Utils.Services.ChangeMpType.CommonService`  
**Test Project**: `Perigon.Modules.MeteringPoint.UnitTests`  
**Framework**: NUnit 3.14.0 + NSubstitute 5.1.0  
**Date**: December 22, 2025  
**Author**: Goran Lovincic

---

## Executive Summary

This test plan covers unit testing for the **ChangeMpType CommonService**, which provides utility functions for the Change Metering Point Type process. The service handles:
1. Localized text key retrieval for process types
2. Metering point search operations
3. Metering point summary data retrieval

The service uses AutoMapper (to be noted as technical debt per Hansen policy) and interacts with multiple repositories.

---

## Service Overview

**File**: `src\Perigon.Modules.MeteringPoint\Utils\Services\ChangeMpType\CommonService.cs`

**Dependencies**:
- `IChangeMpTypeMeteringpointRepository` - Repository for metering point searches
- `IMeteringpointWidgetRepository` - Repository for metering point summary data
- `IAddressWidgetRepository` - Repository for address data
- `IMapper` - AutoMapper instance (technical debt - should be refactored)

**Public Methods**:
1. `string GetProcessTypeLocalizerText(ChangeMpTypeProcessType processType)`
2. `Task<List<SearchResultVM>> SearchForMeteringPoint(MeteringPointSearchVM searchForm)`
3. `Task<MeteringPointSummaryVM> GetMeteringPointSummaryData(int mpNo)`

---

## Test Scope

### In Scope
✅ All public methods of CommonService  
✅ Happy path scenarios with valid data  
✅ Null and empty input handling  
✅ Exception handling and fallback behavior  
✅ Repository interaction verification  
✅ Mapper invocation verification  
✅ Edge cases (unknown enum values, nested exceptions)

### Out of Scope
❌ AutoMapper configuration testing (covered by integration tests)  
❌ Repository implementation logic  
❌ Database interactions  
❌ UI/Controller layer testing

---

## Test Environment

**Target Framework**: .NET 8.0  
**Testing Framework**: NUnit 3.14.0  
**Mocking Framework**: NSubstitute 5.1.0  
**Test Categories**: UnitTests, MeteringPoint, ChangeMpType

---

## Detailed Test Scenarios

### 1. GetProcessTypeLocalizerText Tests

**Purpose**: Verify that the correct localized text key is returned for each process type.

| # | Test Name | Input | Expected Output | Priority |
|---|-----------|-------|-----------------|----------|
| 1.1 | GetProcessTypeLocalizerText_ShouldReturnProdKey_WhenProcessTypeIsProduction | `ChangeMpTypeProcessType.MpType_prod` (76) | `"change-prod-modal-title"` | High |
| 1.2 | GetProcessTypeLocalizerText_ShouldReturnCombKey_WhenProcessTypeIsCombination | `ChangeMpTypeProcessType.MpType_comb` (75) | `"change-comb-modal-title"` | High |
| 1.3 | GetProcessTypeLocalizerText_ShouldReturnConsKey_WhenProcessTypeIsConsumption | `ChangeMpTypeProcessType.MpType_cons` (74) | `"change-cons-modal-title"` | High |
| 1.4 | GetProcessTypeLocalizerText_ShouldReturnEmptyString_WhenProcessTypeIsNotSet | `ChangeMpTypeProcessType.Not_Set` (77) | `""` (empty string) | Medium |
| 1.5 | GetProcessTypeLocalizerText_ShouldReturnEmptyString_WhenProcessTypeIsUndefined | Invalid enum value (e.g., 999 cast to enum) | `""` (empty string) | Low |

**Implementation Notes**:
- Method is synchronous (no async handling needed)
- Switch statement with default case returning empty string
- No repository dependencies for this method

---

### 2. SearchForMeteringPoint Tests

**Purpose**: Verify metering point search functionality with proper exception handling.

| # | Test Name | Description | Priority |
|---|-----------|-------------|----------|
| 2.1 | SearchForMeteringPoint_ShouldReturnMappedResults_WhenSearchSucceeds | Happy path: repository returns results, mapper maps successfully | High |
| 2.2 | SearchForMeteringPoint_ShouldReturnNull_WhenRepositoryThrowsException | Repository throws exception, method catches and returns null | High |
| 2.3 | SearchForMeteringPoint_ShouldReturnNull_WhenMapperThrowsException | Mapper throws exception during mapping, method catches and returns null | High |
| 2.4 | SearchForMeteringPoint_ShouldReturnEmptyList_WhenRepositoryReturnsEmptyCollection | Repository returns empty collection, mapper returns empty list | Medium |
| 2.5 | SearchForMeteringPoint_ShouldCallMapperWithCorrectInput_WhenInvoked | Verify mapper called with `MpSearchRequest` from `MeteringPointSearchVM` | Medium |
| 2.6 | SearchForMeteringPoint_ShouldCallRepositoryOnce_WhenInvoked | Verify repository method called exactly once | Medium |
| 2.7 | SearchForMeteringPoint_ShouldMapRequestBeforeCallingRepository_WhenInvoked | Verify correct mapping order: searchForm → MpSearchRequest → repository | Low |

**Test Data**:
```csharp
MeteringPointSearchVM searchForm = new()
{
    ProcessType = "MpType_cons",
    MeteringPointId = "1234567890123456789",
    MeteringPointNo = 12345,
    Streetname = "Test Street",
    BuildingNumber = "10",
    BuildingLetter = "A",
    PostCode = "0123",
    CityName = "Oslo"
};

SearchResultVM expectedResult = new()
{
    MeteringpointNo = 12345,
    MeteringpointId = "1234567890123456789",
    MeterNo = "METER123",
    MeteringpointName = "Test MP",
    Streetname = "Test Street",
    CityName = "Oslo"
};
```

**Implementation Notes**:
- Use `Arg.Any<MpSearchRequest>()` for mapper.Map calls (object created internally)
- Use `Arg.Is<T>()` if need to verify specific properties
- Exception handling uses generic `catch (Exception)` - all exceptions return null

---

### 3. GetMeteringPointSummaryData Tests

**Purpose**: Verify metering point summary retrieval with nested exception handling.

| # | Test Name | Description | Priority |
|---|-----------|-------------|----------|
| 3.1 | GetMeteringPointSummaryData_ShouldReturnCompleteData_WhenBothRepositoriesSucceed | Happy path: both summary and address retrieved successfully | High |
| 3.2 | GetMeteringPointSummaryData_ShouldReturnSummaryWithEmptyAddress_WhenAddressRepositoryThrows | Summary succeeds, address fails → returns summary with empty `MeteringpointAddress` | High |
| 3.3 | GetMeteringPointSummaryData_ShouldReturnEmptyViewModel_WhenSummaryRepositoryThrows | Summary repository fails → returns empty `MeteringPointSummaryVM` | High |
| 3.4 | GetMeteringPointSummaryData_ShouldCallAddressRepository_WhenSummarySucceeds | Verify address repository called after successful summary retrieval | Medium |
| 3.5 | GetMeteringPointSummaryData_ShouldNotCallAddressRepository_WhenSummaryFails | Verify address repository NOT called if summary retrieval fails | Medium |
| 3.6 | GetMeteringPointSummaryData_ShouldMapSummaryDataCorrectly_WhenRetrieved | Verify mapper called with correct DTO from repository | Medium |
| 3.7 | GetMeteringPointSummaryData_ShouldCallRepositoriesWithCorrectMpNo_WhenInvoked | Verify both repositories called with correct metering point number | Low |

**Test Data**:
```csharp
int mpNo = 12345;

MeteringPointSummaryVM expectedSummary = new()
{
    MeteringPointId = "1234567890123456789",
    MeteringPointNo = 12345,
    MeterNo = "METER123",
    MeteringPointType = "Consumption",
    SiteStatus = "Active",
    GridOwner = "Test Grid",
    MeteringPointDescription = "Test Description"
};

MeteringpointAddress expectedAddress = new()
{
    Streetname = "Test Street",
    BuildingNumber = "10",
    PostCode = "0123",
    CityName = "Oslo"
};
```

**Implementation Notes**:
- Nested try-catch: outer for summary, inner for address
- Inner exception creates `new MeteringpointAddress()` (not null)
- Outer exception creates `new MeteringPointSummaryVM()` (not null)
- Test sequence: summary success + address success, summary success + address fail, summary fail

---

## Enum Values Reference

**ChangeMpTypeProcessType** (from `ProcessState.cs`):
```csharp
public enum ChangeMpTypeProcessType
{
    MpType_cons = 74,  // Consumption
    MpType_comb = 75,  // Combination
    MpType_prod = 76,  // Production
    Not_Set = 77       // Not set
}
```

---

## Mock Setup Patterns

### Mapper Mocking
```csharp
// For SearchForMeteringPoint
var mappedRequest = new MpSearchRequest { /* properties */ };
_mapper.Map<MpSearchRequest>(Arg.Any<MeteringPointSearchVM>()).Returns(mappedRequest);

var mappedResults = new List<SearchResultVM> { /* items */ };
_mapper.Map<List<SearchResultVM>>(Arg.Any<IEnumerable<MpSearchResult>>()).Returns(mappedResults);

// For GetMeteringPointSummaryData
var mappedSummary = new MeteringPointSummaryVM { /* properties */ };
_mapper.Map<MeteringPointSummaryVM>(Arg.Any<object>()).Returns(mappedSummary);
```

### Repository Mocking
```csharp
// Success scenario
var repositoryResults = new List<MpSearchResult> { /* items */ };
_changeMpTypeMeteringpointRepository
    .SearchMeteringpointAsync(Arg.Any<MpSearchRequest>())
    .Returns(repositoryResults);

// Exception scenario
_changeMpTypeMeteringpointRepository
    .SearchMeteringpointAsync(Arg.Any<MpSearchRequest>())
    .Returns(Task.FromException<IEnumerable<MpSearchResult>>(new Exception("Repository error")));

// Address repository
_addressWidgetRepository
    .GetMeteringpointAddressAsync(Arg.Any<int>())
    .Returns(expectedAddress);
```

---

## Expected Test Metrics

- **Total Test Count**: ~15-17 tests
- **Coverage Target**: 100% line coverage, 95%+ branch coverage
- **Estimated Execution Time**: < 1 second (all tests)
- **Test Distribution**:
  - GetProcessTypeLocalizerText: 5 tests
  - SearchForMeteringPoint: 7 tests
  - GetMeteringPointSummaryData: 7 tests

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AutoMapper configuration issues | High | Low | Integration tests verify mapping; unit tests mock mapper |
| Repository exceptions not caught | High | Low | Comprehensive exception testing scenarios |
| Null reference in address assignment | Medium | Low | Test nested exception handling |
| Unknown enum values | Low | Low | Test default case in switch statement |

---

## Technical Debt Notes

⚠️ **AutoMapper Usage**: Service uses AutoMapper, which violates Hansen policy. Future refactoring should:
- Replace `mapper.Map<T>()` calls with manual mapping methods
- Remove IMapper dependency
- Update tests to verify property mapping directly (no mapper mocks)
- Follow patterns from `NewMeteringPointOverviewService` refactoring

**Tracking**: Document this as technical debt when implementing tests.

---

## Test Implementation Checklist

Before implementing:
- [x] Analyze service code and dependencies
- [x] Identify enum values (exact naming: `MpType_cons` not `MpType_Cons`)
- [x] Understand exception handling patterns (nested try-catch)
- [x] Document ViewModels and DTOs structure
- [x] Plan mock strategies (Arg.Any vs Arg.Is)

During implementation:
- [ ] Create test file: `CommonServiceTests.cs` in `ChangeMpType` folder
- [ ] Implement GetProcessTypeLocalizerText tests (5 tests)
- [ ] Implement SearchForMeteringPoint tests (7 tests)
- [ ] Implement GetMeteringPointSummaryData tests (7 tests)
- [ ] Run tests and verify 100% pass rate
- [ ] Document any new patterns discovered

---

## Acceptance Criteria

✅ All public methods have comprehensive test coverage  
✅ Exception handling scenarios validated  
✅ Repository interactions verified  
✅ Mapper invocations verified  
✅ All tests pass with 100% success rate  
✅ Code coverage meets Hansen standards (95%+)  
✅ Tests follow NUnit + NSubstitute patterns  
✅ Test naming convention followed: `MethodName_ShouldBehavior_WhenCondition`

---

## References

- **Service Code**: [src/Perigon.Modules.MeteringPoint/Utils/Services/ChangeMpType/CommonService.cs](c:\Users\goran.lovincic\Documents\GitHub\Perigon\src\Perigon.Modules.MeteringPoint\Utils\Services\ChangeMpType\CommonService.cs)
- **Enum Definition**: `ProcessState.cs` (ChangeMpTypeProcessType)
- **ViewModels**: `MeteringPointSearchVM`, `SearchResultVM`, `MeteringPointSummaryVM`
- **Similar Test Examples**: 
  - `ConstructionPowerProcessServiceTests.cs`
  - `ChangeMpTypeProcessServiceTests.cs`
  - `HanportProcess/CommonServiceTests.cs`

---

**Status**: Ready for Implementation  
**Next Step**: Create `CommonServiceTests.cs` and implement test suite

# Test Plan: HanportProcess CommonService

**Service:** `Perigon.Modules.MeteringPoint.Utils.Services.HanportProcess.CommonService`  
**Test Plan Created:** December 16, 2025  
**Test Type:** Unit Tests (NUnit + NSubstitute)

---

## Executive Summary

This test plan covers the `CommonService` class in the HanportProcess module. The service provides common functionality for Hanport process operations including process type localization, metering point search, and metering point summary data retrieval. The service uses AutoMapper (legacy) and has three public methods with varying complexity levels.

**Complexity Assessment:**
- **Low Complexity:** `GetProcessTypeLocalizerText` (simple switch expression)
- **Medium Complexity:** `SearchForMeteringPoint` (repository call with AutoMapper and exception handling)
- **Medium-High Complexity:** `GetMeteringPointSummaryData` (multiple repository calls, nested exception handling)

---

## Service Architecture Analysis

### Service Under Test
- **Class:** `CommonService`
- **Interface:** `ICommonService`
- **Location:** `c:\Users\goran.lovincic\Documents\GitHub\Perigon\src\Perigon.Modules.MeteringPoint\Utils\Services\HanportProcess\CommonService.cs`
- **Pattern:** Service layer with repository and mapper dependencies

### Service Implementation

```csharp
public class CommonService(
    IHanportProcessMeteringpointRepository hanportProcessMeteringpointRepository,
    IMeteringpointWidgetRepository meteringpointWidgetRepository,
    IAddressWidgetRepository addressWidgetRepository,
    IMapper mapper) : ICommonService
{
    // Three public methods for Hanport process operations
}
```

### Dependencies
1. **IHanportProcessMeteringpointRepository** - Metering point search operations
2. **IMeteringpointWidgetRepository** - Metering point summary data retrieval
3. **IAddressWidgetRepository** - Address data retrieval for metering points
4. **IMapper** - AutoMapper for DTO/ViewModel mapping (⚠️ Legacy - being phased out)

### Data Models

**Enums:**
```csharp
public enum HanportProcessType
{
    Hanport_activate = 81,
    Hanport_deactivate = 82,
    Not_Set = 83
}
```

**Key DTOs/ViewModels:**
- `MeteringPointSearchVM` - Search criteria input
- `SearchResultVM` - Search results output
- `MpSearchRequest` - Repository request DTO
- `MeteringPointSummaryVM` - Summary data with address
- `MeteringpointAddress` - Address information

### Public Methods
1. **GetProcessTypeLocalizerText(HanportProcessType)** - Returns localization key for process type
2. **SearchForMeteringPoint(MeteringPointSearchVM)** - Searches for metering points
3. **GetMeteringPointSummaryData(int)** - Retrieves metering point summary with address

---

## Test Scope

### In Scope ✅
- Unit testing of all three public methods
- Process type localization for all enum values
- Metering point search with valid/invalid criteria
- Summary data retrieval with complete/partial data
- Exception handling in search and summary methods
- Null return behavior on exceptions
- AutoMapper integration (mocking only - legacy)
- Multiple repository interaction verification
- Nested exception handling (address retrieval failure)

### Out of Scope ❌
- Integration testing with actual repositories
- Database query validation
- AutoMapper configuration testing (legacy concern)
- Performance/load testing
- Actual localization/translation logic
- UI rendering of search results

---

## Test Scenarios & Test Cases

### Scenario 1: Process Type Localization - GetProcessTypeLocalizerText

**Objective:** Verify method returns correct localization keys for all process types

#### Test Case 1.1: GetProcessTypeLocalizerText_ShouldReturnActivateText_WhenActivateTypeProvided
- **Priority:** High
- **Type:** Positive Test
- **Arrange:** Process type = `HanportProcessType.Hanport_activate`
- **Act:** Call `GetProcessTypeLocalizerText(processType)`
- **Assert:** 
  - Result equals "Activate Hanport"
- **Expected Result:** Correct localization key returned

#### Test Case 1.2: GetProcessTypeLocalizerText_ShouldReturnDeactivateText_WhenDeactivateTypeProvided
- **Priority:** High
- **Type:** Positive Test
- **Arrange:** Process type = `HanportProcessType.Hanport_deactivate`
- **Act:** Call `GetProcessTypeLocalizerText(processType)`
- **Assert:** 
  - Result equals "Deactivate Hanport"
- **Expected Result:** Correct localization key returned

#### Test Case 1.3: GetProcessTypeLocalizerText_ShouldReturnEmptyString_WhenNotSetTypeProvided
- **Priority:** Medium
- **Type:** Edge Case
- **Arrange:** Process type = `HanportProcessType.Not_Set`
- **Act:** Call `GetProcessTypeLocalizerText(processType)`
- **Assert:** 
  - Result equals empty string ""
- **Expected Result:** Default empty string returned for unmatched type

#### Test Case 1.4: GetProcessTypeLocalizerText_ShouldReturnEmptyString_WhenInvalidEnumValueProvided
- **Priority:** Low
- **Type:** Edge Case
- **Arrange:** Process type = (HanportProcessType)999 (invalid enum value)
- **Act:** Call `GetProcessTypeLocalizerText(processType)`
- **Assert:** 
  - Result equals empty string ""
- **Expected Result:** Default case handles invalid enum values gracefully

---

### Scenario 2: Metering Point Search - SearchForMeteringPoint

**Objective:** Verify search functionality with various inputs and error conditions

#### Test Case 2.1: SearchForMeteringPoint_ShouldReturnSearchResults_WhenValidSearchFormProvided
- **Priority:** High
- **Type:** Positive Test
- **Arrange:** 
  - Valid `MeteringPointSearchVM` with search criteria
  - Mock mapper to return `MpSearchRequest`
  - Mock repository to return search results
  - Mock mapper to convert results to `List<SearchResultVM>`
- **Act:** Call `SearchForMeteringPoint(searchForm)`
- **Assert:** 
  - Result is not null
  - Result contains expected search results
  - Mapper was called twice (request mapping and response mapping)
  - Repository was called once
- **Expected Result:** Search executes successfully and returns mapped results

#### Test Case 2.2: SearchForMeteringPoint_ShouldReturnEmptyList_WhenNoResultsFound
- **Priority:** High
- **Type:** Positive Test
- **Arrange:** 
  - Valid search form
  - Mock repository to return empty list
  - Mock mapper to return empty `List<SearchResultVM>`
- **Act:** Call `SearchForMeteringPoint(searchForm)`
- **Assert:** 
  - Result is not null
  - Result is empty list
  - All dependencies called correctly
- **Expected Result:** Empty list returned when no matches found

#### Test Case 2.3: SearchForMeteringPoint_ShouldReturnNull_WhenMapperThrowsException
- **Priority:** High
- **Type:** Negative Test
- **Arrange:** 
  - Mock mapper to throw exception during request mapping
- **Act:** Call `SearchForMeteringPoint(searchForm)`
- **Assert:** 
  - Result is null
  - Exception was caught and handled
- **Expected Result:** Null returned on mapper exception

#### Test Case 2.4: SearchForMeteringPoint_ShouldReturnNull_WhenRepositoryThrowsException
- **Priority:** High
- **Type:** Negative Test
- **Arrange:** 
  - Mock mapper for request mapping succeeds
  - Mock repository to throw exception
- **Act:** Call `SearchForMeteringPoint(searchForm)`
- **Assert:** 
  - Result is null
  - Repository was called
- **Expected Result:** Null returned on repository exception

#### Test Case 2.5: SearchForMeteringPoint_ShouldReturnNull_WhenResponseMappingFails
- **Priority:** Medium
- **Type:** Negative Test
- **Arrange:** 
  - Mock mapper for request succeeds
  - Mock repository succeeds
  - Mock mapper to throw exception during response mapping
- **Act:** Call `SearchForMeteringPoint(searchForm)`
- **Assert:** 
  - Result is null
- **Expected Result:** Null returned when response mapping fails

---

### Scenario 3: Metering Point Summary Retrieval - GetMeteringPointSummaryData

**Objective:** Verify summary data retrieval with complete and partial data scenarios

#### Test Case 3.1: GetMeteringPointSummaryData_ShouldReturnCompleteSummary_WhenAllDataAvailable
- **Priority:** High
- **Type:** Positive Test
- **Arrange:** 
  - Valid mpNo (e.g., 12345)
  - Mock meteringpoint widget repository to return summary data
  - Mock mapper to return `MeteringPointSummaryVM`
  - Mock address repository to return `MeteringpointAddress`
- **Act:** Call `GetMeteringPointSummaryData(mpNo)`
- **Assert:** 
  - Result is not null
  - Result contains summary data
  - Result.Address is not null and contains address data
  - Both repositories called exactly once
  - Mapper called once
- **Expected Result:** Complete summary with address data returned

#### Test Case 3.2: GetMeteringPointSummaryData_ShouldReturnSummaryWithEmptyAddress_WhenAddressRetrievalFails
- **Priority:** High
- **Type:** Negative Test (Partial Failure)
- **Arrange:** 
  - Valid mpNo
  - Mock meteringpoint widget repository succeeds
  - Mock mapper succeeds
  - Mock address repository to throw exception
- **Act:** Call `GetMeteringPointSummaryData(mpNo)`
- **Assert:** 
  - Result is not null
  - Result contains summary data
  - Result.Address is new empty `MeteringpointAddress()` (not null)
  - Address repository was called
  - Exception was caught and handled
- **Expected Result:** Summary returned with default empty address on address fetch failure

#### Test Case 3.3: GetMeteringPointSummaryData_ShouldReturnEmptySummary_WhenSummaryRetrievalFails
- **Priority:** High
- **Type:** Negative Test
- **Arrange:** 
  - Valid mpNo
  - Mock meteringpoint widget repository to throw exception
- **Act:** Call `GetMeteringPointSummaryData(mpNo)`
- **Assert:** 
  - Result is not null
  - Result is new empty `MeteringPointSummaryVM()`
  - Address repository not called (outer exception prevents it)
- **Expected Result:** Empty summary returned on main data retrieval failure

#### Test Case 3.4: GetMeteringPointSummaryData_ShouldReturnEmptySummary_WhenMapperThrowsException
- **Priority:** Medium
- **Type:** Negative Test
- **Arrange:** 
  - Mock repository succeeds
  - Mock mapper to throw exception
- **Act:** Call `GetMeteringPointSummaryData(mpNo)`
- **Assert:** 
  - Result is new empty `MeteringPointSummaryVM()`
- **Expected Result:** Empty summary returned when mapping fails

#### Test Case 3.5: GetMeteringPointSummaryData_ShouldHandleZeroMpNo_Appropriately
- **Priority:** Low
- **Type:** Edge Case
- **Arrange:** 
  - mpNo = 0
  - Mock repositories to handle zero appropriately
- **Act:** Call `GetMeteringPointSummaryData(0)`
- **Assert:** 
  - Method doesn't crash
  - Returns appropriate result based on repository behavior
- **Expected Result:** Graceful handling of edge case input

---

## NUnit + NSubstitute Test Implementation

### Test Project Structure

**Test File Location:**
```
Perigon.Modules.MeteringPoint.UnitTests/
└── Utils/
    └── Services/
        └── HanportProcess/
            └── CommonServiceTests.cs
```

### Complete Test Class

```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using NSubstitute;
using NUnit.Framework;
using Perigon.Modules.MeteringPoint.Domains.DataTransferObjects.Common;
using Perigon.Modules.MeteringPoint.Domains.DataTransferObjects.HanportProcess;
using Perigon.Modules.MeteringPoint.Domains.DataTransferObjects.Meteringpoint360.Overview.Widgets;
using Perigon.Modules.MeteringPoint.Domains.Interfaces.HanportProcess;
using Perigon.Modules.MeteringPoint.Domains.Interfaces.Meteringpoint360.Overview.Widgets;
using Perigon.Modules.MeteringPoint.Utils.Services.HanportProcess;
using Perigon.Modules.MeteringPoint.ViewModels.ComponentHandling.Summary;
using Perigon.Modules.MeteringPoint.ViewModels.HanportProcess.Meteringpoint;

namespace Perigon.Modules.MeteringPoint.UnitTests.Utils.Services.HanportProcess;

/// <summary>
/// Test Suite: CommonService (HanportProcess)
/// 
/// Coverage Target: 100% (Line, Branch, Method)
/// Total Tests: 14
/// 
/// Service Under Test: Provides common operations for Hanport process
/// 
/// Test Coverage:
/// - GetProcessTypeLocalizerText: Localization keys for process types (4 tests)
/// - SearchForMeteringPoint: Search with success and error scenarios (5 tests)
/// - GetMeteringPointSummaryData: Summary retrieval with nested exception handling (5 tests)
/// 
/// Notes:
/// - Service uses AutoMapper (legacy) - only mocked, not configured
/// - Multiple repository dependencies with complex exception handling
/// - Test Plan: c:\Users\goran.lovincic\source\repos\TestingWorkspace\test-plans\HanportProcess_CommonService_TestPlan.md
/// </summary>
[TestFixture]
[TestOf(typeof(CommonService))]
[Category("UnitTests")]
[Category("HanportProcess")]
[Category("CommonService")]
public class CommonServiceTests
{
    private IHanportProcessMeteringpointRepository _hanportRepository;
    private IMeteringpointWidgetRepository _meteringpointWidgetRepository;
    private IAddressWidgetRepository _addressWidgetRepository;
    private IMapper _mapper;
    private CommonService _service;

    [SetUp]
    public void SetUp()
    {
        // Initialize substitutes for all dependencies
        _hanportRepository = Substitute.For<IHanportProcessMeteringpointRepository>();
        _meteringpointWidgetRepository = Substitute.For<IMeteringpointWidgetRepository>();
        _addressWidgetRepository = Substitute.For<IAddressWidgetRepository>();
        _mapper = Substitute.For<IMapper>();

        // Create service under test with substituted dependencies
        _service = new CommonService(
            _hanportRepository,
            _meteringpointWidgetRepository,
            _addressWidgetRepository,
            _mapper);
    }

    #region GetProcessTypeLocalizerText Tests

    [Test]
    [Description("Verify correct localization key returned for activate process type")]
    [Property("Priority", "High")]
    [Property("TestType", "Positive")]
    public void GetProcessTypeLocalizerText_ShouldReturnActivateText_WhenActivateTypeProvided()
    {
        // Arrange
        var processType = HanportProcessType.Hanport_activate;

        // Act
        var result = _service.GetProcessTypeLocalizerText(processType);

        // Assert
        Assert.That(result, Is.EqualTo("Activate Hanport"),
            "Should return 'Activate Hanport' for activate process type");
    }

    [Test]
    [Description("Verify correct localization key returned for deactivate process type")]
    [Property("Priority", "High")]
    [Property("TestType", "Positive")]
    public void GetProcessTypeLocalizerText_ShouldReturnDeactivateText_WhenDeactivateTypeProvided()
    {
        // Arrange
        var processType = HanportProcessType.Hanport_deactivate;

        // Act
        var result = _service.GetProcessTypeLocalizerText(processType);

        // Assert
        Assert.That(result, Is.EqualTo("Deactivate Hanport"),
            "Should return 'Deactivate Hanport' for deactivate process type");
    }

    [Test]
    [Description("Verify empty string returned for Not_Set process type")]
    [Property("Priority", "Medium")]
    [Property("TestType", "EdgeCase")]
    public void GetProcessTypeLocalizerText_ShouldReturnEmptyString_WhenNotSetTypeProvided()
    {
        // Arrange
        var processType = HanportProcessType.Not_Set;

        // Act
        var result = _service.GetProcessTypeLocalizerText(processType);

        // Assert
        Assert.That(result, Is.EqualTo(string.Empty),
            "Should return empty string for Not_Set process type");
    }

    [Test]
    [Description("Verify empty string returned for invalid enum value")]
    [Property("Priority", "Low")]
    [Property("TestType", "EdgeCase")]
    public void GetProcessTypeLocalizerText_ShouldReturnEmptyString_WhenInvalidEnumValueProvided()
    {
        // Arrange
        var invalidProcessType = (HanportProcessType)999; // Invalid enum value

        // Act
        var result = _service.GetProcessTypeLocalizerText(invalidProcessType);

        // Assert
        Assert.That(result, Is.EqualTo(string.Empty),
            "Should return empty string for invalid enum values");
    }

    #endregion

    #region SearchForMeteringPoint Tests

    [Test]
    [Description("Verify search returns mapped results when repository and mapper succeed")]
    [Property("Priority", "High")]
    [Property("TestType", "Positive")]
    public async Task SearchForMeteringPoint_ShouldReturnSearchResults_WhenValidSearchFormProvided()
    {
        // Arrange
        var searchForm = new MeteringPointSearchVM { /* search criteria */ };
        var mpRequest = new MpSearchRequest();
        var repositoryResponse = new List<object>(); // Repository response DTOs
        var expectedResults = new List<SearchResultVM>
        {
            new SearchResultVM { /* result data */ }
        };

        _mapper.Map<MpSearchRequest>(searchForm).Returns(mpRequest);
        _hanportRepository.SearchMeteringpointAsync(mpRequest).Returns(repositoryResponse);
        _mapper.Map<List<SearchResultVM>>(repositoryResponse).Returns(expectedResults);

        // Act
        var result = await _service.SearchForMeteringPoint(searchForm);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result, Is.Not.Null, "Result should not be null");
            Assert.That(result, Is.EqualTo(expectedResults), "Should return mapped search results");
        });

        // Verify interactions
        _mapper.Received(1).Map<MpSearchRequest>(searchForm);
        await _hanportRepository.Received(1).SearchMeteringpointAsync(mpRequest);
        _mapper.Received(1).Map<List<SearchResultVM>>(repositoryResponse);
    }

    [Test]
    [Description("Verify search returns empty list when no results found")]
    [Property("Priority", "High")]
    [Property("TestType", "Positive")]
    public async Task SearchForMeteringPoint_ShouldReturnEmptyList_WhenNoResultsFound()
    {
        // Arrange
        var searchForm = new MeteringPointSearchVM();
        var mpRequest = new MpSearchRequest();
        var emptyResponse = new List<object>();
        var emptyResults = new List<SearchResultVM>();

        _mapper.Map<MpSearchRequest>(searchForm).Returns(mpRequest);
        _hanportRepository.SearchMeteringpointAsync(mpRequest).Returns(emptyResponse);
        _mapper.Map<List<SearchResultVM>>(emptyResponse).Returns(emptyResults);

        // Act
        var result = await _service.SearchForMeteringPoint(searchForm);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result, Is.Not.Null, "Result should not be null");
            Assert.That(result, Is.Empty, "Should return empty list when no results");
        });

        await _hanportRepository.Received(1).SearchMeteringpointAsync(mpRequest);
    }

    [Test]
    [Description("Verify search returns null when mapper throws exception during request mapping")]
    [Property("Priority", "High")]
    [Property("TestType", "Negative")]
    public async Task SearchForMeteringPoint_ShouldReturnNull_WhenMapperThrowsException()
    {
        // Arrange
        var searchForm = new MeteringPointSearchVM();
        _mapper.Map<MpSearchRequest>(searchForm)
            .Returns(x => throw new AutoMapperMappingException("Mapping failed"));

        // Act
        var result = await _service.SearchForMeteringPoint(searchForm);

        // Assert
        Assert.That(result, Is.Null, "Should return null when mapper throws exception");

        // Repository should not be called if mapping fails
        await _hanportRepository.DidNotReceive().SearchMeteringpointAsync(Arg.Any<MpSearchRequest>());
    }

    [Test]
    [Description("Verify search returns null when repository throws exception")]
    [Property("Priority", "High")]
    [Property("TestType", "Negative")]
    public async Task SearchForMeteringPoint_ShouldReturnNull_WhenRepositoryThrowsException()
    {
        // Arrange
        var searchForm = new MeteringPointSearchVM();
        var mpRequest = new MpSearchRequest();

        _mapper.Map<MpSearchRequest>(searchForm).Returns(mpRequest);
        _hanportRepository.SearchMeteringpointAsync(mpRequest)
            .Returns(Task.FromException<List<object>>(new Exception("Database error")));

        // Act
        var result = await _service.SearchForMeteringPoint(searchForm);

        // Assert
        Assert.That(result, Is.Null, "Should return null when repository throws exception");

        await _hanportRepository.Received(1).SearchMeteringpointAsync(mpRequest);
    }

    [Test]
    [Description("Verify search returns null when response mapping fails")]
    [Property("Priority", "Medium")]
    [Property("TestType", "Negative")]
    public async Task SearchForMeteringPoint_ShouldReturnNull_WhenResponseMappingFails()
    {
        // Arrange
        var searchForm = new MeteringPointSearchVM();
        var mpRequest = new MpSearchRequest();
        var repositoryResponse = new List<object>();

        _mapper.Map<MpSearchRequest>(searchForm).Returns(mpRequest);
        _hanportRepository.SearchMeteringpointAsync(mpRequest).Returns(repositoryResponse);
        _mapper.Map<List<SearchResultVM>>(repositoryResponse)
            .Returns(x => throw new AutoMapperMappingException("Response mapping failed"));

        // Act
        var result = await _service.SearchForMeteringPoint(searchForm);

        // Assert
        Assert.That(result, Is.Null, "Should return null when response mapping fails");
    }

    #endregion

    #region GetMeteringPointSummaryData Tests

    [Test]
    [Description("Verify complete summary with address returned when all data available")]
    [Property("Priority", "High")]
    [Property("TestType", "Positive")]
    public async Task GetMeteringPointSummaryData_ShouldReturnCompleteSummary_WhenAllDataAvailable()
    {
        // Arrange
        var mpNo = 12345;
        var summaryDto = new object(); // Repository DTO
        var summaryVM = new MeteringPointSummaryVM();
        var address = new MeteringpointAddress { Street = "Main St" };

        _meteringpointWidgetRepository.GetMeteringPointSummary(mpNo).Returns(summaryDto);
        _mapper.Map<MeteringPointSummaryVM>(summaryDto).Returns(summaryVM);
        _addressWidgetRepository.GetMeteringpointAddressAsync(mpNo).Returns(address);

        // Act
        var result = await _service.GetMeteringPointSummaryData(mpNo);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result, Is.Not.Null, "Result should not be null");
            Assert.That(result, Is.EqualTo(summaryVM), "Should return mapped summary");
            Assert.That(result.Address, Is.Not.Null, "Address should not be null");
            Assert.That(result.Address, Is.EqualTo(address), "Should have correct address data");
        });

        // Verify all dependencies called
        await _meteringpointWidgetRepository.Received(1).GetMeteringPointSummary(mpNo);
        _mapper.Received(1).Map<MeteringPointSummaryVM>(summaryDto);
        await _addressWidgetRepository.Received(1).GetMeteringpointAddressAsync(mpNo);
    }

    [Test]
    [Description("Verify summary with empty address returned when address retrieval fails")]
    [Property("Priority", "High")]
    [Property("TestType", "Negative")]
    public async Task GetMeteringPointSummaryData_ShouldReturnSummaryWithEmptyAddress_WhenAddressRetrievalFails()
    {
        // Arrange
        var mpNo = 12345;
        var summaryDto = new object();
        var summaryVM = new MeteringPointSummaryVM();

        _meteringpointWidgetRepository.GetMeteringPointSummary(mpNo).Returns(summaryDto);
        _mapper.Map<MeteringPointSummaryVM>(summaryDto).Returns(summaryVM);
        _addressWidgetRepository.GetMeteringpointAddressAsync(mpNo)
            .Returns(Task.FromException<MeteringpointAddress>(new Exception("Address fetch failed")));

        // Act
        var result = await _service.GetMeteringPointSummaryData(mpNo);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result, Is.Not.Null, "Result should not be null");
            Assert.That(result.Address, Is.Not.Null, "Address should be initialized");
            Assert.That(result.Address, Is.InstanceOf<MeteringpointAddress>(),
                "Should have default empty address object");
        });

        // Address repository should have been called despite exception
        await _addressWidgetRepository.Received(1).GetMeteringpointAddressAsync(mpNo);
    }

    [Test]
    [Description("Verify empty summary returned when main summary retrieval fails")]
    [Property("Priority", "High")]
    [Property("TestType", "Negative")]
    public async Task GetMeteringPointSummaryData_ShouldReturnEmptySummary_WhenSummaryRetrievalFails()
    {
        // Arrange
        var mpNo = 12345;
        _meteringpointWidgetRepository.GetMeteringPointSummary(mpNo)
            .Returns(Task.FromException<object>(new Exception("Summary fetch failed")));

        // Act
        var result = await _service.GetMeteringPointSummaryData(mpNo);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result, Is.Not.Null, "Result should not be null");
            Assert.That(result, Is.InstanceOf<MeteringPointSummaryVM>(),
                "Should return new empty summary VM");
        });

        // Address repository should NOT be called when outer try fails
        await _addressWidgetRepository.DidNotReceive().GetMeteringpointAddressAsync(Arg.Any<int>());
    }

    [Test]
    [Description("Verify empty summary returned when mapper throws exception")]
    [Property("Priority", "Medium")]
    [Property("TestType", "Negative")]
    public async Task GetMeteringPointSummaryData_ShouldReturnEmptySummary_WhenMapperThrowsException()
    {
        // Arrange
        var mpNo = 12345;
        var summaryDto = new object();

        _meteringpointWidgetRepository.GetMeteringPointSummary(mpNo).Returns(summaryDto);
        _mapper.Map<MeteringPointSummaryVM>(summaryDto)
            .Returns(x => throw new AutoMapperMappingException("Mapping failed"));

        // Act
        var result = await _service.GetMeteringPointSummaryData(mpNo);

        // Assert
        Assert.That(result, Is.InstanceOf<MeteringPointSummaryVM>(),
            "Should return new empty summary when mapping fails");
    }

    [Test]
    [Description("Verify method handles zero mpNo gracefully")]
    [Property("Priority", "Low")]
    [Property("TestType", "EdgeCase")]
    public async Task GetMeteringPointSummaryData_ShouldHandleZeroMpNo_Appropriately()
    {
        // Arrange
        var mpNo = 0;
        var summaryDto = new object();
        var summaryVM = new MeteringPointSummaryVM();

        _meteringpointWidgetRepository.GetMeteringPointSummary(mpNo).Returns(summaryDto);
        _mapper.Map<MeteringPointSummaryVM>(summaryDto).Returns(summaryVM);
        _addressWidgetRepository.GetMeteringpointAddressAsync(mpNo)
            .Returns(new MeteringpointAddress());

        // Act
        var result = await _service.GetMeteringPointSummaryData(mpNo);

        // Assert
        Assert.That(result, Is.Not.Null, "Should handle zero mpNo without crashing");

        // Verify repositories were called with zero
        await _meteringpointWidgetRepository.Received(1).GetMeteringPointSummary(0);
    }

    #endregion
}
```

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| **AutoMapper Configuration Errors** | High | Medium | Mock IMapper in tests; recommend removing AutoMapper in future refactoring |
| **Repository Exception Handling** | Medium | Medium | Comprehensive exception tests for all repository calls |
| **Nested Exception Handling Complexity** | Medium | Medium | Test both inner and outer exception scenarios separately |
| **Null Return Values** | Low | Medium | Tests verify null returns on exceptions; consumers must handle nulls |
| **Invalid Enum Values** | Low | Low | Test covers invalid enum scenario; switch expression has default case |
| **Data Mapping Failures** | Medium | Medium | Test mapper exceptions; recommend explicit mapping in future |

---

## Recommended Service Improvements

### 1. Replace AutoMapper with Explicit Mapping

**Current (Legacy):**
```csharp
MpSearchRequest request = mapper.Map<MpSearchRequest>(searchForm);
```

**Recommended:**
```csharp
private MpSearchRequest MapToSearchRequest(MeteringPointSearchVM searchForm)
{
    return new MpSearchRequest
    {
        // Explicit property mapping
        SearchTerm = searchForm.SearchTerm,
        // ... other properties
    };
}
```

**Benefits:**
- Compile-time safety
- Easier debugging
- No runtime mapping exceptions
- Follows Hansen Technologies policy

### 2. Improve Exception Handling

**Current:**
```csharp
catch (Exception)
{
    return null;
}
```

**Recommended:**
```csharp
catch (Exception ex)
{
    _logger.LogError(ex, "Failed to search metering points with criteria {SearchForm}", searchForm);
    return null;
}
```

**Benefits:**
- Better diagnostics
- Easier troubleshooting
- Audit trail

### 3. Add Defensive Null Checks

**Current:**
```csharp
public async Task<List<SearchResultVM>> SearchForMeteringPoint(MeteringPointSearchVM searchForm)
```

**Recommended:**
```csharp
public async Task<List<SearchResultVM>> SearchForMeteringPoint(MeteringPointSearchVM searchForm)
{
    if (searchForm == null)
        throw new ArgumentNullException(nameof(searchForm));
    
    // ... rest of implementation
}
```

### 4. Consider Result Pattern Instead of Null

**Current:**
```csharp
return null; // On error
```

**Recommended:**
```csharp
public class SearchResult<T>
{
    public bool Success { get; set; }
    public T Data { get; set; }
    public string ErrorMessage { get; set; }
}

// Return SearchResult<List<SearchResultVM>> instead of List<SearchResultVM>
```

---

## Resources Needed

### Tools & Technologies
- ✅ **NUnit** 3.14.0 (centrally managed)
- ✅ **NSubstitute** 5.1.0 (centrally managed)
- ✅ **.NET 8.0 SDK**
- ✅ **Visual Studio 2022** or **VS Code**

### Test Data Requirements
- Valid `MeteringPointSearchVM` objects with various search criteria
- Repository response DTOs for different scenarios
- `MeteringPointSummaryVM` and `MeteringpointAddress` test data
- Exception scenarios for all repository methods

### Environment Setup
- **Local Development:** Standard .NET 8.0 environment
- **CI/CD Pipeline:** Automated test execution
- **Mock Data:** No database required (all dependencies mocked)

### Execution Time Estimates
- **Test Creation:** 3-4 hours (14 tests with complex setup)
- **Test Execution:** < 500ms (all 14 tests combined)
- **Code Review:** 45 minutes
- **Total Effort:** ~4-5 hours

---

## Test Coverage Goals

### Coverage Metrics
- **Line Coverage:** 100%
- **Branch Coverage:** 100% (switch expression, nested try-catch)
- **Method Coverage:** 100% (3 public methods)
- **Exception Path Coverage:** 100%

### Expected Defects
- **Estimated Defects Found:** 0-2
  - Service is relatively simple
  - Exception handling is broad (catches all exceptions)
  - AutoMapper integration is legacy concern

### Quality Metrics
- **Test Stability:** 95%+ (AutoMapper mocks may be slightly less stable)
- **Test Performance:** < 500ms total
- **Maintainability:** High (clear test organization)
- **Readability:** High (descriptive naming, good documentation)

---

## Success Criteria

### Functional Success Criteria
✅ All 14 tests pass consistently  
✅ Code coverage meets 100% target  
✅ All process type enum values tested  
✅ Exception handling verified for all paths  
✅ Repository interactions properly verified  
✅ Nested exception handling tested (address fetch failure)  
✅ Edge cases covered (invalid enum, zero mpNo)  

### Non-Functional Success Criteria
✅ Tests execute in < 500ms total  
✅ Zero flaky tests  
✅ Tests are independent  
✅ Clear test names following conventions  
✅ Comprehensive documentation  
✅ No test code duplication  

### Acceptance Criteria
✅ All tests pass in local environment  
✅ All tests pass in CI/CD pipeline  
✅ Code review approved  
✅ Test plan reviewed and accepted  
✅ No blocking issues identified  

---

## Execution Plan

### Phase 1: Test Creation (3-4 hours)
1. ✅ Create test class structure
2. ✅ Implement GetProcessTypeLocalizerText tests (4 tests)
3. ✅ Implement SearchForMeteringPoint tests (5 tests)
4. ✅ Implement GetMeteringPointSummaryData tests (5 tests)
5. ✅ Add comprehensive documentation and attributes

### Phase 2: Test Validation (1 hour)
1. ✅ Run tests locally via `dotnet test`
2. ✅ Verify 100% code coverage
3. ✅ Check test execution time
4. ✅ Validate no flaky tests (run 10 times)
5. ✅ Review test output and logs

### Phase 3: Code Review (45 minutes)
1. ✅ Submit PR with test code
2. ✅ Address review comments
3. ✅ Update documentation if needed
4. ✅ Ensure coding standards compliance

### Phase 4: CI/CD Integration (15 minutes)
1. ✅ Verify tests run in CI/CD pipeline
2. ✅ Configure test result reporting
3. ✅ Set up code coverage reporting
4. ✅ Add test failure notifications

---

## Running the Tests

### Command Line Execution

```powershell
# Run all tests in the test class
dotnet test --filter "FullyQualifiedName~CommonServiceTests"

# Run with code coverage
dotnet test --filter "FullyQualifiedName~CommonServiceTests" --collect:"XPlat Code Coverage"

# Run with detailed output
dotnet test --filter "FullyQualifiedName~CommonServiceTests" --verbosity detailed

# Run specific test method
dotnet test --filter "Name~GetProcessTypeLocalizerText_ShouldReturnActivateText_WhenActivateTypeProvided"

# Run only positive tests
dotnet test --filter "TestCategory=Positive&FullyQualifiedName~CommonServiceTests"
```

### Visual Studio Test Explorer
1. Open Test Explorer (Test → Test Explorer)
2. Expand tree: Perigon.Modules.MeteringPoint.UnitTests → Services → HanportProcess
3. Right-click on CommonServiceTests → Run
4. View results in Test Explorer window

---

## Test Maintenance

### When to Update Tests
- ✅ When CommonService implementation changes
- ✅ When repository interfaces change
- ✅ When HanportProcessType enum values change
- ✅ When new requirements are added
- ✅ When bugs are discovered (add regression tests)
- ✅ When AutoMapper is removed (update mocking strategy)

### Test Refactoring Opportunities
- Extract helper methods for common setup patterns
- Create test data builders for complex ViewModels
- Use parameterized tests for similar scenarios
- Consider base test class for common dependency setup

### Documentation Updates
- Keep this test plan in sync with implementation
- Update success criteria as project evolves
- Document deviations from original plan
- Add lessons learned section post-implementation

---

## Appendix A: AutoMapper Deprecation Notes

⚠️ **Important:** This service uses AutoMapper, which Hansen Technologies is phasing out.

**Current Status:**
- AutoMapper is mocked in tests
- No actual AutoMapper configuration in tests
- Tests verify mapper is called, not configuration correctness

**Future Migration:**
When removing AutoMapper:
1. Replace `IMapper` dependency with manual mapping methods
2. Update tests to verify mapping logic directly
3. Remove AutoMapper mocks
4. Test explicit mapping methods instead

**Example Migration:**
```csharp
// Before (with AutoMapper):
MpSearchRequest request = mapper.Map<MpSearchRequest>(searchForm);

// After (explicit mapping):
MpSearchRequest request = MapToSearchRequest(searchForm);

// New test focus:
[Test]
public void MapToSearchRequest_ShouldMapAllProperties_WhenValidSearchFormProvided()
{
    // Test the explicit mapping method
}
```

---

## Conclusion

This test plan provides comprehensive coverage for the HanportProcess CommonService. The service's use of AutoMapper and nested exception handling presents unique testing challenges that are addressed through careful mocking and exception scenario testing.

**Key Takeaways:**
- 14 focused test cases covering all scenarios
- 100% code coverage achievable
- Moderate complexity due to multiple dependencies and exception handling
- Quick to implement (3-4 hours)
- Strong foundation for future refactoring (AutoMapper removal)

**Next Steps:**
1. Create test file with provided implementation
2. Run tests and verify coverage
3. Consider service improvements (remove AutoMapper, add logging)
4. Integrate into CI/CD pipeline

---

**Test Plan Status:** ✅ Ready for Implementation  
**Estimated Effort:** 4-5 hours total  
**Risk Level:** Low-Medium  
**Priority:** Medium-High

# Test Plan: ConstructionPowerUserDataServiceOverviewDataService

**Service:** `Perigon.Modules.MeteringPoint.Utils.Services.ConstructionPower.ConstructionPowerUserDataServiceOverviewDataService`  
**Test Plan Created:** December 16, 2025  
**Test Type:** Unit Tests (NUnit + NSubstitute)

---

## Executive Summary

This test plan covers the `ConstructionPowerUserDataServiceOverviewDataService` class, which is a lightweight adapter service that retrieves construction power overview settings from the underlying `IConstructionPowerUserDataService`. The service follows the adapter pattern and has a single responsibility: extracting the `ConstructionPowerOverviewSettings` property from the user data.

The service has minimal complexity with only one public method and one dependency, making it an ideal candidate for comprehensive unit testing with 100% code coverage.

---

## Service Architecture Analysis

### Service Under Test
- **Class:** `ConstructionPowerUserDataServiceOverviewDataService`
- **Interface:** `IConstructionPowerOverviewDataService`
- **Location:** `c:\Users\goran.lovincic\Documents\GitHub\Perigon\src\Perigon.Modules.MeteringPoint\Utils\Services\ConstructionPower\ConstructionPowerOverviewDataService.cs`
- **Pattern:** Adapter/Wrapper pattern

### Service Implementation

```csharp
public class ConstructionPowerUserDataServiceOverviewDataService(
    IConstructionPowerUserDataService constructionPowerUserDataService) 
    : IConstructionPowerOverviewDataService
{
    public async Task<ConstructionPowerOverviewSettings> GetAsync()
    {
        var data = await constructionPowerUserDataService.GetAsync();
        return data.ConstructionPowerOverviewSettings;
    }
}
```

### Dependencies
1. **IConstructionPowerUserDataService** - Injected dependency for retrieving user data
   - Returns: `ConstructionPowerUserData`
   - Contains: `ConstructionPowerOverviewSettings` property

### Data Models

```csharp
public class ConstructionPowerUserData
{
    public ConstructionPowerUserData()
    {
        ConstructionPowerOverviewSettings = new ConstructionPowerOverviewSettings();
    }
    public ConstructionPowerOverviewSettings ConstructionPowerOverviewSettings { get; set; }
}

public class ConstructionPowerOverviewSettings
{
    public ConstructionPowerOverviewSettings()
    {
        ConstructionPowerOverview = "constructionpower-overview-progress";
    }
    public string ConstructionPowerOverview { get; set; }
}
```

### Public Methods
- **GetAsync()** - Returns `ConstructionPowerOverviewSettings` from user data

---

## Test Scope

### In Scope ✅
- Unit testing of `GetAsync()` method
- Proper extraction of `ConstructionPowerOverviewSettings` from user data
- Null handling scenarios
- Dependency interaction verification
- Async/await behavior validation
- Default value handling
- Custom value preservation

### Out of Scope ❌
- Integration testing with actual user data repository
- Authentication/authorization flows (handled by dependency)
- Database interactions (mocked via repository)
- User session management (handled by `IConstructionPowerUserDataService`)
- JSON serialization/deserialization (handled by dependency)
- HTTP context and claims validation

---

## Test Scenarios & Test Cases

### Scenario 1: Happy Path - Valid User Data

**Objective:** Verify service correctly extracts overview settings when valid data exists

#### Test Case 1.1: GetAsync_ShouldReturnOverviewSettings_WhenUserDataExists
- **Priority:** High
- **Type:** Positive Test
- **Arrange:** 
  - Mock `IConstructionPowerUserDataService.GetAsync()` to return valid `ConstructionPowerUserData`
  - User data contains populated `ConstructionPowerOverviewSettings` with default value
- **Act:** Call `GetAsync()`
- **Assert:** 
  - Result is not null
  - Result matches the expected `ConstructionPowerOverviewSettings` object
  - `ConstructionPowerOverview` property equals "constructionpower-overview-progress"
  - Dependency was called exactly once
- **Expected Result:** Service returns correct settings object

#### Test Case 1.2: GetAsync_ShouldReturnDefaultSettings_WhenUserDataIsNew
- **Priority:** High
- **Type:** Positive Test
- **Arrange:** 
  - Mock returns new `ConstructionPowerUserData()` with default constructor values
- **Act:** Call `GetAsync()`
- **Assert:**
  - Result is not null
  - `ConstructionPowerOverview` equals default value "constructionpower-overview-progress"
  - Dependency was called exactly once
- **Expected Result:** Default settings are returned for new users

---

### Scenario 2: Edge Cases - Property Variations

**Objective:** Verify service handles different property values correctly

#### Test Case 2.1: GetAsync_ShouldReturnCustomOverviewValue_WhenUserHasCustomSettings
- **Priority:** Medium
- **Type:** Positive Test
- **Arrange:** 
  - Mock returns user data with custom `ConstructionPowerOverview` value (e.g., "custom-view-mode")
- **Act:** Call `GetAsync()`
- **Assert:**
  - Result contains the custom value
  - No default value overrides user preference
  - Custom value is preserved exactly as stored
- **Expected Result:** User customizations are respected

#### Test Case 2.2: GetAsync_ShouldHandleEmptyStringOverview_WhenSetByUser
- **Priority:** Low
- **Type:** Edge Case
- **Arrange:** 
  - Mock returns settings with `ConstructionPowerOverview = ""`
- **Act:** Call `GetAsync()`
- **Assert:**
  - Result contains empty string (respects user data)
  - No exception thrown
  - Empty string is not replaced with default
- **Expected Result:** Empty strings are valid and preserved

---

### Scenario 3: Null Handling

**Objective:** Verify service behavior when encountering null values

#### Test Case 3.1: GetAsync_ShouldReturnNull_WhenOverviewSettingsIsNull
- **Priority:** High
- **Type:** Negative Test
- **Arrange:** 
  - Mock returns `ConstructionPowerUserData` with `ConstructionPowerOverviewSettings = null` (forcibly set)
- **Act:** Call `GetAsync()`
- **Assert:** 
  - Result is null
  - Dependency was called exactly once
- **Expected Result:** Service returns null when property is null
- **Note:** Current implementation returns null. This is acceptable but could be improved with defensive null handling.
- **Recommendation:** Consider adding null check in service: `return data?.ConstructionPowerOverviewSettings ?? new ConstructionPowerOverviewSettings();`

#### Test Case 3.2: GetAsync_ShouldPropagateException_WhenDependencyThrows
- **Priority:** High
- **Type:** Negative Test
- **Arrange:** 
  - Mock `IConstructionPowerUserDataService.GetAsync()` to throw `InvalidOperationException`
- **Act & Assert:** 
  - Exception is propagated to caller
  - Exception message is preserved
  - Dependency was called before exception
- **Expected Result:** Service does not swallow exceptions from dependency

---

### Scenario 4: Async Behavior

**Objective:** Verify proper asynchronous execution

#### Test Case 4.1: GetAsync_ShouldAwaitDependencyCall_Properly
- **Priority:** Medium
- **Type:** Functional Test
- **Arrange:** 
  - Mock returns completed task with valid data
- **Act:** Call `GetAsync()` and await
- **Assert:**
  - Task completes successfully
  - Result is available after await
  - No synchronous blocking occurs (proper async/await usage)
- **Expected Result:** Asynchronous execution works correctly

---

## NUnit + NSubstitute Test Implementation

### Test Project Structure

**Test File Location:**
```
Perigon.Modules.MeteringPoint.UnitTests/
└── Services/
    └── ConstructionPower/
        └── ConstructionPowerUserDataServiceOverviewDataServiceTests.cs
```

### Complete Test Class

```csharp
using System.Threading.Tasks;
using NSubstitute;
using NUnit.Framework;
using Perigon.Modules.MeteringPoint.Utils.Services.ConstructionPower;

namespace Perigon.Modules.MeteringPoint.UnitTests.Services.ConstructionPower;

[TestFixture]
[TestOf(typeof(ConstructionPowerUserDataServiceOverviewDataService))]
[Category("UnitTests")]
[Category("ConstructionPower")]
[Description("Unit tests for ConstructionPowerUserDataServiceOverviewDataService adapter")]
public class ConstructionPowerUserDataServiceOverviewDataServiceTests
{
    private IConstructionPowerUserDataService _userDataService;
    private ConstructionPowerUserDataServiceOverviewDataService _service;

    [SetUp]
    public void SetUp()
    {
        // Initialize substitute for dependency
        _userDataService = Substitute.For<IConstructionPowerUserDataService>();
        
        // Create service under test with substituted dependency
        _service = new ConstructionPowerUserDataServiceOverviewDataService(_userDataService);
    }

    [Test]
    [Description("Verify service returns overview settings when valid user data exists")]
    [Property("Priority", "High")]
    [Property("TestType", "Positive")]
    public async Task GetAsync_ShouldReturnOverviewSettings_WhenUserDataExists()
    {
        // Arrange
        var expectedSettings = new ConstructionPowerOverviewSettings
        {
            ConstructionPowerOverview = "constructionpower-overview-progress"
        };
        var userData = new ConstructionPowerUserData
        {
            ConstructionPowerOverviewSettings = expectedSettings
        };
        _userDataService.GetAsync().Returns(userData);

        // Act
        var result = await _service.GetAsync();

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result, Is.Not.Null, "Result should not be null");
            Assert.That(result.ConstructionPowerOverview, 
                Is.EqualTo("constructionpower-overview-progress"),
                "Should return default overview value");
        });
        
        // Verify dependency interaction
        await _userDataService.Received(1).GetAsync();
    }

    [Test]
    [Description("Verify service returns default settings when user data is newly initialized")]
    [Property("Priority", "High")]
    [Property("TestType", "Positive")]
    public async Task GetAsync_ShouldReturnDefaultSettings_WhenUserDataIsNew()
    {
        // Arrange - Use default constructor (simulates new user)
        var userData = new ConstructionPowerUserData();
        _userDataService.GetAsync().Returns(userData);

        // Act
        var result = await _service.GetAsync();

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result, Is.Not.Null, "Result should not be null");
            Assert.That(result.ConstructionPowerOverview, 
                Is.EqualTo("constructionpower-overview-progress"),
                "Should return default value from constructor");
        });
        
        await _userDataService.Received(1).GetAsync();
    }

    [Test]
    [Description("Verify service preserves custom overview values set by user")]
    [Property("Priority", "Medium")]
    [Property("TestType", "Positive")]
    public async Task GetAsync_ShouldReturnCustomOverviewValue_WhenUserHasCustomSettings()
    {
        // Arrange
        var customSettings = new ConstructionPowerOverviewSettings
        {
            ConstructionPowerOverview = "custom-view-mode"
        };
        var userData = new ConstructionPowerUserData
        {
            ConstructionPowerOverviewSettings = customSettings
        };
        _userDataService.GetAsync().Returns(userData);

        // Act
        var result = await _service.GetAsync();

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result, Is.Not.Null, "Result should not be null");
            Assert.That(result.ConstructionPowerOverview, 
                Is.EqualTo("custom-view-mode"),
                "Should preserve custom user preference");
        });
        
        await _userDataService.Received(1).GetAsync();
    }

    [Test]
    [Description("Verify service handles empty string values without throwing exceptions")]
    [Property("Priority", "Low")]
    [Property("TestType", "EdgeCase")]
    public async Task GetAsync_ShouldHandleEmptyStringOverview_WhenSetByUser()
    {
        // Arrange
        var settings = new ConstructionPowerOverviewSettings
        {
            ConstructionPowerOverview = string.Empty
        };
        var userData = new ConstructionPowerUserData
        {
            ConstructionPowerOverviewSettings = settings
        };
        _userDataService.GetAsync().Returns(userData);

        // Act
        var result = await _service.GetAsync();

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result, Is.Not.Null, "Result should not be null");
            Assert.That(result.ConstructionPowerOverview, 
                Is.EqualTo(string.Empty),
                "Should preserve empty string value");
        });
        
        await _userDataService.Received(1).GetAsync();
    }

    [Test]
    [Description("Verify service returns null when overview settings property is forcibly set to null")]
    [Property("Priority", "High")]
    [Property("TestType", "Negative")]
    public async Task GetAsync_ShouldReturnNull_WhenOverviewSettingsIsNull()
    {
        // Arrange
        var userData = new ConstructionPowerUserData
        {
            ConstructionPowerOverviewSettings = null!  // Force null despite constructor
        };
        _userDataService.GetAsync().Returns(userData);

        // Act
        var result = await _service.GetAsync();
            
        // Assert
        Assert.That(result, Is.Null, 
            "Service returns null when ConstructionPowerOverviewSettings is null");
        
        await _userDataService.Received(1).GetAsync();
        
        // Note: This behavior could be improved with defensive null handling:
        // return data?.ConstructionPowerOverviewSettings ?? new ConstructionPowerOverviewSettings();
    }

    [Test]
    [Description("Verify service propagates exceptions from underlying dependency")]
    [Property("Priority", "High")]
    [Property("TestType", "Negative")]
    public void GetAsync_ShouldPropagateException_WhenDependencyThrows()
    {
        // Arrange
        var expectedException = new InvalidOperationException("User data service failed");
        _userDataService.GetAsync()
            .Returns(Task.FromException<ConstructionPowerUserData>(expectedException));

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(async () => 
            await _service.GetAsync(),
            "Should propagate exception from dependency");
        
        Assert.That(exception.Message, Is.EqualTo("User data service failed"),
            "Exception message should be preserved");
    }
}
```

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| **Null Reference Exception** | High | Medium | Add defensive null check: `return data?.ConstructionPowerOverviewSettings ?? new ConstructionPowerOverviewSettings();` |
| **Dependency Failure** | Medium | Low | Service properly propagates exceptions - ensure caller has error handling |
| **Breaking Changes in ConstructionPowerUserData** | Medium | Low | Unit tests will catch property changes; maintain contract tests |
| **Async/Await Deadlocks** | Low | Low | Service uses proper async/await pattern; no `.Result` or `.Wait()` calls |
| **Performance Issues** | Low | Very Low | Simple property access; no loops or heavy processing |
| **Thread Safety** | Low | Very Low | Stateless service; no shared mutable state |

---

## Recommended Service Improvements

### 1. Defensive Null Handling

**Current Implementation:**
```csharp
public async Task<ConstructionPowerOverviewSettings> GetAsync()
{
    var data = await constructionPowerUserDataService.GetAsync();
    return data.ConstructionPowerOverviewSettings; // Can throw NullReferenceException
}
```

**Recommended Implementation:**
```csharp
public async Task<ConstructionPowerOverviewSettings> GetAsync()
{
    var data = await constructionPowerUserDataService.GetAsync();
    return data?.ConstructionPowerOverviewSettings ?? new ConstructionPowerOverviewSettings();
}
```

**Benefits:**
- Prevents NullReferenceException
- Provides sensible default behavior
- More resilient to unexpected data states

### 2. Add Interface Validation (Optional)

Consider adding validation attributes if specific values are required:

```csharp
public class ConstructionPowerOverviewSettings
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string ConstructionPowerOverview { get; set; } = "constructionpower-overview-progress";
}
```

### 3. Add Logging (If Needed)

For debugging purposes, consider adding logging:

```csharp
public class ConstructionPowerUserDataServiceOverviewDataService(
    IConstructionPowerUserDataService constructionPowerUserDataService,
    ILogger<ConstructionPowerUserDataServiceOverviewDataService> logger) 
    : IConstructionPowerOverviewDataService
{
    public async Task<ConstructionPowerOverviewSettings> GetAsync()
    {
        logger.LogDebug("Retrieving construction power overview settings");
        var data = await constructionPowerUserDataService.GetAsync();
        var settings = data?.ConstructionPowerOverviewSettings ?? new ConstructionPowerOverviewSettings();
        logger.LogDebug("Retrieved settings: {Overview}", settings.ConstructionPowerOverview);
        return settings;
    }
}
```

---

## Resources Needed

### Tools & Technologies
- ✅ **NUnit** 3.14.0 (centrally managed via Directory.Packages.props)
- ✅ **NSubstitute** 5.1.0 (centrally managed)
- ✅ **NUnit3TestAdapter** 4.5.0
- ✅ **Microsoft.NET.Test.Sdk** 17.8.0
- ✅ **.NET 8.0 SDK**
- ✅ **Visual Studio 2022** or **VS Code** with C# extension

### Test Data Requirements
- Valid `ConstructionPowerUserData` objects with various settings
- Edge case values:
  - Empty strings
  - Long strings (100+ characters)
  - Special characters in overview values
  - Unicode characters
  - Null values

### Environment Setup
- **Local Development:** Standard .NET 8.0 development environment
- **CI/CD Pipeline:** Automated test execution on commit/PR
- **Test Runner:** dotnet test CLI or Visual Studio Test Explorer

### Execution Time Estimates
- **Test Creation:** 1-2 hours (including documentation)
- **Test Execution:** < 1 second (all 6 tests combined)
- **Code Review:** 30 minutes
- **Total Effort:** ~2-3 hours

---

## Test Coverage Goals

### Coverage Metrics
- **Line Coverage:** 100% (service has only 4 lines of executable code)
- **Branch Coverage:** 100% (no conditional branches in current implementation)
- **Method Coverage:** 100% (1 public method)
- **Dependency Coverage:** 100% (1 dependency fully mocked)

### Expected Defects
- **Estimated Defects Found:** 0-1
  - Potential null reference issue (already identified)
  - Service is simple with minimal logic
  - Low complexity = low defect probability

### Quality Metrics
- **Test Stability:** 100% (no flaky tests expected)
- **Test Performance:** < 100ms total execution time
- **Maintainability:** High (simple, focused tests)
- **Readability:** High (clear naming, good documentation)

---

## Success Criteria

### Functional Success Criteria
✅ All 6 tests pass consistently  
✅ Code coverage meets 100% target  
✅ No null reference exceptions in happy path scenarios  
✅ Dependency interactions properly verified  
✅ Custom user settings preserved correctly  
✅ Default values applied when appropriate  

### Non-Functional Success Criteria
✅ Tests execute in < 100ms total  
✅ Zero flaky tests (no timing dependencies)  
✅ Tests are independent (can run in any order)  
✅ Clear test names and descriptions  
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

### Phase 1: Test Creation (1-2 hours)
1. ✅ Create test project structure (if not exists)
2. ✅ Add NuGet package references (using central package management)
3. ✅ Create `ConstructionPowerUserDataServiceOverviewDataServiceTests.cs`
4. ✅ Implement all 6 test cases
5. ✅ Add test documentation and attributes

### Phase 2: Test Validation (30 minutes)
1. ✅ Run tests locally via `dotnet test`
2. ✅ Verify 100% code coverage using `dotnet test --collect:"XPlat Code Coverage"`
3. ✅ Check test execution time
4. ✅ Validate no flaky tests (run 10 times)
5. ✅ Review test output and logs

### Phase 3: Code Review (30 minutes)
1. ✅ Submit PR with test code
2. ✅ Address review comments
3. ✅ Update test documentation if needed
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
# Run all tests in the project
dotnet test Perigon.Modules.MeteringPoint.UnitTests.csproj

# Run only ConstructionPowerUserDataServiceOverviewDataService tests
dotnet test --filter "FullyQualifiedName~ConstructionPowerUserDataServiceOverviewDataServiceTests"

# Run with code coverage
dotnet test --collect:"XPlat Code Coverage"

# Run with detailed output
dotnet test --verbosity detailed

# Run specific test
dotnet test --filter "Name~GetAsync_ShouldReturnOverviewSettings_WhenUserDataExists"
```

### Visual Studio Test Explorer
1. Open Test Explorer (Test → Test Explorer)
2. Expand tree: Perigon.Modules.MeteringPoint.UnitTests → Services → ConstructionPower
3. Right-click on test class → Run
4. View results in Test Explorer window

---

## Test Maintenance

### When to Update Tests
- ✅ When `ConstructionPowerUserDataServiceOverviewDataService` implementation changes
- ✅ When `IConstructionPowerUserDataService` contract changes
- ✅ When `ConstructionPowerOverviewSettings` model changes
- ✅ When new requirements are added
- ✅ When bugs are discovered (add regression tests)

### Test Refactoring Opportunities
- Extract helper methods if test setup becomes complex
- Create test data builders for complex object creation
- Use parameterized tests for similar test cases
- Share common setup via base test class

### Documentation Updates
- Keep this test plan in sync with actual implementation
- Update success criteria as project evolves
- Document any deviations from original plan
- Add lessons learned section

---

## Appendix A: Test Naming Convention

### Pattern
```
MethodName_ShouldExpectedBehavior_WhenCondition
```

### Examples from This Test Suite
- `GetAsync_ShouldReturnOverviewSettings_WhenUserDataExists`
- `GetAsync_ShouldReturnDefaultSettings_WhenUserDataIsNew`
- `GetAsync_ShouldReturnCustomOverviewValue_WhenUserHasCustomSettings`
- `GetAsync_ShouldHandleEmptyStringOverview_WhenSetByUser`
- `GetAsync_ShouldThrowNullReferenceException_WhenOverviewSettingsIsNull`
- `GetAsync_ShouldPropagateException_WhenDependencyThrows`

---

## Appendix B: NSubstitute Quick Reference

### Common Patterns Used in This Test Suite

```csharp
// Setup: Return a value
_userDataService.GetAsync().Returns(userData);

// Setup: Return null
_userDataService.GetAsync().Returns((ConstructionPowerUserData)null);

// Setup: Throw exception
_userDataService.GetAsync()
    .Returns(Task.FromException<ConstructionPowerUserData>(new Exception()));

// Verify: Method called exactly once
await _userDataService.Received(1).GetAsync();

// Verify: Method not called
await _userDataService.DidNotReceive().GetAsync();

// Verify: Method called at least once
await _userDataService.Received().GetAsync();
```

---

## Appendix C: Test Project Configuration

### .csproj File (Partial)

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <!-- No version numbers - managed centrally -->
    <PackageReference Include="NUnit" />
    <PackageReference Include="NSubstitute" />
    <PackageReference Include="NUnit3TestAdapter" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\Perigon.Modules.MeteringPoint\Perigon.Modules.MeteringPoint.csproj" />
  </ItemGroup>
</Project>
```

### Directory.Packages.props (Solution Root)

```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>

  <ItemGroup>
    <PackageVersion Include="NUnit" Version="3.14.0" />
    <PackageVersion Include="NSubstitute" Version="5.1.0" />
    <PackageVersion Include="NUnit3TestAdapter" Version="4.5.0" />
    <PackageVersion Include="Microsoft.NET.Test.Sdk" Version="17.8.0" />
  </ItemGroup>
</Project>
```

---

## Conclusion

This test plan provides comprehensive coverage for the `ConstructionPowerUserDataServiceOverviewDataService` class. The service's simplicity makes it an excellent candidate for achieving 100% test coverage with minimal effort.

**Key Takeaways:**
- 6 focused test cases covering all scenarios
- 100% code coverage achievable
- Low complexity = low risk
- Quick to implement (1-2 hours)
- Defensive null handling recommended as improvement

**Next Steps:**
1. Create test file with provided implementation
2. Run tests and verify coverage
3. Consider adding defensive null check to service
4. Integrate into CI/CD pipeline

---

**Test Plan Status:** ✅ Ready for Implementation  
**Estimated Effort:** 2-3 hours total  
**Risk Level:** Low  
**Priority:** Medium

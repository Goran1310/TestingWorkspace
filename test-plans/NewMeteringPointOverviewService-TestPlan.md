# Test Plan: NewMeteringPointOverviewService

**Module**: Perigon.Modules.MeteringPoint  
**Service**: `NewMeteringPointOverviewService`  
**Test Author**: Generated Test Plan  
**Date**: December 9, 2025  
**Current Coverage**: 0%  
**Target Coverage**: 100%

---
dotnet test --filter "FullyQualifiedName~NewMeteringPointOverviewServiceTests"
dotnet test --collect:"XPlat Code Coverage"
dotnet test --filter "FullyQualifiedName~NewMeteringPointOverviewServiceTests" --verbosity minimal

git checkout -b tests/NewMeteringPointOverviewService
git checkout tests/NewMeteringPointOverviewService
git add tests/Perigon.Modules.MeteringPoint.UnitTests/Utils/Services/NewMeteringPoint/NewMeteringPointOverviewServiceTests.cs
git commit -m "NewMeteringPointOverviewServiceTests"

Commit hash: 6d71f3b2d0
Branch: tests/NewMeteringPointOverviewService
Changes: 1 file changed, 2,824 insertions (99 comprehensive unit tests)


=>Push and create a PR


## Executive Summary

This test plan covers comprehensive testing for `NewMeteringPointOverviewService`, a service responsible for managing New Metering Point process overview data and state transitions. The service acts as a bridge between the repository layer and presentation layer, utilizing AutoMapper for DTO-to-ViewModel mapping.

### Key Responsibilities
- Retrieve process overview data grouped by state
- Map DTOs to ViewModels using AutoMapper
- Update process state transitions
- Coordinate repository operations for New Metering Point workflows

---

## Service Overview

### Dependencies
- **INewMeteringPointOverviewRepository**: Database operations for process data
- **IMapper**: AutoMapper for DTO-to-ViewModel transformations

### Methods Under Test
1. `GetOverviewByStateAsync()` - Retrieves all process states from repository and maps to ViewModels
2. `UpdateStateAsync(int processId, int newState)` - Updates process state in database

### Data Models

#### DTOs (Domain Layer)
- **ProcessState**: Domain transfer object
  - `WorkorderId` (int?)
  - `MeteringpointId` (string)
  - `MeteringpointNo` (int?)
  - `State` (NewMeteringPointProcessStates enum)

#### ViewModels (Presentation Layer)
- **ProcessStateVM**: View model
  - `WorkorderId` (int?)
  - `MeteringpointId` (string)
  - `MeteringpointNo` (int?)
  - `State` (NewMeteringPointProcessStates enum)
  - `CurrentUser` (string)
  - `LastChanged` (DateTime?)

#### Enums
- **NewMeteringPointProcessStates**:
  - `Done = 98`
  - `Failed = 96`
  - `Cancelled = 97`

---

## Test Scope

### In Scope
✅ Repository method invocation (`CreateProcessAsync`, `UpdateStateAsync`)  
✅ AutoMapper mapping verification (ProcessState → ProcessStateVM)  
✅ Collection handling (IEnumerable operations)  
✅ Async/await pattern validation  
✅ Null/empty collection handling  
✅ State transition parameter validation  
✅ Enum state value handling  

### Out of Scope
❌ Database implementation details  
❌ AutoMapper configuration (assumed configured externally)  
❌ Repository business logic  
❌ Transaction management  
❌ Authorization/authentication  

---

## Test Scenarios

## Region 1: GetOverviewByStateAsync() - Happy Path Tests

### Test 1.1: GetOverviewByStateAsync_ShouldReturnMappedViewModels_WhenRepositoryReturnsData
**Priority**: High  
**Description**: Verify service retrieves data from repository and maps to ViewModels correctly

**Arrange**:
- Repository returns list of ProcessState DTOs with valid data
- Mapper configured to map ProcessState → ProcessStateVM
- Sample data:
  ```csharp
  new ProcessState 
  { 
      WorkorderId = 12345, 
      MeteringpointId = "MP-001", 
      MeteringpointNo = 1001,
      State = NewMeteringPointProcessStates.Done 
  }
  ```

**Act**: Call `GetOverviewByStateAsync()`

**Assert**:
- Result is not null
- Result is IEnumerable<ProcessStateVM>
- Repository.CreateProcessAsync called once
- Mapper.Map called once with correct source type
- Returned ViewModels contain expected data
- State values correctly preserved (Done = 98)

---

### Test 1.2: GetOverviewByStateAsync_ShouldReturnEmptyCollection_WhenRepositoryReturnsEmpty
**Priority**: High  
**Description**: Verify service handles empty repository results gracefully

**Arrange**:
- Repository returns empty IEnumerable<ProcessState>
- Mapper configured to handle empty collections

**Act**: Call `GetOverviewByStateAsync()`

**Assert**:
- Result is not null
- Result is empty IEnumerable<ProcessStateVM>
- No NullReferenceException thrown
- Repository.CreateProcessAsync called once
- Mapper.Map called once

---

### Test 1.3: GetOverviewByStateAsync_ShouldMapMultipleStates_WhenRepositoryReturnsMultipleProcesses
**Priority**: High  
**Description**: Verify service correctly maps collections with multiple process states

**Arrange**:
- Repository returns 3 ProcessState DTOs with different states:
  - State = Done (98)
  - State = Failed (96)
  - State = Cancelled (97)
- Mapper configured for collection mapping

**Act**: Call `GetOverviewByStateAsync()`

**Assert**:
- Result contains 3 ProcessStateVM items
- All states correctly mapped and preserved
- Collection order maintained (if applicable)
- Each ViewModel has correct state enum value

---

### Test 1.4: GetOverviewByStateAsync_ShouldHandleNullProperties_WhenDTOHasNullValues
**Priority**: Medium  
**Description**: Verify service handles nullable properties correctly

**Arrange**:
- Repository returns ProcessState with null WorkorderId and MeteringpointNo
- Mapper configured to handle null values

**Act**: Call `GetOverviewByStateAsync()`

**Assert**:
- Result is not null
- ViewModels have null WorkorderId and MeteringpointNo
- MeteringpointId (required string) is not null
- State enum value is preserved

---

## Region 2: GetOverviewByStateAsync() - AutoMapper Integration Tests

### Test 2.1: GetOverviewByStateAsync_ShouldCallMapper_WithCorrectSourceType
**Priority**: High  
**Description**: Verify service invokes AutoMapper with correct source collection type

**Arrange**:
- Repository returns IEnumerable<ProcessState>
- Mapper mock configured

**Act**: Call `GetOverviewByStateAsync()`

**Assert**:
- Mapper.Map<IEnumerable<ProcessStateVM>> called once
- Source parameter is IEnumerable<ProcessState>
- Mapper receives repository result directly

---

### Test 2.2: GetOverviewByStateAsync_ShouldReturnMapperResult_WithoutModification
**Priority**: High  
**Description**: Verify service returns mapper output without additional transformation

**Arrange**:
- Repository returns ProcessState collection
- Mapper returns specific ProcessStateVM collection
- No additional processing expected

**Act**: Call `GetOverviewByStateAsync()`

**Assert**:
- Result equals mapper output exactly
- No additional filtering or transformation applied
- Reference equality with mapper result (if applicable)

---

### Test 2.3: GetOverviewByStateAsync_ShouldPreserveEnumValues_DuringMapping
**Priority**: High  
**Description**: Verify enum values are correctly mapped (Done=98, Failed=96, Cancelled=97)

**Arrange**:
- Repository returns ProcessState with State = NewMeteringPointProcessStates.Failed (96)
- Mapper configured to preserve enum values

**Act**: Call `GetOverviewByStateAsync()`

**Assert**:
- Result[0].State equals NewMeteringPointProcessStates.Failed
- Enum numeric value is 96
- No enum conversion errors

---

## Region 3: GetOverviewByStateAsync() - Error Handling Tests

### Test 3.1: GetOverviewByStateAsync_ShouldPropagateException_WhenRepositoryThrows
**Priority**: High  
**Description**: Verify service does not suppress repository exceptions

**Arrange**:
- Repository.CreateProcessAsync throws InvalidOperationException("Database error")

**Act & Assert**:
- Expect InvalidOperationException to be thrown
- Exception message contains "Database error"
- Mapper not called

---

### Test 3.2: GetOverviewByStateAsync_ShouldPropagateException_WhenMapperThrows
**Priority**: High  
**Description**: Verify service does not suppress AutoMapper exceptions

**Arrange**:
- Repository returns valid data
- Mapper.Map throws AutoMapperMappingException

**Act & Assert**:
- Expect AutoMapperMappingException to be thrown
- Repository was called before mapper failure
- Exception propagates to caller

---

### Test 3.3: GetOverviewByStateAsync_ShouldHandleNullRepository_WhenDependencyInjectionFails
**Priority**: Low  
**Description**: Verify constructor enforces non-null repository (defensive programming)

**Note**: Typically enforced by DI container, but validates contract

**Arrange**:
- Attempt to construct service with null repository

**Act & Assert**:
- ArgumentNullException thrown (if validation exists)
- **OR** NullReferenceException during method call (documents behavior)

---

## Region 4: UpdateStateAsync() - Happy Path Tests

### Test 4.1: UpdateStateAsync_ShouldCallRepository_WithCorrectParameters
**Priority**: High  
**Description**: Verify service passes parameters to repository correctly

**Arrange**:
- processId = 12345
- newState = 98 (Done)
- Repository.UpdateStateAsync configured to succeed

**Act**: Call `UpdateStateAsync(12345, 98)`

**Assert**:
- Repository.UpdateStateAsync called once
- Parameters: processId = 12345, newState = 98
- Method completes without exception

---

### Test 4.2: UpdateStateAsync_ShouldCompleteSuccessfully_WhenRepositorySucceeds
**Priority**: High  
**Description**: Verify service completes successfully for valid state transitions

**Arrange**:
- processId = 999
- newState = 96 (Failed)
- Repository returns completed Task

**Act**: Call `UpdateStateAsync(999, 96)`

**Assert**:
- Method completes without exception
- Repository.UpdateStateAsync called once
- No additional operations performed

---

### Test 4.3: UpdateStateAsync_ShouldHandleAllEnumStates_WhenTransitioningStates
**Priority**: Medium  
**Description**: Verify service supports all enum state values

**Arrange**:
- Test with all enum values:
  - Done (98)
  - Failed (96)
  - Cancelled (97)

**Act**: Call `UpdateStateAsync()` for each state

**Assert**:
- Repository called 3 times
- Each call uses correct numeric value
- All transitions succeed

---

### Test 4.4: UpdateStateAsync_ShouldAcceptNegativeProcessId_IfRepositoryAllows
**Priority**: Low  
**Description**: Verify service does not validate processId (delegated to repository)

**Arrange**:
- processId = -1 (invalid in business logic, but not validated by service)
- newState = 98

**Act**: Call `UpdateStateAsync(-1, 98)`

**Assert**:
- Repository.UpdateStateAsync called with processId = -1
- Service does not perform validation (repository responsibility)

**Note**: Documents that service acts as pass-through without validation

---

## Region 5: UpdateStateAsync() - Error Handling Tests

### Test 5.1: UpdateStateAsync_ShouldPropagateException_WhenRepositoryThrows
**Priority**: High  
**Description**: Verify service propagates repository exceptions to caller

**Arrange**:
- processId = 12345
- newState = 98
- Repository.UpdateStateAsync throws DbUpdateException("Update failed")

**Act & Assert**:
- Expect DbUpdateException to be thrown
- Exception message contains "Update failed"
- No exception suppression or swallowing

---

### Test 5.2: UpdateStateAsync_ShouldPropagateException_WhenConcurrencyConflictOccurs
**Priority**: Medium  
**Description**: Verify service does not handle concurrency exceptions

**Arrange**:
- Repository throws DbUpdateConcurrencyException

**Act & Assert**:
- Expect DbUpdateConcurrencyException to propagate
- Service does not retry or handle concurrency
- Caller responsible for conflict resolution

---

### Test 5.3: UpdateStateAsync_ShouldAcceptInvalidStateValue_WithoutValidation
**Priority**: Low  
**Description**: Verify service does not validate state enum values

**Arrange**:
- processId = 123
- newState = 999 (invalid enum value, not in 96/97/98)

**Act**: Call `UpdateStateAsync(123, 999)`

**Assert**:
- Repository.UpdateStateAsync called with newState = 999
- No ArgumentException thrown by service
- Validation delegated to repository/database

**Note**: Documents service does not perform enum validation

---

## Region 6: UpdateStateAsync() - Repository Interaction Tests

### Test 6.1: UpdateStateAsync_ShouldNotInvokeMapper_WhenUpdatingState
**Priority**: Medium  
**Description**: Verify UpdateStateAsync does not use AutoMapper

**Arrange**:
- processId = 100
- newState = 97
- Mapper mock configured

**Act**: Call `UpdateStateAsync(100, 97)`

**Assert**:
- Repository.UpdateStateAsync called once
- Mapper.Map never called
- Direct parameter pass-through only

---

### Test 6.2: UpdateStateAsync_ShouldAwaitRepositoryCall_BeforeReturning
**Priority**: High  
**Description**: Verify async/await pattern is correctly implemented

**Arrange**:
- Repository.UpdateStateAsync returns Task with delay
- Monitor async execution

**Act**: Call `await UpdateStateAsync(123, 98)`

**Assert**:
- Method awaits repository completion
- Returns only after repository Task completes
- No ConfigureAwait(false) issues

---

### Test 6.3: UpdateStateAsync_ShouldCallRepositoryOnce_WhenCalledOnce
**Priority**: Medium  
**Description**: Verify no duplicate repository calls

**Arrange**:
- processId = 555
- newState = 98

**Act**: Call `UpdateStateAsync(555, 98)`

**Assert**:
- Repository.UpdateStateAsync received exactly 1 call
- No retry logic present
- No duplicate execution

---

## Region 7: Integration Tests

### Test 7.1: GetThenUpdate_ShouldWorkInSequence_WhenCalledSequentially
**Priority**: High  
**Description**: Verify service methods can be called in sequence without issues

**Arrange**:
- Repository configured for both CreateProcessAsync and UpdateStateAsync
- Mapper configured

**Act**:
1. Call `GetOverviewByStateAsync()` - retrieve process with WorkorderId 100
2. Call `UpdateStateAsync(100, 97)` - update state to Cancelled

**Assert**:
- GetOverviewByStateAsync returns data successfully
- UpdateStateAsync completes successfully
- Repository.CreateProcessAsync called once
- Repository.UpdateStateAsync called once
- No state conflicts or concurrency issues

---

### Test 7.2: MultipleGetCalls_ShouldCallRepositoryMultipleTimes_WhenCalledMultipleTimes
**Priority**: Medium  
**Description**: Verify service does not cache repository results

**Arrange**:
- Repository configured to return different data on each call

**Act**:
- Call `GetOverviewByStateAsync()` 3 times

**Assert**:
- Repository.CreateProcessAsync called 3 times
- Mapper.Map called 3 times
- No caching behavior observed
- Each call is independent

---

### Test 7.3: ConcurrentCalls_ShouldNotInterfere_WhenCalledFromMultipleThreads
**Priority**: Low  
**Description**: Verify service is stateless and thread-safe

**Arrange**:
- Repository and Mapper configured for concurrent access
- No shared mutable state in service

**Act**:
- Call `GetOverviewByStateAsync()` from 10 concurrent tasks

**Assert**:
- All tasks complete successfully
- Repository called 10 times
- No race conditions or shared state issues

**Note**: Service should be stateless by design

---

## Risk Assessment

### High-Risk Areas
1. **AutoMapper Dependency**: Service relies on external AutoMapper configuration
   - **Risk**: Mapping failures if AutoMapper not properly configured
   - **Mitigation**: Validate AutoMapper configuration in integration tests
   
2. **No Input Validation**: Service does not validate processId or newState
   - **Risk**: Invalid data passed directly to repository
   - **Mitigation**: Repository layer must handle validation

3. **Exception Propagation**: Service does not handle exceptions
   - **Risk**: Unhandled exceptions propagate to caller
   - **Mitigation**: Controller/caller must implement error handling

### Medium-Risk Areas
1. **Naming Confusion**: Repository method `CreateProcessAsync` suggests creation but retrieves data
   - **Risk**: Misleading method name may cause confusion
   - **Mitigation**: Document actual behavior clearly

2. **No Return Value from UpdateStateAsync**: Void return provides no success/failure indication
   - **Risk**: Caller cannot determine if update succeeded
   - **Mitigation**: Rely on exception handling for failure detection

### Low-Risk Areas
1. **Simple Service Layer**: Minimal business logic reduces complexity
2. **Dependency Injection**: Well-abstracted dependencies
3. **Async Patterns**: Standard async/await usage

---

## Test Implementation Guidelines

### Test Framework
- **Framework**: NUnit 3.14.0
- **Mocking**: NSubstitute 5.1.0
- **Pattern**: Arrange-Act-Assert

### Mock Setup Patterns

#### Repository Mock
```csharp
private INewMeteringPointOverviewRepository SetupRepository()
{
    return Substitute.For<INewMeteringPointOverviewRepository>();
}

// For GetOverviewByStateAsync tests
var processStates = new List<ProcessState>
{
    new ProcessState 
    { 
        WorkorderId = 123, 
        MeteringpointId = "MP-001",
        MeteringpointNo = 1001,
        State = NewMeteringPointProcessStates.Done 
    }
};
_repository.CreateProcessAsync().Returns(processStates);

// For UpdateStateAsync tests
_repository.UpdateStateAsync(Arg.Any<int>(), Arg.Any<int>())
    .Returns(Task.CompletedTask);
```

#### AutoMapper Mock
```csharp
private IMapper SetupMapper()
{
    return Substitute.For<IMapper>();
}

// Configure mapping
var viewModels = new List<ProcessStateVM>
{
    new ProcessStateVM 
    { 
        WorkorderId = 123, 
        MeteringpointId = "MP-001",
        MeteringpointNo = 1001,
        State = NewMeteringPointProcessStates.Done,
        CurrentUser = "testuser",
        LastChanged = DateTime.Now
    }
};
_mapper.Map<IEnumerable<ProcessStateVM>>(Arg.Any<IEnumerable<ProcessState>>())
    .Returns(viewModels);
```

### Test Naming Convention
```
MethodName_ShouldExpectedBehavior_WhenCondition
```

### Test Categories
```csharp
[TestFixture]
[TestOf(typeof(NewMeteringPointOverviewService))]
[Category("UnitTests")]
[Category("NewMeteringPoint")]
[Category("OverviewService")]
public class NewMeteringPointOverviewServiceTests
```

---

## Success Metrics

### Coverage Goals
- **Line Coverage**: 100%
- **Branch Coverage**: 100%
- **Method Coverage**: 100%

### Test Count Estimate
- **GetOverviewByStateAsync Tests**: ~12 tests
- **UpdateStateAsync Tests**: ~9 tests
- **Integration Tests**: ~3 tests
- **Total Estimated**: **24 tests**

### Pass Criteria
✅ All tests pass consistently  
✅ No test dependencies or ordering requirements  
✅ Fast execution (<3 seconds for full suite)  
✅ Clear test failure messages  
✅ All mocks properly verified  

---

## Appendix: Code Insights

### Observations
1. **Simple Service Pattern**: Service acts as thin layer between repository and presentation
2. **AutoMapper Usage**: Legacy pattern - Hansen is moving away from AutoMapper to explicit mapping
3. **Method Naming**: `CreateProcessAsync` suggests creation but actually retrieves data (misleading)
4. **No Validation**: Service trusts caller to provide valid input
5. **No Error Handling**: Exceptions propagate directly to caller
6. **Stateless Design**: No instance variables modified, thread-safe by design

### Recommendations for Production Code
1. **Rename Repository Method**: `CreateProcessAsync` → `GetProcessStatesAsync` for clarity
2. **Consider Removing AutoMapper**: Replace with explicit mapping method for compile-time safety
3. **Add Logging**: Log method entry/exit and exceptions for troubleshooting
4. **Return Result Object**: UpdateStateAsync could return bool or Result<T> for success indication
5. **Add XML Documentation**: Document method behavior and exception scenarios

### Dependencies to Import for Tests
```csharp
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using NSubstitute;
using NUnit.Framework;
using Perigon.Modules.MeteringPoint.Domains.DataTransferObjects.NewMeteringPoint;
using Perigon.Modules.MeteringPoint.Domains.Interfaces.NewMeteringPoint;
using Perigon.Modules.MeteringPoint.Utils.Services.NewMeteringPoint;
using Perigon.Modules.MeteringPoint.ViewModels.NewMeteringPoint;
```

---

## AutoMapper Configuration Note

⚠️ **Important**: Hansen Technologies is deprecating AutoMapper usage

**For This Service**:
- Tests will mock `IMapper` since existing code uses it
- When refactoring, replace with explicit mapping:
  ```csharp
  private ProcessStateVM MapToViewModel(ProcessState dto)
  {
      return new ProcessStateVM
      {
          WorkorderId = dto.WorkorderId,
          MeteringpointId = dto.MeteringpointId,
          MeteringpointNo = dto.MeteringpointNo,
          State = dto.State,
          CurrentUser = GetCurrentUser(), // Add business logic
          LastChanged = DateTime.UtcNow
      };
  }
  ```

**Testing Strategy**:
- ✅ Mock `IMapper` for testing existing service
- ✅ Verify mapper is called with correct source data
- ⏭️ When refactored, replace mapper tests with mapping logic tests

---

## Next Steps

1. ✅ Review test plan with team
2. ⏳ Create test file: `NewMeteringPointOverviewServiceTests.cs`
3. ⏳ Implement helper methods for mock setup
4. ⏳ Implement Region 1 tests (GetOverviewByStateAsync happy path)
5. ⏳ Implement Region 2 tests (AutoMapper integration)
6. ⏳ Implement Region 3 tests (Error handling)
7. ⏳ Implement Region 4 tests (UpdateStateAsync happy path)
8. ⏳ Implement Region 5 tests (UpdateStateAsync error handling)
9. ⏳ Implement Region 6 tests (Repository interaction)
10. ⏳ Implement Region 7 tests (Integration scenarios)
11. ⏳ Run coverage report
12. ⏳ Address any gaps identified
13. ⏳ Code review and PR

---

**Test Plan Version**: 1.0  
**Status**: Ready for Implementation  
**Estimated Effort**: 3-4 hours for complete test suite

---

## Additional Notes

### Method Name Clarification
The repository method `CreateProcessAsync()` is **misleading**. Based on the service implementation:
- **Actual Behavior**: Retrieves/reads process state data
- **Suggested Name**: `GetProcessStatesAsync()` or `GetAllProcessStatesAsync()`
- **Current Name Implies**: Creating new processes (which it does not do)

This should be noted in tests and potentially raised as a refactoring opportunity.

### Enum State Values
The `NewMeteringPointProcessStates` enum uses non-sequential values:
- `Done = 98`
- `Cancelled = 97`
- `Failed = 96`

Tests should verify these exact numeric values are preserved during mapping and updates.

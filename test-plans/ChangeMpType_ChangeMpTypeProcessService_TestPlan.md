# Test Plan: ChangeMpTypeProcessService

## Executive Summary

**Service:** `ChangeMpTypeProcessService`  
**Namespace:** `Perigon.Modules.MeteringPoint.Utils.Services.ChangeMpType`  
**Complexity:** Very High  
**Test Count:** 45-50 tests  
**Estimated Effort:** 8-12 hours  
**Priority:** High

### Purpose
Orchestrates metering point type changes (Production, Consumption, Combination) with complex business logic for retailers, metering series, and limits across different process types.

---

## Service Architecture

### Interface
```csharp
public interface IChangeMpTypeProcessService
{
    void RemoveReference();
    Task<ChangeMpTypeVM> GetChangeMpTypeVMAsync(int? workorderId);
    Task<int> ExecuteProcess(ChangeMpTypeVM vm);
    Task ReProcessAsync(int workorderId);
    Task<List<MeteringpointLimitVM>> GetMeteringpointLimitAsync(int? meterinpointNo);
    Task<IEnumerable<MpTypeTemplate>> GetTemplatesAsync(ChangeMpTypeProcessType processType);
    Task<List<ChangeMpTypeSummaryRetailer>> ShowRetailerSummary(ChangeMpTypeVM vm);
    Task<List<ChangeMpTypeSummaryMeteringseries>> ShowMeteringseriesSummary(ChangeMpTypeVM vm);
    Task<List<ChangeMpTypeSummaryMpLimit>> ShowMeteringpointLimitSummary(ChangeMpTypeVM vm);
    Task<bool> CancelProcessAsync(int workorderId);
    Task<bool> SetState(int workorderId, ChangeMpTypeProcessStates state); // Not in interface but public
}
```

### Dependencies
1. **IMapper** - AutoMapper for DTO/ViewModel mapping (legacy)
2. **IHttpContextAccessor** - HTTP session access
3. **IChangeMpTypeProcessRepository** - Process persistence
4. **IChangeMpTypeSummaryRepository** - Summary data access
5. **IChangeMpTypeTemplatesRepository** - Template management
6. **IPtabRepository** - Reading type lookup

### Key Features
- **Process Types**: MpType_prod (Production), MpType_cons (Consumption), MpType_comb (Combination)
- **Session Management**: Stores process ID in session with key "changemptype-process-id"
- **JSON Serialization**: StepData encoded as byte array
- **Complex Business Logic**: Different behavior based on process type
- **Direction of Flow**: In (production) vs Out (consumption)
- **Date Management**: Default end date 2073-06-01, change date transitions

### Enums Used
- **ChangeMpTypeProcessType**: MpType_prod, MpType_cons, MpType_comb
- **ChangeMpTypeProcessStates**: (Similar to other process states)
- **DirectionOfFlowNo**: In, Out
- **MpTypeId**: Production, Consumption, Combination
- **ComponentTypeId**: Electricity_meter
- **LimittypeNo**: Max_Power

---

## Test Scenarios

### RemoveReference Method (2 tests)

#### 1. RemoveReference_ShouldRemoveSessionKey_WhenCalled
**Priority:** High  
**Type:** Positive  

**Arrange:**
- Mock session with process ID stored

**Act:** Call RemoveReference()

**Assert:**
- Session.Remove called once with "changemptype-process-id"

---

#### 2. RemoveReference_ShouldHandleMultipleCalls_WithoutException
**Priority:** Medium  
**Type:** Edge Case  

**Arrange:**
- Mock session

**Act:** Call RemoveReference() twice

**Assert:**
- Session.Remove called twice
- No exceptions thrown

---

### GetChangeMpTypeVMAsync Method (6 tests)

#### 3. GetChangeMpTypeVMAsync_ShouldReturnVM_WhenProcessExists
**Priority:** High  
**Type:** Positive  

**Arrange:**
- Mock repository returns ProcessState with valid StepData
- Mock mapper returns ExecuteVM
- StepData contains serialized ExecuteDataVM

**Act:** Call GetChangeMpTypeVMAsync(123)

**Assert:**
- Result not null
- MeteringpointStep, MpTypeStep, SummaryStep deserialized correctly
- State and ProcessType mapped
- MeteringpointLimit initialized as empty list
- Repository called with correct workorderId

---

#### 4. GetChangeMpTypeVMAsync_ShouldHandleNullStepData_Gracefully
**Priority:** High  
**Type:** Edge Case  

**Arrange:**
- Mock repository returns ExecuteVM with null StepData

**Act:** Call GetChangeMpTypeVMAsync(123)

**Assert:**
- Result not null
- Steps are null (deserialization returns null)
- No exceptions thrown

---

#### 5. GetChangeMpTypeVMAsync_ShouldHandleEmptyStepData_Gracefully
**Priority:** Medium  
**Type:** Edge Case  

**Arrange:**
- Mock repository returns ExecuteVM with empty byte array

**Act:** Call GetChangeMpTypeVMAsync(123)

**Assert:**
- Handles empty JSON gracefully
- Result not null

---

#### 6. GetChangeMpTypeVMAsync_ShouldDeserializeComplexStepData_Correctly
**Priority:** High  
**Type:** Positive  

**Arrange:**
- Create complex ExecuteDataVM with all steps populated
- Serialize to JSON then to byte array
- Mock repository returns this data

**Act:** Call GetChangeMpTypeVMAsync(123)

**Assert:**
- All nested properties deserialized correctly
- Verify MeteringpointStep properties
- Verify MpTypeStep properties
- Verify SummaryStep properties

---

#### 7. GetChangeMpTypeVMAsync_ShouldInitializeEmptyMeteringpointLimit
**Priority:** Medium  
**Type:** Positive  

**Arrange:**
- Valid process data

**Act:** Call GetChangeMpTypeVMAsync(123)

**Assert:**
- MeteringpointLimit is empty list
- Not null

---

#### 8. GetChangeMpTypeVMAsync_ShouldMapStateAndProcessType_Correctly
**Priority:** High  
**Type:** Positive  

**Arrange:**
- ExecuteVM with State = ChangeMpTypeProcessStates.Inprogress
- ProcessType = ChangeMpTypeProcessType.MpType_prod

**Act:** Call GetChangeMpTypeVMAsync(123)

**Assert:**
- Result.State equals Inprogress
- Result.ProcessType equals MpType_prod

---

### GetMeteringpointLimitAsync Method (3 tests)

#### 9. GetMeteringpointLimitAsync_ShouldReturnLimits_WhenDataExists
**Priority:** High  
**Type:** Positive  

**Arrange:**
- Mock repository returns list of MeteringpointLimit DTOs
- Mock mapper returns MeteringpointLimitVM list

**Act:** Call GetMeteringpointLimitAsync(123)

**Assert:**
- Result not null
- Result count matches repository data
- Mapper called with correct data
- Repository called with meteringpointNo

---

#### 10. GetMeteringpointLimitAsync_ShouldReturnEmptyList_WhenNoData
**Priority:** Medium  
**Type:** Edge Case  

**Arrange:**
- Mock repository returns empty list

**Act:** Call GetMeteringpointLimitAsync(123)

**Assert:**
- Result is empty list
- No exceptions

---

#### 11. GetMeteringpointLimitAsync_ShouldHandleNullMeteringpointNo
**Priority:** Medium  
**Type:** Edge Case  

**Arrange:**
- Mock repository to handle null parameter

**Act:** Call GetMeteringpointLimitAsync(null)

**Assert:**
- Repository called with null
- Returns mapped result

---

### GetTemplatesAsync Method (5 tests)

#### 12. GetTemplatesAsync_ShouldReturnProductionTemplates_WhenMpTypeProd
**Priority:** High  
**Type:** Positive  

**Arrange:**
- ProcessType = MpType_prod
- Mock repository returns templates

**Act:** Call GetTemplatesAsync(MpType_prod)

**Assert:**
- Repository called with MpTypeId.Production and ComponentTypeId.Electricity_meter
- Result contains expected templates

---

#### 13. GetTemplatesAsync_ShouldReturnConsumptionTemplates_WhenMpTypeCons
**Priority:** High  
**Type:** Positive  

**Arrange:**
- ProcessType = MpType_cons

**Act:** Call GetTemplatesAsync(MpType_cons)

**Assert:**
- Repository called with MpTypeId.Consumption and ComponentTypeId.Electricity_meter

---

#### 14. GetTemplatesAsync_ShouldReturnCombinationTemplates_WhenMpTypeComb
**Priority:** High  
**Type:** Positive  

**Arrange:**
- ProcessType = MpType_comb

**Act:** Call GetTemplatesAsync(MpType_comb)

**Assert:**
- Repository called with MpTypeId.Combination and ComponentTypeId.Electricity_meter

---

#### 15. GetTemplatesAsync_ShouldReturnNull_WhenProcessTypeUnknown
**Priority:** Medium  
**Type:** Negative  

**Arrange:**
- Invalid ProcessType (cast from int)

**Act:** Call GetTemplatesAsync((ChangeMpTypeProcessType)999)

**Assert:**
- Result is null
- Repository not called

---

#### 16. GetTemplatesAsync_ShouldAlwaysUseElectricityMeter_ComponentType
**Priority:** Low  
**Type:** Verification  

**Arrange:**
- Any valid ProcessType

**Act:** Call GetTemplatesAsync

**Assert:**
- Repository always called with ComponentTypeId.Electricity_meter

---

### ExecuteProcess Method (5 tests)

#### 17. ExecuteProcess_ShouldSerializeAndExecute_WithValidVM
**Priority:** High  
**Type:** Positive  

**Arrange:**
- Valid ChangeMpTypeVM with all steps populated
- Mock repository returns workorderId = 456

**Act:** Call ExecuteProcess(vm)

**Assert:**
- ExecuteVM created with correct properties
- StepData serialized to byte array
- JSON contains all step data
- Mapper.Map<ProcessState> called with ExecuteVM
- Repository.ExecuteProcess called
- Returns 456

---

#### 18. ExecuteProcess_ShouldHandleNullableProperties_Correctly
**Priority:** High  
**Type:** Edge Case  

**Arrange:**
- VM with MeteringpointNo = null, MeteringpointId = null

**Act:** Call ExecuteProcess(vm)

**Assert:**
- GetValueOrDefault() returns 0 for null int
- ExecuteVM.MeteringpointNo = 0
- ExecuteVM.MeteringpointId = null

---

#### 19. ExecuteProcess_ShouldSerializeAllSteps_ToStepData
**Priority:** High  
**Type:** Positive  

**Arrange:**
- ChangeMpTypeVM with complex nested data

**Act:** Call ExecuteProcess(vm)

**Assert:**
- StepData byte array can be deserialized back
- All properties preserved in JSON

---

#### 20. ExecuteProcess_ShouldMapStateAndProcessType
**Priority:** Medium  
**Type:** Positive  

**Arrange:**
- VM with State = Inprogress, ProcessType = MpType_cons

**Act:** Call ExecuteProcess(vm)

**Assert:**
- ExecuteVM.State = Inprogress
- ExecuteVM.ProcessType = MpType_cons

---

#### 21. ExecuteProcess_ShouldReturnWorkorderId_FromRepository
**Priority:** High  
**Type:** Positive  

**Arrange:**
- Mock repository returns specific workorderId = 789

**Act:** Call ExecuteProcess(vm)

**Assert:**
- Result equals 789

---

### ReProcessAsync Method (2 tests)

#### 22. ReProcessAsync_ShouldDelegateToRepository
**Priority:** High  
**Type:** Positive  

**Arrange:**
- Mock repository

**Act:** Call ReProcessAsync(123)

**Assert:**
- Repository.ReProcess called once with 123

---

#### 23. ReProcessAsync_ShouldPropagateExceptions
**Priority:** Medium  
**Type:** Negative  

**Arrange:**
- Mock repository throws exception

**Act & Assert:**
- Assert.ThrowsAsync for expected exception

---

### ShowRetailerSummary Method (10 tests - VERY COMPLEX)

This method has **extremely complex conditional logic** based on process type and existing retailers.

#### 24. ShowRetailerSummary_ShouldReturnEmptyList_WhenNoActiveRetailers
**Priority:** High  
**Type:** Edge Case  

**Arrange:**
- Repository returns retailers with Todate < DateTime.Now

**Act:** Call ShowRetailerSummary(vm)

**Assert:**
- Result is empty list

---

#### 25. ShowRetailerSummary_ShouldAddProductionRetailer_WhenMpTypeCombAndProdMissing
**Priority:** High  
**Type:** Business Logic  

**Arrange:**
- ProcessType = MpType_comb
- Active retailers only have DirectionOfFlowNo.Out
- ChangeDate = 2025-01-01

**Act:** Call ShowRetailerSummary(vm)

**Assert:**
- New retailer added with DirectionOfFlowNo.In
- Fromdate = ChangeDate
- Todate = 2073-06-01
- RetailerName matches existing

---

#### 26. ShowRetailerSummary_ShouldAddConsumptionRetailer_WhenMpTypeCombAndConsMissing
**Priority:** High  
**Type:** Business Logic  

**Arrange:**
- ProcessType = MpType_comb
- Active retailers only have DirectionOfFlowNo.In

**Act:** Call ShowRetailerSummary(vm)

**Assert:**
- New retailer added with DirectionOfFlowNo.Out

---

#### 27. ShowRetailerSummary_ShouldCloseNonConsRetailers_WhenMpTypeCons
**Priority:** High  
**Type:** Business Logic  

**Arrange:**
- ProcessType = MpType_cons
- Active retailers with DirectionOfFlowNo.In
- ChangeDate = 2025-06-01

**Act:** Call ShowRetailerSummary(vm)

**Assert:**
- Retailers with DirectionOfFlowNo != Out have Todate = ChangeDate
- Out retailer remains unchanged

---

#### 28. ShowRetailerSummary_ShouldAddOutRetailer_WhenMpTypeConsAndOutMissing
**Priority:** High  
**Type:** Business Logic  

**Arrange:**
- ProcessType = MpType_cons
- No DirectionOfFlowNo.Out retailer exists

**Act:** Call ShowRetailerSummary(vm)

**Assert:**
- New Out retailer added
- Existing non-Out retailers closed

---

#### 29. ShowRetailerSummary_ShouldCloseNonProdRetailers_WhenMpTypeProd
**Priority:** High  
**Type:** Business Logic  

**Arrange:**
- ProcessType = MpType_prod
- Active retailers with DirectionOfFlowNo.Out

**Act:** Call ShowRetailerSummary(vm)

**Assert:**
- Retailers with DirectionOfFlowNo != In have Todate = ChangeDate

---

#### 30. ShowRetailerSummary_ShouldAddInRetailer_WhenMpTypeProdAndInMissing
**Priority:** High  
**Type:** Business Logic  

**Arrange:**
- ProcessType = MpType_prod
- No DirectionOfFlowNo.In retailer exists

**Act:** Call ShowRetailerSummary(vm)

**Assert:**
- New In retailer added

---

#### 31. ShowRetailerSummary_ShouldFilterByTodate_GreaterThanOrEqualNow
**Priority:** High  
**Type:** Positive  

**Arrange:**
- Repository returns mix of active and expired retailers

**Act:** Call ShowRetailerSummary(vm)

**Assert:**
- Only retailers with Todate >= DateTime.Now.Date included

---

#### 32. ShowRetailerSummary_ShouldUseFirstRetailerName_ForNewRetailers
**Priority:** Medium  
**Type:** Business Logic  

**Arrange:**
- Multiple active retailers

**Act:** Call ShowRetailerSummary(vm)

**Assert:**
- New retailer has RetailerName from first active retailer

---

#### 33. ShowRetailerSummary_ShouldHandleMixedScenarios_Correctly
**Priority:** High  
**Type:** Complex Integration  

**Arrange:**
- ProcessType = MpType_comb
- Active retailers with both In and Out

**Act:** Call ShowRetailerSummary(vm)

**Assert:**
- No new retailers added (both directions exist)
- Original list returned

---

### ShowMeteringseriesSummary Method (8 tests - COMPLEX)

#### 34. ShowMeteringseriesSummary_ShouldCloseInSeries_WhenMpTypeCons
**Priority:** High  
**Type:** Business Logic  

**Arrange:**
- ProcessType = MpType_cons
- Existing series with DirectionOfFlowNo.In

**Act:** Call ShowMeteringseriesSummary(vm)

**Assert:**
- In series Todate = ChangeDate

---

#### 35. ShowMeteringseriesSummary_ShouldCloseOutSeries_WhenMpTypeProd
**Priority:** High  
**Type:** Business Logic  

**Arrange:**
- ProcessType = MpType_prod
- Existing series with DirectionOfFlowNo.Out

**Act:** Call ShowMeteringseriesSummary(vm)

**Assert:**
- Out series Todate = ChangeDate

---

#### 36. ShowMeteringseriesSummary_ShouldAddSelectedSeries_FromTemplate
**Priority:** High  
**Type:** Positive  

**Arrange:**
- VM with MpTypeStep.Meteringseries where Selected = true
- Mock ptabRepository returns reading types

**Act:** Call ShowMeteringseriesSummary(vm)

**Assert:**
- New series added for each selected template
- Fromdate = ChangeDate
- Todate = 2073-06-01
- Properties mapped correctly

---

#### 37. ShowMeteringseriesSummary_ShouldUseMeterNoFromExisting_ForNewSeries
**Priority:** Medium  
**Type:** Business Logic  

**Arrange:**
- Existing series with MeterNo = "M123"
- Selected templates

**Act:** Call ShowMeteringseriesSummary(vm)

**Assert:**
- All new series have MeterNo = "M123"

---

#### 38. ShowMeteringseriesSummary_ShouldLookupReadingTypeName_FromPtab
**Priority:** High  
**Type:** Positive  

**Arrange:**
- Selected template with RegisterType = 5
- Ptab returns ReadingTypeName = "Active Energy"

**Act:** Call ShowMeteringseriesSummary(vm)

**Assert:**
- New series ReadingTypeName = "Active Energy"
- PtabRepository.GetReadingTypes() called

---

#### 39. ShowMeteringseriesSummary_ShouldHandleMpTypeComb_BothDirections
**Priority:** High  
**Type:** Complex  

**Arrange:**
- ProcessType = MpType_comb
- Selected templates for both In and Out

**Act:** Call ShowMeteringseriesSummary(vm)

**Assert:**
- Series added for both directions
- Correct closing logic applied

---

#### 40. ShowMeteringseriesSummary_ShouldFilterByTodate_GreaterThanOrEqualNow
**Priority:** High  
**Type:** Positive  

**Arrange:**
- Repository returns expired series

**Act:** Call ShowMeteringseriesSummary(vm)

**Assert:**
- Only active series processed

---

#### 41. ShowMeteringseriesSummary_ShouldHandleNoSelectedSeries
**Priority:** Medium  
**Type:** Edge Case  

**Arrange:**
- VM with no selected meteringseries

**Act:** Call ShowMeteringseriesSummary(vm)

**Assert:**
- No new series added
- Existing series processed for closing

---

### ShowMeteringpointLimitSummary Method (7 tests - COMPLEX)

#### 42. ShowMeteringpointLimitSummary_ShouldAddNewOutLimit_WhenMpTypeConsAndMissing
**Priority:** High  
**Type:** Business Logic  

**Arrange:**
- ProcessType = MpType_cons
- No existing Out limit
- Selected limit for Out direction

**Act:** Call ShowMeteringpointLimitSummary(vm)

**Assert:**
- New Out limit added
- Fromdate = ChangeDate
- Todate = 2073-06-01

---

#### 43. ShowMeteringpointLimitSummary_ShouldCloseOldLimit_WhenQuantityChanges
**Priority:** High  
**Type:** Business Logic  

**Arrange:**
- Existing Out limit with Quantity = 100
- Selected limit with Quantity = 200

**Act:** Call ShowMeteringpointLimitSummary(vm)

**Assert:**
- Old limit Todate = ChangeDate
- New limit added with Quantity = 200

---

#### 44. ShowMeteringpointLimitSummary_ShouldAddNewInLimit_WhenMpTypeProdAndMissing
**Priority:** High  
**Type:** Business Logic  

**Arrange:**
- ProcessType = MpType_prod
- Selected In limit

**Act:** Call ShowMeteringpointLimitSummary(vm)

**Assert:**
- New In limit added

---

#### 45. ShowMeteringpointLimitSummary_ShouldHandleMpTypeComb_BothDirections
**Priority:** High  
**Type:** Complex  

**Arrange:**
- ProcessType = MpType_comb
- Selected limits for both directions

**Act:** Call ShowMeteringpointLimitSummary(vm)

**Assert:**
- Both In and Out limits processed correctly

---

#### 46. ShowMeteringpointLimitSummary_ShouldFilterMaxPowerLimits_Only
**Priority:** Medium  
**Type:** Business Logic  

**Arrange:**
- Existing limits with different LimitTypeNo values

**Act:** Call ShowMeteringpointLimitSummary(vm)

**Assert:**
- Only Max_Power limits processed

---

#### 47. ShowMeteringpointLimitSummary_ShouldNotAddNewLimit_WhenQuantityUnchanged
**Priority:** Medium  
**Type:** Business Logic  

**Arrange:**
- Existing Out limit Quantity = 100
- Selected limit Quantity = 100 (same)

**Act:** Call ShowMeteringpointLimitSummary(vm)

**Assert:**
- No new limit added
- Old limit unchanged

---

#### 48. ShowMeteringpointLimitSummary_ShouldHandleNoSelectedLimits
**Priority:** Medium  
**Type:** Edge Case  

**Arrange:**
- VM with no selected limits

**Act:** Call ShowMeteringpointLimitSummary(vm)

**Assert:**
- Returns existing active limits
- No modifications

---

### SetState Method (3 tests)

#### 49. SetState_ShouldReturnTrue_WhenUpdateSucceeds
**Priority:** High  
**Type:** Positive  

**Arrange:**
- Mock repository UpdateStateAsync returns successfully

**Act:** Call SetState(123, ChangeMpTypeProcessStates.Completed)

**Assert:**
- Result is true
- Repository called with correct parameters

---

#### 50. SetState_ShouldReturnFalse_WhenExceptionThrown
**Priority:** High  
**Type:** Negative  

**Arrange:**
- Mock repository throws exception

**Act:** Call SetState(123, ChangeMpTypeProcessStates.Completed)

**Assert:**
- Result is false
- Exception caught and handled

---

#### 51. SetState_ShouldHandleAllStateValues
**Priority:** Medium  
**Type:** Verification  

**Arrange:**
- Test each enum value

**Act:** Call SetState with different states

**Assert:**
- Repository called with correct state

---

### CancelProcessAsync Method (3 tests)

#### 52. CancelProcessAsync_ShouldRemoveSessionAndUpdateState
**Priority:** High  
**Type:** Positive  

**Arrange:**
- Mock session
- Mock SetState returns true

**Act:** Call CancelProcessAsync(123)

**Assert:**
- Session.Remove called first
- SetState called with Cancelled state
- Returns true

---

#### 53. CancelProcessAsync_ShouldReturnFalse_WhenSetStateFails
**Priority:** High  
**Type:** Negative  

**Arrange:**
- SetState returns false (simulated failure)

**Act:** Call CancelProcessAsync(123)

**Assert:**
- Result is false
- Session still removed

---

#### 54. CancelProcessAsync_ShouldCallMethodsInOrder
**Priority:** Medium  
**Type:** Verification  

**Arrange:**
- Mock session and repository

**Act:** Call CancelProcessAsync(123)

**Assert:**
- RemoveReference called before SetState
- Verify call order

---

## Technical Implementation Notes

### Mocking Strategy

**IMapper Setup (Legacy):**
```csharp
private IMapper _mapper;

[SetUp]
public void SetUp()
{
    _mapper = Substitute.For<IMapper>();
    
    // Map ProcessState to ExecuteVM
    _mapper.Map<ExecuteVM>(Arg.Any<object>()).Returns(new ExecuteVM { /* ... */ });
    
    // Map to ProcessState for execution
    _mapper.Map<ProcessState>(Arg.Any<ExecuteVM>()).Returns(new ProcessState());
}
```

**Session Setup:**
```csharp
private IHttpContextAccessor _ctx;
private ISession _session;

[SetUp]
public void SetUp()
{
    _ctx = Substitute.For<IHttpContextAccessor>();
    _session = Substitute.For<ISession>();
    
    var httpContext = new DefaultHttpContext { Session = _session };
    _ctx.HttpContext.Returns(httpContext);
}
```

**Complex Repository Mocks:**
```csharp
// Retailer summary
_changeMpTypeSummaryRepository.GetRetailerAsync(Arg.Any<int?>())
    .Returns(new List<ChangeMpTypeSummaryRetailer> { /* test data */ });

// Meteringseries
_changeMpTypeSummaryRepository.GetMeteringseriesAsync(Arg.Any<int?>())
    .Returns(new List<ChangeMpTypeSummaryMeteringseries> { /* test data */ });

// Templates
_changeMpTypeTemplatesRepository.GetTemplatesAsync(
    Arg.Any<MpTypeId>(), 
    Arg.Any<ComponentTypeId>())
    .Returns(new List<MpTypeTemplate> { /* test data */ });

// Ptab reading types
_ptabRepository.GetReadingTypes()
    .Returns(new List<ReadingType> 
    { 
        new ReadingType { ReadingTypeNo = 5, ReadingTypeName = "Active Energy" } 
    });
```

### Test Data Builders

**ChangeMpTypeVM Builder:**
```csharp
private ChangeMpTypeVM CreateTestVM(ChangeMpTypeProcessType processType, DateTime changeDate)
{
    return new ChangeMpTypeVM
    {
        ProcessType = processType,
        State = ChangeMpTypeProcessStates.Inprogress,
        MeteringpointStep = new MeteringpointStepVM
        {
            MeteringpointNo = 12345,
            MeteringpointId = "MP-001"
        },
        MpTypeStep = new MpTypeStepVM
        {
            ChangeDate = changeDate,
            Meteringseries = new List<MeteringseriesTemplateVM>(),
            MeteringpointLimit = new List<MeteringpointLimitVM>()
        },
        SummaryStep = new SummaryStepVM()
    };
}
```

**Retailer Data Builder:**
```csharp
private ChangeMpTypeSummaryRetailer CreateRetailer(
    DirectionOfFlowNo direction, 
    DateTime todate, 
    string name = "Test Retailer")
{
    return new ChangeMpTypeSummaryRetailer
    {
        DirectionOfFlowNo = direction,
        Fromdate = DateTime.Now.Date.AddYears(-1),
        Todate = todate,
        RetailerName = name
    };
}
```

---

## Risk Assessment

### Critical Risk Areas
1. **Date Logic**: Complex filtering by Todate >= DateTime.Now.Date (time-dependent tests)
2. **Business Logic Complexity**: ShowRetailerSummary has deeply nested conditionals
3. **State Mutations**: Methods modify lists in-place
4. **AutoMapper Dependency**: Legacy mapping may hide bugs
5. **Null Reference Potential**: Multiple .First() calls without safety checks

### Medium Risk Areas
1. **JSON Serialization**: StepData encoding/decoding
2. **Enum Handling**: ProcessType switches
3. **Collection Manipulation**: Adding/modifying retailers, series, limits

### Mitigation Strategies
1. **Date Mocking**: Use test dates far from boundary conditions
2. **Comprehensive Coverage**: Test all process type combinations
3. **Edge Case Testing**: Empty lists, null values, missing data
4. **Verify State Changes**: Check list modifications don't affect other tests

---

## Code Coverage Goals

### Target Metrics
- **Line Coverage:** 95%+ (complex business logic may have some unreachable paths)
- **Branch Coverage:** 90%+ (many conditional branches)
- **Method Coverage:** 100%

### Coverage Breakdown
- `RemoveReference`: 2 tests
- `GetChangeMpTypeVMAsync`: 6 tests
- `GetMeteringpointLimitAsync`: 3 tests
- `GetTemplatesAsync`: 5 tests
- `ExecuteProcess`: 5 tests
- `ReProcessAsync`: 2 tests
- `ShowRetailerSummary`: 10 tests (most complex)
- `ShowMeteringseriesSummary`: 8 tests
- `ShowMeteringpointLimitSummary`: 7 tests
- `SetState`: 3 tests
- `CancelProcessAsync`: 3 tests

**Total: 54 tests**

---

## Test Execution Plan

### Phase 1: Simple Methods (1-2 hours)
- RemoveReference (2 tests)
- ReProcessAsync (2 tests)
- SetState (3 tests)
- CancelProcessAsync (3 tests)
- Run and verify: 10 tests

### Phase 2: Retrieval Methods (2-3 hours)
- GetChangeMpTypeVMAsync (6 tests)
- GetMeteringpointLimitAsync (3 tests)
- GetTemplatesAsync (5 tests)
- ExecuteProcess (5 tests)
- Run and verify: 19 tests

### Phase 3: Complex Business Logic - Retailers (2-3 hours)
- ShowRetailerSummary (10 tests)
- Extensive testing of all process types
- Run and verify: 10 tests

### Phase 4: Complex Business Logic - Series & Limits (2-3 hours)
- ShowMeteringseriesSummary (8 tests)
- ShowMeteringpointLimitSummary (7 tests)
- Run and verify: 15 tests

### Phase 5: Integration Validation (1 hour)
- Run all 54 tests together
- Verify no test interactions
- Check coverage metrics

---

## Dependencies and Setup Requirements

### Required NuGet Packages
- NUnit 3.14.0
- NSubstitute 5.1.0
- Newtonsoft.Json (for JSON operations)
- AutoFixture (optional, for test data generation)

### Required Using Statements
```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using NSubstitute;
using NUnit.Framework;
using Perigon.Modules.MeteringPoint.Domains.DataTransferObjects.ChangeMpType;
using Perigon.Modules.MeteringPoint.Domains.DataTransferObjects.Common;
using Perigon.Modules.MeteringPoint.Domains.Interfaces.ChangeMpType;
using Perigon.Modules.MeteringPoint.Domains.Interfaces.Common;
using Perigon.Modules.MeteringPoint.ViewModels.ChangeMpType;
using Perigon.Modules.MeteringPoint.ViewModels.ChangeMpType.Common;
using Perigon.Modules.MeteringPoint.Utils.Services.ChangeMpType;
```

---

## Recommended Improvements (Post-Testing)

1. **Reduce AutoMapper Usage**: Replace with explicit mapping methods
2. **Defensive Programming**: Add null checks before .First() calls
3. **Extract Business Logic**: Complex conditionals into named methods
4. **Date Abstraction**: Inject IDateTimeProvider for testability
5. **Validation**: Input validation for VM parameters
6. **Error Handling**: Try-catch blocks in complex methods
7. **Magic Dates**: Replace 2073-06-01 with named constant
8. **Session Abstraction**: Create ISessionService wrapper

---

## Success Criteria

- ✅ All 54 tests passing
- ✅ 95%+ code coverage
- ✅ All process types tested (prod, cons, comb)
- ✅ All direction of flow scenarios covered
- ✅ Date filtering logic verified
- ✅ Business logic for retailers/series/limits validated
- ✅ Clean test execution (< 10 seconds total)
- ✅ No test interdependencies

---

**Test Plan Version:** 1.0  
**Created:** December 17, 2025  
**Service Complexity:** Very High (389 lines, 10 methods, complex business logic)  
**Estimated Implementation Time:** 8-12 hours

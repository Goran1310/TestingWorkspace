# Test Plan: ConstructionPowerProcessService

## Executive Summary

This test plan covers comprehensive unit testing for the `ConstructionPowerProcessService` class, which manages construction power processes in the Perigon MeteringPoint module. The service handles process lifecycle, session management, data persistence, and complex business logic for construction power installations and uninstallations.

**Service Location**: `Perigon.Modules.MeteringPoint.Utils.Services.ConstructionPower.ConstructionPowerProcessService`

**Test Framework**: NUnit 3.14.0 + NSubstitute 5.1.0 (following Perigon standards)

**Current Status**: No existing unit tests found - Full test suite needs to be created

---

## Service Overview

### Dependencies (Constructor Injection)
1. **IMapper** - AutoMapper for DTO/ViewModel mapping (⚠️ REFACTORING TARGET - Hansen policy is to remove AutoMapper)
2. **IHttpContextAccessor** - Session management via HTTP context
3. **IConstructionPowerProcessRepository** - Process data persistence
4. **IConstructionPowerComponentRepository** - Component data access
5. **IConstructionPowerCustomerRepository** - Customer data access
6. **IConstructionPowerOverviewRepository** - Overview data access

### Key Responsibilities
- **Session Management**: Store/retrieve process IDs in HTTP session
- **Process Lifecycle**: Create, resume, execute, cancel processes
- **Data Enrichment**: Populate ViewModels with data from multiple repositories
- **State Management**: Update process states
- **Business Logic**: Handle conditional logic for install vs uninstall scenarios

---

## Test Scope

### In Scope
✅ All 15 public interface methods  
✅ Session management (SetProcess, GetWorkorderNo, RemoveReference)  
✅ Process CRUD operations  
✅ Data mapping and enrichment logic  
✅ Conditional business logic (install vs uninstall)  
✅ Error handling and edge cases  
✅ Null handling and validation  

### Out of Scope
❌ Repository implementations (mocked)  
❌ AutoMapper configuration (mocked)  
❌ HTTP session internals (mocked via ISession)  
❌ Database interactions  
❌ Integration tests with real dependencies  

---

## Test Strategy

### Testing Approach
- **Unit Tests**: Isolate service logic using NSubstitute mocks
- **AAA Pattern**: Arrange-Act-Assert structure for all tests
- **Coverage Target**: 100% code coverage
- **Mock Strategy**: Substitute all dependencies (repositories, mapper, session, HTTP context)

### Refactoring Considerations
⚠️ **AutoMapper Removal**: This service heavily uses AutoMapper (2 instances). Following the NewMeteringPointOverviewService pattern, future work should:
1. Replace `mapper.Map<ConstructionPowerVM>(process)` with manual mapping
2. Replace `mapper.Map<List<ConstructionPowerOverviewVM>>(overview)` with manual mapping
3. Remove IMapper dependency
4. Update tests to verify property mapping directly

---

## Test Scenarios by Method

### 1. Session Management Tests

#### **GetWorkorderNo()**
**Purpose**: Retrieve workorder number from session

| Test Case ID | Test Name | Scenario | Expected Result |
|--------------|-----------|----------|-----------------|
| TC-CP-Session-01 | GetWorkorderNo_ShouldReturnWorkorderId_WhenSessionContainsValue | Session has valid workorder ID | Returns stored ID |
| TC-CP-Session-02 | GetWorkorderNo_ShouldReturnDefault_WhenSessionIsEmpty | Session has no workorder ID | Returns 0 (default int) |
| TC-CP-Session-03 | GetWorkorderNo_ShouldReturnLatestValue_WhenCalledMultipleTimes | Multiple calls to same session | Returns same ID consistently |

#### **SetProcess(ProcessState process)**
**Purpose**: Store process in session and return it

| Test Case ID | Test Name | Scenario | Expected Result |
|--------------|-----------|----------|-----------------|
| TC-CP-Session-04 | SetProcess_ShouldStoreWorkorderId_WhenValidProcessProvided | Valid ProcessState with WorkorderId | Session contains WorkorderId |
| TC-CP-Session-05 | SetProcess_ShouldRemoveExistingReference_BeforeSettingNew | Setting new process after existing one | Old reference removed, new stored |
| TC-CP-Session-06 | SetProcess_ShouldReturnSameProcess_WhenCalled | Valid process provided | Returns input process unchanged |
| TC-CP-Session-07 | SetProcess_ShouldCallRemoveReference_BeforeSetting | Any valid process | RemoveReference called first |

#### **RemoveReference()**
**Purpose**: Clear session data

| Test Case ID | Test Name | Scenario | Expected Result |
|--------------|-----------|----------|-----------------|
| TC-CP-Session-08 | RemoveReference_ShouldRemoveSessionKey_WhenCalled | Session has data | Session.Remove called with correct key |
| TC-CP-Session-09 | RemoveReference_ShouldNotThrow_WhenSessionEmpty | Session already empty | No exception thrown |
| TC-CP-Session-10 | RemoveReference_ShouldClearWorkorderId_WhenCalled | After RemoveReference | GetWorkorderNo returns default |

---

### 2. Process Creation Tests

#### **NewProcessAsync()**
**Purpose**: Create new process with default state

| Test Case ID | Test Name | Scenario | Expected Result |
|--------------|-----------|----------|-----------------|
| TC-CP-Create-01 | NewProcessAsync_ShouldCreateProcess_WithNotSetType | No parameters | ProcessType = ConstructionPowerNot_Set |
| TC-CP-Create-02 | NewProcessAsync_ShouldCreateProcess_WithNewState | No parameters | State = New |
| TC-CP-Create-03 | NewProcessAsync_ShouldStoreInSession_AfterCreation | Process created | Session contains new WorkorderId |
| TC-CP-Create-04 | NewProcessAsync_ShouldReturnCreatedProcess_WhenSuccessful | Valid creation | Returns ProcessState from repository |
| TC-CP-Create-05 | NewProcessAsync_ShouldCallRepository_WithCorrectParameters | Method called | CreateProcessAsync called with correct DTO |

#### **InitNewWithProcessAsync(ConstructionPowerProcessType processType)**
**Purpose**: Create new process with specific type

| Test Case ID | Test Name | Scenario | Expected Result |
|--------------|-----------|----------|-----------------|
| TC-CP-Create-06 | InitNewWithProcessAsync_ShouldCreateProcess_WithProvidedType | ProcessType = Install | ProcessType set correctly |
| TC-CP-Create-07 | InitNewWithProcessAsync_ShouldCreateProcess_WithInprogressState | Any valid ProcessType | State = Inprogress |
| TC-CP-Create-08 | InitNewWithProcessAsync_ShouldStoreInSession_AfterCreation | Process created | Session contains WorkorderId |
| TC-CP-Create-09 | InitNewWithProcessAsync_ShouldReturnCreatedProcess_WhenSuccessful | Valid type provided | Returns ProcessState |
| TC-CP-Create-10 | InitNewWithProcessAsync_ShouldHandleUninstallType_Correctly | ProcessType = Uninstall | Creates with Uninstall type |

---

### 3. Process Retrieval Tests

#### **GetConstructionPowerVMAsync(int? workorderId)**
**Purpose**: Retrieve and enrich ConstructionPowerVM with process data

**Complex Method - Multiple Paths Based on ProcessType and Data State**

| Test Case ID | Test Name | Scenario | Expected Result |
|--------------|-----------|----------|-----------------|
| TC-CP-Get-01 | GetConstructionPowerVMAsync_ShouldReturnNull_WhenProcessNotFound | Invalid workorderId | Returns null |
| TC-CP-Get-02 | GetConstructionPowerVMAsync_ShouldReturnNull_WhenWorkorderIdIsNull | Process.WorkorderId = null | Returns null |
| TC-CP-Get-03 | GetConstructionPowerVMAsync_ShouldMapProcess_ToConstructionPowerVM | Valid process exists | Maps process to VM |
| TC-CP-Get-04 | GetConstructionPowerVMAsync_ShouldDeserializeStepData_WhenPresent | Process has StepData | ExecuteVM deserialized correctly |
| TC-CP-Get-05 | GetConstructionPowerVMAsync_ShouldCreateEmptyExecuteVM_WhenStepDataNull | StepData is null | Creates new ExecuteVM() |
| TC-CP-Get-06 | GetConstructionPowerVMAsync_ShouldPopulateAllSteps_FromExecuteVM | Valid ExecuteVM data | All steps populated (Address, Component, etc.) |
| TC-CP-Get-07 | GetConstructionPowerVMAsync_ShouldSetStateAndProcessType_FromProcess | Process has state/type | State and ProcessType copied |

**Uninstall-Specific Address Enrichment**:
| TC-CP-Get-08 | GetConstructionPowerVMAsync_ShouldEnrichAddressStep_WhenUninstallAndPostCodeNull | Uninstall + MeteringpointNo + PostCode=null | Address populated from Meteringpoint |
| TC-CP-Get-09 | GetConstructionPowerVMAsync_ShouldNotEnrichAddress_WhenPostCodeAlreadySet | Uninstall + PostCode exists | Address not overwritten |
| TC-CP-Get-10 | GetConstructionPowerVMAsync_ShouldNotEnrichAddress_WhenNotUninstall | Install type | Address enrichment skipped |
| TC-CP-Get-11 | GetConstructionPowerVMAsync_ShouldNotEnrichAddress_WhenNoMeteringpointNo | Uninstall but MeteringpointNo null | Address enrichment skipped |

**Uninstall-Specific Customer Enrichment**:
| TC-CP-Get-12 | GetConstructionPowerVMAsync_ShouldEnrichCustomer_WhenUninstallAndCustomerNoNull | Uninstall + MeteringpointNo + CustomerNo=null | Customer fetched and populated |
| TC-CP-Get-13 | GetConstructionPowerVMAsync_ShouldNotEnrichCustomer_WhenCustomerNoExists | Uninstall + CustomerNo set | Customer not overwritten |
| TC-CP-Get-14 | GetConstructionPowerVMAsync_ShouldCallGetCustomerFromActiveContract_WhenEnriching | Valid conditions for enrichment | Repository method called |
| TC-CP-Get-15 | GetConstructionPowerVMAsync_ShouldCallGetCustomerByCustomerNo_AfterGettingNo | CustomerNo retrieved | GetCustomerByCustomerNo called |
| TC-CP-Get-16 | GetConstructionPowerVMAsync_ShouldPopulateAllCustomerFields_WhenEnriching | Customer data returned | All fields copied (FirstName, LastName, etc.) |

**Uninstall-Specific Trafo Enrichment**:
| TC-CP-Get-17 | GetConstructionPowerVMAsync_ShouldEnrichTrafo_WhenUninstallAndTrafoIdNull | Uninstall + MeteringpointNo + TrafoId=null | Trafo fetched and populated |
| TC-CP-Get-18 | GetConstructionPowerVMAsync_ShouldNotEnrichTrafo_WhenTrafoIdExists | Uninstall + TrafoId set | Trafo not overwritten |
| TC-CP-Get-19 | GetConstructionPowerVMAsync_ShouldHandleNullTrafo_WhenNotFound | Repository returns null trafo | No exception, TrafoNo remains null |
| TC-CP-Get-20 | GetConstructionPowerVMAsync_ShouldPopulateTrafoFields_WhenTrafoFound | Valid trafo returned | TrafoNo, TrafoId, TrafoName populated |

**Integration Scenarios**:
| TC-CP-Get-21 | GetConstructionPowerVMAsync_ShouldEnrichAll_WhenUninstallAndAllNull | Uninstall + all enrichments needed | Address, Customer, Trafo all populated |
| TC-CP-Get-22 | GetConstructionPowerVMAsync_ShouldNotEnrich_WhenInstallProcess | Install type + all null | No enrichment occurs |
| TC-CP-Get-23 | GetConstructionPowerVMAsync_ShouldPreserveExistingData_WhenPartiallyPopulated | Some fields already set | Only null fields enriched |

#### **ResumeProcessAsync(int? workorderId)**
**Purpose**: Resume existing process from workorderId

| Test Case ID | Test Name | Scenario | Expected Result |
|--------------|-----------|----------|-----------------|
| TC-CP-Resume-01 | ResumeProcessAsync_ShouldRemoveReference_BeforeResuming | Any workorderId | RemoveReference called first |
| TC-CP-Resume-02 | ResumeProcessAsync_ShouldReturnNull_WhenProcessNotFound | Invalid workorderId | Returns null |
| TC-CP-Resume-03 | ResumeProcessAsync_ShouldReturnNull_WhenWorkorderIdIsNull | Process.WorkorderId = null | Returns null |
| TC-CP-Resume-04 | ResumeProcessAsync_ShouldSetProcess_WhenFound | Valid process exists | SetProcess called |
| TC-CP-Resume-05 | ResumeProcessAsync_ShouldReturnProcess_WhenSuccessful | Valid process | Returns ProcessState |
| TC-CP-Resume-06 | ResumeProcessAsync_ShouldStoreInSession_AfterResuming | Process resumed | Session contains WorkorderId |

#### **GetProcessType(int? workorderId)**
**Purpose**: Get process type from repository

| Test Case ID | Test Name | Scenario | Expected Result |
|--------------|-----------|----------|-----------------|
| TC-CP-GetType-01 | GetProcessType_ShouldReturnProcessType_WhenWorkorderIdValid | Valid workorderId | Returns ProcessType from repo |
| TC-CP-GetType-02 | GetProcessType_ShouldCallRepository_WithWorkorderId | Any workorderId | GetProcessTypeAsync called |
| TC-CP-GetType-03 | GetProcessType_ShouldHandleNullWorkorderId_Gracefully | workorderId = null | Passes null to repository |

#### **GetMeteringpointNo(int wo)**
**Purpose**: Get metering point number for workorder

| Test Case ID | Test Name | Scenario | Expected Result |
|--------------|-----------|----------|-----------------|
| TC-CP-GetMP-01 | GetMeteringpointNo_ShouldReturnMeteringpointNo_WhenExists | Valid workorder | Returns MeteringpointNo |
| TC-CP-GetMP-02 | GetMeteringpointNo_ShouldReturnNull_WhenNotFound | Invalid workorder | Returns null |
| TC-CP-GetMP-03 | GetMeteringpointNo_ShouldCallRepository_WithWorkorderId | Any workorder | GetMeteringpointAsync called |

---

### 4. Process State Management Tests

#### **SetState(int? workorderId, ConstructionPowerProcessStates state)**
**Purpose**: Update process state with error handling

| Test Case ID | Test Name | Scenario | Expected Result |
|--------------|-----------|----------|-----------------|
| TC-CP-State-01 | SetState_ShouldReturnTrue_WhenUpdateSuccessful | Valid workorderId and state | Returns true |
| TC-CP-State-02 | SetState_ShouldReturnFalse_WhenUpdateFails | Repository throws exception | Returns false |
| TC-CP-State-03 | SetState_ShouldCallRepository_WithCorrectParameters | Valid parameters | UpdateStateAsync called with workorderId and state |
| TC-CP-State-04 | SetState_ShouldHandleNullWorkorderId_GracefullyInTryCatch | workorderId = null | Returns false if exception thrown |
| TC-CP-State-05 | SetState_ShouldHandleAllStateValues_Correctly | All enum values | Updates for New, Inprogress, Done, Cancelled |
| TC-CP-State-06 | SetState_ShouldCatchException_AndNotRethrow | Repository throws any exception | Exception caught, returns false |

---

### 5. Process Execution Tests

#### **ExecuteProcess(ConstructionPowerVM powerVM)**
**Purpose**: Execute process with all step data

| Test Case ID | Test Name | Scenario | Expected Result |
|--------------|-----------|----------|-----------------|
| TC-CP-Execute-01 | ExecuteProcess_ShouldCreateExecuteVM_WithAllSteps | Valid ConstructionPowerVM | ExecuteVM contains all steps |
| TC-CP-Execute-02 | ExecuteProcess_ShouldSerializeStepData_ToBytes | Valid data | StepData serialized to UTF8 JSON bytes |
| TC-CP-Execute-03 | ExecuteProcess_ShouldCreateProcessStateRequest_WithCorrectData | Valid powerVM | ProcessState has all required fields |
| TC-CP-Execute-04 | ExecuteProcess_ShouldSetWorkorderIdToNull_InRequest | Any powerVM | request.WorkorderId = null |
| TC-CP-Execute-05 | ExecuteProcess_ShouldCopyProcessTypeAndState_FromPowerVM | powerVM with type/state | Copied to ProcessState request |
| TC-CP-Execute-06 | ExecuteProcess_ShouldCallRepository_ExecuteProcess | Valid request | Repository.ExecuteProcess called |
| TC-CP-Execute-07 | ExecuteProcess_ShouldReturnWorkorderId_FromRepository | Repository returns ID | Returns workorderId |
| TC-CP-Execute-08 | ExecuteProcess_ShouldHandleAllStepTypes_Correctly | All steps populated | All steps in ExecuteVM |

#### **ReProcessAsync(int workorderId)**
**Purpose**: Trigger reprocessing

| Test Case ID | Test Name | Scenario | Expected Result |
|--------------|-----------|----------|-----------------|
| TC-CP-Reprocess-01 | ReProcessAsync_ShouldCallRepository_WithWorkorderId | Valid workorderId | ReProcess called on repository |
| TC-CP-Reprocess-02 | ReProcessAsync_ShouldComplete_WithoutException | Valid workorderId | Task completes successfully |

---

### 6. Component Mapping Tests

#### **MapComponentStepWithVMAsync(ConstructionPowerVM vm)**
**Purpose**: Enrich ComponentStep with Meteringseries and MeteringpointLimit

**Complex Method - Multiple Conditional Paths**

**Meteringseries Enrichment**:
| Test Case ID | Test Name | Scenario | Expected Result |
|--------------|-----------|----------|-----------------|
| TC-CP-MapComp-01 | MapComponentStepWithVMAsync_ShouldNotEnrich_WhenMeteringsSeriesExists | vm.ComponentStep.Meteringseries != null | Meteringseries not modified |
| TC-CP-MapComp-02 | MapComponentStepWithVMAsync_ShouldFetchMeteringseries_WhenNullAndMeteringpointNoExists | Meteringseries=null + MeteringpointNo has value | Repository.GetMeteringserie called |
| TC-CP-MapComp-03 | MapComponentStepWithVMAsync_ShouldPopulateMeteringseries_WhenFound | Repository returns Meteringseries | All fields mapped correctly |
| TC-CP-MapComp-04 | MapComponentStepWithVMAsync_ShouldIncrementChannelNo_WhenMapping | ms.ChannelNo = 5 | vm.ChannelNo = 6 |
| TC-CP-MapComp-05 | MapComponentStepWithVMAsync_ShouldSetBalancesettlementTrue_Always | Any meteringseries | Balancesettlement = true |
| TC-CP-MapComp-06 | MapComponentStepWithVMAsync_ShouldMapEndReaderAsReaderNo_WhenFound | ms.EndReaderNo = 10 | vm.ReaderNo = 10 |
| TC-CP-MapComp-07 | MapComponentStepWithVMAsync_ShouldUseDefaultMeteringseries_WhenNotFound | Repository returns null + MeteringpointNo exists | Default values set |
| TC-CP-MapComp-08 | MapComponentStepWithVMAsync_ShouldUseDefaultMeteringseries_WhenNoMeteringpointNo | MeteringpointNo is null | Default values set |

**Default Meteringseries Values** (when not found or no MeteringpointNo):
| TC-CP-MapComp-09 | MapComponentStepWithVMAsync_ShouldSetDefaultReadingTypeNo_To2 | Default scenario | ReadingTypeNo = 2 |
| TC-CP-MapComp-10 | MapComponentStepWithVMAsync_ShouldSetDefaultConstant_To1 | Default scenario | Constant = 1 |
| TC-CP-MapComp-11 | MapComponentStepWithVMAsync_ShouldSetDefaultChannelNo_To1 | Default scenario | ChannelNo = 1 |
| TC-CP-MapComp-12 | MapComponentStepWithVMAsync_ShouldSetDefaultDigits_To8 | Default scenario | Digits = 8 |
| TC-CP-MapComp-13 | MapComponentStepWithVMAsync_ShouldSetDefaultDecimals_To3 | Default scenario | Decimals = 3 |
| TC-CP-MapComp-14 | MapComponentStepWithVMAsync_ShouldSetDefaultReaderNo_To2 | Default scenario | ReaderNo = 2 |
| TC-CP-MapComp-15 | MapComponentStepWithVMAsync_ShouldSetDefaultDirectionOfFlow_ToOut | Default scenario | DirectionofflowNo = Out |
| TC-CP-MapComp-16 | MapComponentStepWithVMAsync_ShouldSetDefaultReading_To0 | Default scenario | Reading = 0 |
| TC-CP-MapComp-17 | MapComponentStepWithVMAsync_ShouldSetDefaultMeterNo_ToNull | Default scenario | Meterno = null |

**MeteringpointLimit Enrichment**:
| TC-CP-MapComp-18 | MapComponentStepWithVMAsync_ShouldNotEnrichLimit_WhenExists | vm.ComponentStep.MeteringpointLimit != null | Limit not modified |
| TC-CP-MapComp-19 | MapComponentStepWithVMAsync_ShouldFetchLimit_WhenNullAndMeteringpointNoExists | Limit=null + MeteringpointNo has value | Repository.GetMeteringpointLimit called |
| TC-CP-MapComp-20 | MapComponentStepWithVMAsync_ShouldPopulateLimit_WhenFound | Repository returns limit | All fields mapped correctly |
| TC-CP-MapComp-21 | MapComponentStepWithVMAsync_ShouldUseDefaultLimit_WhenNotFound | Repository returns null + MeteringpointNo exists | Default values set |
| TC-CP-MapComp-22 | MapComponentStepWithVMAsync_ShouldUseDefaultLimit_WhenNoMeteringpointNo | MeteringpointNo is null | Default values set |

**Default MeteringpointLimit Values**:
| TC-CP-MapComp-23 | MapComponentStepWithVMAsync_ShouldSetDefaultLimitTypeNo_ToMaxPower | Default scenario | LimitTypeNo = Max_Power |
| TC-CP-MapComp-24 | MapComponentStepWithVMAsync_ShouldSetDefaultDirectionOfFlowNo_ToOut | Default scenario | DirectionofflowNo = Out |
| TC-CP-MapComp-25 | MapComponentStepWithVMAsync_ShouldSetDefaultQuantity_To0 | Default scenario | Quantity = 0 |

**Step State Update**:
| TC-CP-MapComp-26 | MapComponentStepWithVMAsync_ShouldSetCurrentStep_ToComponentStep | Any scenario | vm.Step.CurrentStep = ComponentStep |
| TC-CP-MapComp-27 | MapComponentStepWithVMAsync_ShouldReturnSameVM_WithEnrichments | Any scenario | Returns enriched vm |

**Integration Scenarios**:
| TC-CP-MapComp-28 | MapComponentStepWithVMAsync_ShouldEnrichBoth_WhenBothNull | Meteringseries=null + Limit=null + MeteringpointNo exists | Both fetched and populated |
| TC-CP-MapComp-29 | MapComponentStepWithVMAsync_ShouldUseDefaultsForBoth_WhenBothNotFoundAndHasMPNo | Both return null from repo + MeteringpointNo exists | Both use defaults |
| TC-CP-MapComp-30 | MapComponentStepWithVMAsync_ShouldUseDefaultsForBoth_WhenNoMeteringpointNo | MeteringpointNo = null | Both use defaults |

---

### 7. Overview Tests

#### **GetConstructionPowerOverviewAsync()**
**Purpose**: Get list of construction power processes

| Test Case ID | Test Name | Scenario | Expected Result |
|--------------|-----------|----------|-----------------|
| TC-CP-Overview-01 | GetConstructionPowerOverviewAsync_ShouldCallRepository_GetOverview | Method called | Repository.GetConstructionPowerOverviewAsync called |
| TC-CP-Overview-02 | GetConstructionPowerOverviewAsync_ShouldMapToVM_UsingMapper | Repository returns data | mapper.Map called with overview |
| TC-CP-Overview-03 | GetConstructionPowerOverviewAsync_ShouldReturnMappedList_WhenSuccessful | Valid data | Returns List<ConstructionPowerOverviewVM> |
| TC-CP-Overview-04 | GetConstructionPowerOverviewAsync_ShouldHandleEmptyList_Correctly | Repository returns empty list | Returns empty List<ConstructionPowerOverviewVM> |

---

### 8. Process Cancellation Tests

#### **CancelProcessAsync(int workorderId)**
**Purpose**: Cancel process and update state

| Test Case ID | Test Name | Scenario | Expected Result |
|--------------|-----------|----------|-----------------|
| TC-CP-Cancel-01 | CancelProcessAsync_ShouldRemoveReference_BeforeCancelling | Any workorderId | RemoveReference called |
| TC-CP-Cancel-02 | CancelProcessAsync_ShouldCallSetState_WithCancelledState | Valid workorderId | SetState called with Cancelled |
| TC-CP-Cancel-03 | CancelProcessAsync_ShouldReturnTrue_WhenStateUpdateSucceeds | SetState returns true | Returns true |
| TC-CP-Cancel-04 | CancelProcessAsync_ShouldReturnFalse_WhenStateUpdateFails | SetState returns false | Returns false |
| TC-CP-Cancel-05 | CancelProcessAsync_ShouldClearSession_EvenIfStateUpdateFails | SetState fails | RemoveReference still called |

---

## Risk Assessment

### High Priority Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **AutoMapper Dependency** | High - Runtime mapping errors, license concerns | Plan refactoring to manual mapping (like NewMeteringPointOverviewService) |
| **Session State Management** | High - Session failures cause process loss | Extensive session mock testing, null handling tests |
| **Complex Conditional Logic** | High - GetConstructionPowerVMAsync has many paths | Comprehensive path coverage, integration scenarios |
| **Null Reference Exceptions** | Medium - Multiple nullable properties | Null handling tests for all scenarios |
| **Repository Exception Handling** | Medium - Only SetState has try-catch | Test exception propagation, add error handling tests |
| **JSON Serialization Errors** | Medium - StepData serialization could fail | Test with invalid data, malformed JSON |

### Testing Challenges

1. **Session Mocking Complexity**: Requires careful setup of IHttpContextAccessor → HttpContext → Session chain
2. **Multiple Repository Mocks**: 4 repositories need coordinated mock setups
3. **Nested Object Initialization**: ConstructionPowerVM has 5+ nested step objects
4. **Conditional Enrichment Logic**: GetConstructionPowerVMAsync has 3 separate enrichment paths
5. **Byte Array Serialization**: StepData requires JSON serialization testing

---

## Test Implementation Strategy

### Phase 1: Foundation (Priority: Critical)
**Estimated: 20 tests, 2-3 hours**

1. ✅ Create test file structure with proper dependencies
2. ✅ Implement session mocking infrastructure (reuse patterns from previous work)
3. ✅ Test basic session operations (SetProcess, GetWorkorderNo, RemoveReference)
4. ✅ Test simple process creation (NewProcessAsync, InitNewWithProcessAsync)

### Phase 2: Core Functionality (Priority: High)
**Estimated: 40 tests, 4-6 hours**

1. ✅ Test ResumeProcessAsync (simpler retrieval path)
2. ✅ Test GetProcessType, GetMeteringpointNo (simple repository calls)
3. ✅ Test SetState (with exception handling)
4. ✅ Test ExecuteProcess (serialization logic)
5. ✅ Test ReProcessAsync, CancelProcessAsync

### Phase 3: Complex Enrichment Logic (Priority: High)
**Estimated: 45 tests, 6-8 hours**

1. ✅ Test GetConstructionPowerVMAsync base mapping
2. ✅ Test Uninstall Address enrichment (11 test cases)
3. ✅ Test Uninstall Customer enrichment (9 test cases)
4. ✅ Test Uninstall Trafo enrichment (7 test cases)
5. ✅ Integration scenarios for GetConstructionPowerVMAsync

### Phase 4: Component Mapping (Priority: Medium)
**Estimated: 30 tests, 4-5 hours**

1. ✅ Test MapComponentStepWithVMAsync Meteringseries enrichment (17 test cases)
2. ✅ Test MapComponentStepWithVMAsync MeteringpointLimit enrichment (8 test cases)
3. ✅ Integration scenarios for MapComponentStepWithVMAsync
4. ✅ Test default value scenarios

### Phase 5: Overview & Cleanup (Priority: Low)
**Estimated: 10 tests, 1-2 hours**

1. ✅ Test GetConstructionPowerOverviewAsync
2. ✅ Code coverage verification (target: 100%)
3. ✅ Refactor tests for maintainability
4. ✅ Document complex test scenarios

**Total Estimated Tests**: ~145 tests  
**Total Estimated Time**: 17-24 hours

---

## Test File Structure

```csharp
namespace Perigon.Modules.MeteringPoint.UnitTests.Utils.Services.ConstructionPower;

[TestFixture]
[TestOf(typeof(ConstructionPowerProcessService))]
public class ConstructionPowerProcessServiceTests
{
    // Dependencies (substitutes)
    private IMapper _mapper;
    private IHttpContextAccessor _httpContextAccessor;
    private ISession _session;
    private IConstructionPowerProcessRepository _processRepository;
    private IConstructionPowerComponentRepository _componentRepository;
    private IConstructionPowerCustomerRepository _customerRepository;
    private IConstructionPowerOverviewRepository _overviewRepository;
    
    private ConstructionPowerProcessService _service;

    [SetUp]
    public void SetUp()
    {
        // Initialize all substitutes
        // Setup HttpContext -> Session chain
        // Create service instance
    }

    #region Session Management Tests (Region 1)
    // TC-CP-Session-01 through TC-CP-Session-10
    #endregion

    #region Process Creation Tests (Region 2)
    // TC-CP-Create-01 through TC-CP-Create-10
    #endregion

    #region Process Retrieval - Basic Tests (Region 3)
    // TC-CP-Resume-01 through TC-CP-GetMP-03
    #endregion

    #region GetConstructionPowerVMAsync - Base Mapping (Region 4)
    // TC-CP-Get-01 through TC-CP-Get-07
    #endregion

    #region GetConstructionPowerVMAsync - Uninstall Address Enrichment (Region 5)
    // TC-CP-Get-08 through TC-CP-Get-11
    #endregion

    #region GetConstructionPowerVMAsync - Uninstall Customer Enrichment (Region 6)
    // TC-CP-Get-12 through TC-CP-Get-16
    #endregion

    #region GetConstructionPowerVMAsync - Uninstall Trafo Enrichment (Region 7)
    // TC-CP-Get-17 through TC-CP-Get-20
    #endregion

    #region GetConstructionPowerVMAsync - Integration Scenarios (Region 8)
    // TC-CP-Get-21 through TC-CP-Get-23
    #endregion

    #region Process State Management Tests (Region 9)
    // TC-CP-State-01 through TC-CP-State-06
    #endregion

    #region Process Execution Tests (Region 10)
    // TC-CP-Execute-01 through TC-CP-Reprocess-02
    #endregion

    #region MapComponentStepWithVMAsync - Meteringseries Tests (Region 11)
    // TC-CP-MapComp-01 through TC-CP-MapComp-17
    #endregion

    #region MapComponentStepWithVMAsync - MeteringpointLimit Tests (Region 12)
    // TC-CP-MapComp-18 through TC-CP-MapComp-25
    #endregion

    #region MapComponentStepWithVMAsync - Integration Tests (Region 13)
    // TC-CP-MapComp-26 through TC-CP-MapComp-30
    #endregion

    #region Overview Tests (Region 14)
    // TC-CP-Overview-01 through TC-CP-Overview-04
    #endregion

    #region Process Cancellation Tests (Region 15)
    // TC-CP-Cancel-01 through TC-CP-Cancel-05
    #endregion
}
```

---

## Resources Needed

### Development Environment
- ✅ .NET 8.0 SDK
- ✅ NUnit 3.14.0
- ✅ NSubstitute 5.1.0
- ✅ Visual Studio 2022 or VS Code

### Test Data
- Sample ProcessState DTOs with various states
- Sample ConstructionPowerVM objects with all step types
- Sample Customer, Trafo, Meteringseries, MeteringpointLimit DTOs
- JSON serialized ExecuteVM data for StepData testing

### Documentation References
- ConstructionPowerProcessStates enum definition
- ConstructionPowerProcessType enum definition
- All ViewModel class structures (MeteringpointStepVM, ComponentStepVM, etc.)
- Repository interface contracts

---

## Acceptance Criteria

### Test Quality
✅ All tests follow AAA pattern  
✅ All tests are independent and can run in any order  
✅ All tests use NSubstitute for mocking  
✅ Test names follow Perigon naming convention: `MethodName_ShouldExpectedBehavior_WhenCondition`  
✅ Each test has clear Arrange, Act, Assert sections  
✅ Complex setups use helper methods  

### Coverage
✅ 100% code coverage for ConstructionPowerProcessService  
✅ All 15 public methods have comprehensive tests  
✅ All conditional branches tested (if/else, null checks)  
✅ All exception handling paths tested  
✅ Edge cases and boundary conditions covered  

### Maintainability
✅ Tests grouped by functionality using regions  
✅ Test data builders for complex objects  
✅ Reusable mock setup methods  
✅ Clear documentation for complex scenarios  

---

## Future Refactoring Plan

### AutoMapper Removal (Post-Initial Testing)

Following the NewMeteringPointOverviewService refactoring pattern:

**Step 1: Identify Mapping Points**
- `mapper.Map<ConstructionPowerVM>(process)` in GetConstructionPowerVMAsync (line ~78)
- `mapper.Map<List<ConstructionPowerOverviewVM>>(overview)` in GetConstructionPowerOverviewAsync (line ~313)

**Step 2: Create Manual Mapping Methods**
```csharp
private static ConstructionPowerVM MapToConstructionPowerVM(ProcessState process)
{
    // Manual property mapping with explicit null handling
}

private static List<ConstructionPowerOverviewVM> MapToOverviewVMs(List<ConstructionPowerOverview> overview)
{
    return overview.Select(o => new ConstructionPowerOverviewVM
    {
        // Explicit property mapping
    }).ToList();
}
```

**Step 3: Update Tests**
- Remove IMapper substitute
- Update assertions to verify property mapping directly
- Add tests for manual mapping methods
- Verify 100% coverage maintained

**Estimated Effort**: 4-6 hours (service refactoring + test updates)

---

## Success Metrics

| Metric | Target | Current Status |
|--------|--------|----------------|
| **Code Coverage** | 100% | 0% (no tests exist) |
| **Test Count** | ~145 tests | 0 |
| **Build Success** | Green build | N/A |
| **Test Execution Time** | < 5 seconds | N/A |
| **Failed Tests** | 0 | N/A |
| **Code Quality** | No critical issues | Unknown |

---

## Appendix

### Session Mocking Pattern (Reference)
```csharp
// Reusable pattern from previous work
[SetUp]
public void SetUp()
{
    _mapper = Substitute.For<IMapper>();
    _session = Substitute.For<ISession>();
    
    var httpContext = new DefaultHttpContext();
    httpContext.Session = _session;
    
    _httpContextAccessor = Substitute.For<IHttpContextAccessor>();
    _httpContextAccessor.HttpContext.Returns(httpContext);
    
    _processRepository = Substitute.For<IConstructionPowerProcessRepository>();
    _componentRepository = Substitute.For<IConstructionPowerComponentRepository>();
    _customerRepository = Substitute.For<IConstructionPowerCustomerRepository>();
    _overviewRepository = Substitute.For<IConstructionPowerOverviewRepository>();
    
    _service = new ConstructionPowerProcessService(
        _mapper,
        _httpContextAccessor,
        _processRepository,
        _componentRepository,
        _customerRepository,
        _overviewRepository);
}

// Helper: Setup session to return workorder ID
private void SetupSessionWorkorderId(int workorderId)
{
    var json = JsonConvert.SerializeObject(workorderId);
    var bytes = Encoding.UTF8.GetBytes(json);
    
    _session.TryGetValue("constructionpower-process-id", out Arg.Any<byte[]>())
        .Returns(x =>
        {
            x[1] = bytes;
            return true;
        });
}
```

### Common Test Patterns

**Testing Null Returns**:
```csharp
[Test]
public async Task GetConstructionPowerVMAsync_ShouldReturnNull_WhenProcessNotFound()
{
    // Arrange
    _processRepository.GetProcessAsync(999).Returns(Task.FromResult<ProcessState>(null));
    
    // Act
    var result = await _service.GetConstructionPowerVMAsync(999);
    
    // Assert
    Assert.That(result, Is.Null);
}
```

**Testing Exception Handling**:
```csharp
[Test]
public async Task SetState_ShouldReturnFalse_WhenUpdateFails()
{
    // Arrange
    _processRepository.UpdateStateAsync(Arg.Any<int?>(), Arg.Any<ConstructionPowerProcessStates>())
        .Returns(Task.FromException(new InvalidOperationException("Update failed")));
    
    // Act
    var result = await _service.SetState(1, ConstructionPowerProcessStates.Done);
    
    // Assert
    Assert.That(result, Is.False);
}
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-13 | AI Test Planner | Initial test plan creation |

---

**Document Status**: ✅ Ready for Implementation  
**Next Steps**: Begin Phase 1 test implementation following this plan

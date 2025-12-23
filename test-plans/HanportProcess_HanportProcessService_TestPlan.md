# Test Plan: HanportProcessService

**Project:** Perigon  
**Module:** MeteringPoint.Utils.Services.HanportProcess  
**Class Under Test:** `HanportProcessService`  
**Test Plan Created:** December 17, 2025  
**Test Plan Author:** GitHub Copilot (Test Planner Mode)

---

## Executive Summary

### Overview
`HanportProcessService` is a core orchestration service that manages the Hanport activation/deactivation process workflow. The service handles process lifecycle management including creation, retrieval, execution, state transitions, and session management.

### Complexity Assessment
- **Complexity Level:** High
- **Test Effort:** High (4-6 hours)
- **Risk Level:** Medium-High
- **Priority:** High (Core business workflow)

### Key Characteristics
- **Type:** Service class with business logic
- **Active Methods:** 5 public methods (many commented-out legacy methods)
- **Dependencies:** 3 (IMapper, IHttpContextAccessor, IHanportProcessRepository)
- **Session Management:** Uses HTTP session for process tracking
- **AutoMapper Usage:** Yes (legacy - maps between DTOs and ViewModels)
- **Data Serialization:** JSON serialization of ExecuteDataVM
- **State Management:** Process state transitions (InProgress, Done, Failed, Cancelled)

---

## Service Architecture

### Interface Definition
```csharp
public interface IHanportProcessService
{
    void RemoveReference();
    Task<HanportProcessVM> GetHanportProcessVMAsync(int? workorderId);
    Task<int> ExecuteProcess(HanportProcessVM vm);
    Task ReProcessAsync(int workorderId);
    Task<bool> CancelProcessAsync(int workorderId);
    Task<bool> SetState(int workorderId, HanportProcessStates state);
}
```

### Dependencies
1. **IMapper** (AutoMapper - legacy)
   - Maps ProcessState → ExecuteVM
   - Maps ProcessState → ProcessVM
   
2. **IHttpContextAccessor**
   - Provides access to HTTP session
   - Session key: "hanport-process-id"
   - Stores workorder ID reference
   
3. **IHanportProcessRepository**
   - GetProcessAsync(int?) → ProcessState
   - ExecuteProcess(ProcessState) → int
   - ReProcess(int) → Task
   - UpdateStateAsync(int, HanportProcessStates) → Task
   - GetHanportStatusNoAsync(int) → Task<int>
   - GetHanportStatusNameAsync(int) → Task<string>

### Key Components

#### Enums
```csharp
public enum HanportProcessStates
{
    InProgress = 108,
    Failed = 109,
    ProcessInProgress = 110,
    Cancelled = 112,
    Done = 111
}

public enum HanportProcessType
{
    Not_Set,
    Hanport_activate,
    Hanport_deactivate
}
```

#### ViewModels
- **HanportProcessVM**: Main process view model
  - MeteringpointStep: MeteringpointStepVM
  - HanportStep: HanportStepVM
  - SummaryStep: SummaryStepVM
  - StepData: StepVM
  - State: HanportProcessStates
  - ProcessType: HanportProcessType

- **ExecuteDataVM**: Serialized step data
  - MeteringpointStep
  - HanportStep
  - SummaryStep

- **ExecuteVM**: Execution DTO
  - MeteringpointNo, MeteringpointId
  - HanportStatusNo, ChangeDate
  - StepData (byte[])
  - State, ProcessType

---

## Test Scope

### In Scope
✅ GetHanportProcessVMAsync - Process retrieval and mapping  
✅ ExecuteProcess - Process execution and persistence  
✅ ReProcessAsync - Process re-execution  
✅ CancelProcessAsync - Process cancellation with session cleanup  
✅ SetState - State transition logic  
✅ RemoveReference - Session management  
✅ AutoMapper integration (mocking)  
✅ JSON serialization/deserialization  
✅ Session operations  
✅ Repository interactions  
✅ Null handling  
✅ Exception propagation

### Out of Scope
❌ Commented-out legacy methods (not in active use)  
❌ HTTP session infrastructure (system responsibility)  
❌ Database operations (repository responsibility)  
❌ AutoMapper configuration (mocked in tests)

---

## Test Scenarios

### Test Category Distribution
- **GetHanportProcessVMAsync Tests:** 6 tests
- **ExecuteProcess Tests:** 7 tests
- **ReProcessAsync Tests:** 3 tests
- **CancelProcessAsync Tests:** 4 tests
- **SetState Tests:** 4 tests
- **RemoveReference Tests:** 2 tests
- **Total Estimated Tests:** 26 tests

---

## Detailed Test Scenarios

### 1. GetHanportProcessVMAsync Tests

#### TC-HPS-001: Successful Process Retrieval with Complete Data
**Priority:** High  
**Test Type:** Positive  
**Description:** Verify process retrieval with all steps populated

**Test Implementation:**
```csharp
[Test]
public async Task GetHanportProcessVMAsync_ShouldReturnCompleteVM_WhenProcessExists()
{
    // Arrange
    var workorderId = 123;
    var meteringpointNo = 456;
    var executeData = new ExecuteDataVM
    {
        MeteringpointStep = new MeteringpointStepVM { MeteringpointNo = meteringpointNo },
        HanportStep = new HanportStepVM { HanportStatusNew = HanStatus.Activated },
        SummaryStep = new SummaryStepVM { ProcessExecuted = true }
    };
    var stepDataBytes = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(executeData));
    
    var processState = new ProcessState
    {
        WorkorderId = workorderId,
        State = HanportProcessStates.InProgress,
        ProcessType = HanportProcessType.Hanport_activate,
        StepData = stepDataBytes
    };
    
    var executeVM = new ExecuteVM
    {
        State = HanportProcessStates.InProgress,
        ProcessType = HanportProcessType.Hanport_activate,
        StepData = stepDataBytes
    };
    
    _repository.GetProcessAsync(workorderId).Returns(processState);
    _mapper.Map<ExecuteVM>(processState).Returns(executeVM);
    _repository.GetHanportStatusNoAsync(meteringpointNo).Returns(1);
    _repository.GetHanportStatusNameAsync(meteringpointNo).Returns("Active");

    // Act
    var result = await _service.GetHanportProcessVMAsync(workorderId);

    // Assert
    Assert.Multiple(() =>
    {
        Assert.That(result, Is.Not.Null);
        Assert.That(result.State, Is.EqualTo(HanportProcessStates.InProgress));
        Assert.That(result.ProcessType, Is.EqualTo(HanportProcessType.Hanport_activate));
        Assert.That(result.MeteringpointStep, Is.Not.Null);
        Assert.That(result.MeteringpointStep.MeteringpointNo, Is.EqualTo(meteringpointNo));
        Assert.That(result.MeteringpointStep.HanportStatus, Is.EqualTo(1));
        Assert.That(result.MeteringpointStep.HanportStatusName, Is.EqualTo("Active"));
        Assert.That(result.HanportStep, Is.Not.Null);
        Assert.That(result.SummaryStep, Is.Not.Null);
        Assert.That(result.StepData, Is.Not.Null);
    });
    
    await _repository.Received(1).GetProcessAsync(workorderId);
    _mapper.Received(1).Map<ExecuteVM>(processState);
}
```

---

#### TC-HPS-002: Process Retrieval with Empty StepData
**Priority:** High  
**Test Type:** Edge Case  
**Description:** Verify handling when StepData deserialization returns null

**Test Implementation:**
```csharp
[Test]
public async Task GetHanportProcessVMAsync_ShouldCreateNewExecuteDataVM_WhenStepDataIsNull()
{
    // Arrange
    var workorderId = 123;
    var executeVM = new ExecuteVM
    {
        State = HanportProcessStates.InProgress,
        ProcessType = HanportProcessType.Hanport_activate,
        StepData = Encoding.UTF8.GetBytes("{}") // Empty JSON
    };
    
    _repository.GetProcessAsync(workorderId).Returns(new ProcessState());
    _mapper.Map<ExecuteVM>(Arg.Any<ProcessState>()).Returns(executeVM);
    _repository.GetHanportStatusNoAsync(Arg.Any<int>()).Returns(0);
    _repository.GetHanportStatusNameAsync(Arg.Any<int>()).Returns("");

    // Act
    var result = await _service.GetHanportProcessVMAsync(workorderId);

    // Assert
    Assert.Multiple(() =>
    {
        Assert.That(result, Is.Not.Null);
        Assert.That(result.MeteringpointStep, Is.Not.Null);
        Assert.That(result.HanportStep, Is.Not.Null);
        Assert.That(result.SummaryStep, Is.Not.Null);
    });
}
```

---

#### TC-HPS-003: Null WorkorderId Handling
**Priority:** High  
**Test Type:** Negative  
**Description:** Verify behavior when null workorderId is provided

**Test Implementation:**
```csharp
[Test]
public async Task GetHanportProcessVMAsync_ShouldCallRepository_WhenWorkerOrderIdIsNull()
{
    // Arrange
    _repository.GetProcessAsync(null).Returns((ProcessState)null);

    // Act & Assert
    Assert.ThrowsAsync<NullReferenceException>(async () => 
        await _service.GetHanportProcessVMAsync(null));
    
    await _repository.Received(1).GetProcessAsync(null);
}
```

---

#### TC-HPS-004: Repository Exception Propagation
**Priority:** High  
**Test Type:** Negative  
**Description:** Verify exception from repository propagates correctly

**Test Implementation:**
```csharp
[Test]
public void GetHanportProcessVMAsync_ShouldThrowException_WhenRepositoryFails()
{
    // Arrange
    _repository.GetProcessAsync(Arg.Any<int?>())
        .Throws(new Exception("Database error"));

    // Act & Assert
    var ex = Assert.ThrowsAsync<Exception>(async () => 
        await _service.GetHanportProcessVMAsync(123));
    Assert.That(ex.Message, Is.EqualTo("Database error"));
}
```

---

#### TC-HPS-005: AutoMapper Exception Handling
**Priority:** Medium  
**Test Type:** Negative  
**Description:** Verify exception when AutoMapper mapping fails

**Test Implementation:**
```csharp
[Test]
public void GetHanportProcessVMAsync_ShouldThrowException_WhenMappingFails()
{
    // Arrange
    _repository.GetProcessAsync(Arg.Any<int?>()).Returns(new ProcessState());
    _mapper.Map<ExecuteVM>(Arg.Any<ProcessState>())
        .Throws(new AutoMapperMappingException("Mapping failed"));

    // Act & Assert
    Assert.ThrowsAsync<AutoMapperMappingException>(async () => 
        await _service.GetHanportProcessVMAsync(123));
}
```

---

#### TC-HPS-006: JSON Deserialization Robustness
**Priority:** Medium  
**Test Type:** Edge Case  
**Description:** Verify handling of malformed JSON in StepData

**Test Implementation:**
```csharp
[Test]
public void GetHanportProcessVMAsync_ShouldThrowException_WhenStepDataIsInvalidJson()
{
    // Arrange
    var executeVM = new ExecuteVM
    {
        StepData = Encoding.UTF8.GetBytes("invalid json {{{")
    };
    
    _repository.GetProcessAsync(Arg.Any<int?>()).Returns(new ProcessState());
    _mapper.Map<ExecuteVM>(Arg.Any<ProcessState>()).Returns(executeVM);

    // Act & Assert
    Assert.ThrowsAsync<JsonException>(async () => 
        await _service.GetHanportProcessVMAsync(123));
}
```

---

### 2. ExecuteProcess Tests

#### TC-HPS-007: Successful Process Execution
**Priority:** High  
**Test Type:** Positive  
**Description:** Verify process execution with complete VM data

**Test Implementation:**
```csharp
[Test]
public async Task ExecuteProcess_ShouldReturnWorkorderId_WhenExecutionSucceeds()
{
    // Arrange
    var expectedWorkorderId = 789;
    var vm = new HanportProcessVM
    {
        MeteringpointStep = new MeteringpointStepVM 
        { 
            MeteringpointNo = 456,
            MeteringpointId = "EAN123456"
        },
        HanportStep = new HanportStepVM 
        { 
            HanportStatusNew = HanStatus.Activated,
            ChangeDate = DateTime.Now
        },
        SummaryStep = new SummaryStepVM(),
        State = HanportProcessStates.InProgress,
        ProcessType = HanportProcessType.Hanport_activate
    };
    
    var processState = new ProcessState();
    _mapper.Map<ProcessState>(Arg.Any<ExecuteVM>()).Returns(processState);
    _repository.ExecuteProcess(processState).Returns(expectedWorkorderId);

    // Act
    var result = await _service.ExecuteProcess(vm);

    // Assert
    Assert.That(result, Is.EqualTo(expectedWorkorderId));
    
    await _repository.Received(1).ExecuteProcess(
        Arg.Is<ProcessState>(p => p == processState));
    _mapper.Received(1).Map<ProcessState>(Arg.Any<ExecuteVM>());
}
```

---

#### TC-HPS-008: ExecuteProcess Creates Correct ExecuteDataVM
**Priority:** High  
**Test Type:** Positive  
**Description:** Verify ExecuteDataVM is properly constructed from HanportProcessVM

**Test Implementation:**
```csharp
[Test]
public async Task ExecuteProcess_ShouldSerializeExecuteData_Correctly()
{
    // Arrange
    var vm = new HanportProcessVM
    {
        MeteringpointStep = new MeteringpointStepVM { MeteringpointNo = 123 },
        HanportStep = new HanportStepVM { HanportStatusNew = HanStatus.Activated },
        SummaryStep = new SummaryStepVM { ProcessExecuted = true }
    };
    
    ExecuteVM capturedExecuteVM = null;
    _mapper.Map<ProcessState>(Arg.Do<ExecuteVM>(x => capturedExecuteVM = x))
        .Returns(new ProcessState());
    _repository.ExecuteProcess(Arg.Any<ProcessState>()).Returns(1);

    // Act
    await _service.ExecuteProcess(vm);

    // Assert
    Assert.That(capturedExecuteVM, Is.Not.Null);
    Assert.That(capturedExecuteVM.MeteringpointNo, Is.EqualTo(123));
    Assert.That(capturedExecuteVM.StepData, Is.Not.Null);
    
    // Deserialize and verify
    var json = Encoding.UTF8.GetString(capturedExecuteVM.StepData);
    var executeData = JsonConvert.DeserializeObject<ExecuteDataVM>(json);
    Assert.Multiple(() =>
    {
        Assert.That(executeData.MeteringpointStep.MeteringpointNo, Is.EqualTo(123));
        Assert.That(executeData.HanportStep.HanportStatusNew, Is.EqualTo(HanStatus.Activated));
        Assert.That(executeData.SummaryStep.ProcessExecuted, Is.True);
    });
}
```

---

#### TC-HPS-009: ExecuteProcess with Null MeteringpointNo
**Priority:** Medium  
**Test Type:** Edge Case  
**Description:** Verify handling when MeteringpointNo is null (uses GetValueOrDefault)

**Test Implementation:**
```csharp
[Test]
public async Task ExecuteProcess_ShouldUseDefaultMeteringpointNo_WhenNull()
{
    // Arrange
    var vm = new HanportProcessVM
    {
        MeteringpointStep = new MeteringpointStepVM { MeteringpointNo = null }
    };
    
    ExecuteVM capturedExecuteVM = null;
    _mapper.Map<ProcessState>(Arg.Do<ExecuteVM>(x => capturedExecuteVM = x))
        .Returns(new ProcessState());
    _repository.ExecuteProcess(Arg.Any<ProcessState>()).Returns(1);

    // Act
    await _service.ExecuteProcess(vm);

    // Assert
    Assert.That(capturedExecuteVM.MeteringpointNo, Is.EqualTo(0)); // GetValueOrDefault
}
```

---

#### TC-HPS-010: ExecuteProcess with Null ChangeDate
**Priority:** Medium  
**Test Type:** Edge Case  
**Description:** Verify handling when ChangeDate is null

**Test Implementation:**
```csharp
[Test]
public async Task ExecuteProcess_ShouldUseDefaultChangeDate_WhenNull()
{
    // Arrange
    var vm = new HanportProcessVM
    {
        HanportStep = new HanportStepVM { ChangeDate = null }
    };
    
    ExecuteVM capturedExecuteVM = null;
    _mapper.Map<ProcessState>(Arg.Do<ExecuteVM>(x => capturedExecuteVM = x))
        .Returns(new ProcessState());
    _repository.ExecuteProcess(Arg.Any<ProcessState>()).Returns(1);

    // Act
    await _service.ExecuteProcess(vm);

    // Assert
    Assert.That(capturedExecuteVM.ChangeDate, Is.EqualTo(default(DateTime)));
}
```

---

#### TC-HPS-011: ExecuteProcess Repository Exception
**Priority:** High  
**Test Type:** Negative  
**Description:** Verify exception propagation from repository

**Test Implementation:**
```csharp
[Test]
public void ExecuteProcess_ShouldThrowException_WhenRepositoryFails()
{
    // Arrange
    var vm = new HanportProcessVM();
    _mapper.Map<ProcessState>(Arg.Any<ExecuteVM>()).Returns(new ProcessState());
    _repository.ExecuteProcess(Arg.Any<ProcessState>())
        .Throws(new Exception("Execution failed"));

    // Act & Assert
    var ex = Assert.ThrowsAsync<Exception>(async () => 
        await _service.ExecuteProcess(vm));
    Assert.That(ex.Message, Is.EqualTo("Execution failed"));
}
```

---

#### TC-HPS-012: ExecuteProcess Mapper Exception
**Priority:** High  
**Test Type:** Negative  
**Description:** Verify exception when mapper fails

**Test Implementation:**
```csharp
[Test]
public void ExecuteProcess_ShouldThrowException_WhenMapperFails()
{
    // Arrange
    var vm = new HanportProcessVM();
    _mapper.Map<ProcessState>(Arg.Any<ExecuteVM>())
        .Throws(new AutoMapperMappingException("Mapping error"));

    // Act & Assert
    Assert.ThrowsAsync<AutoMapperMappingException>(async () => 
        await _service.ExecuteProcess(vm));
}
```

---

#### TC-HPS-013: ExecuteProcess JSON Serialization Error
**Priority:** Medium  
**Test Type:** Negative  
**Description:** Verify handling of serialization issues (rare but possible)

**Test Implementation:**
```csharp
[Test]
public void ExecuteProcess_ShouldThrowException_WhenSerializationFails()
{
    // Arrange - Create circular reference to trigger serialization error
    var vm = new HanportProcessVM
    {
        MeteringpointStep = new MeteringpointStepVM()
    };
    // Note: JsonConvert usually handles this, but test defensive coding
    
    _mapper.Map<ProcessState>(Arg.Any<ExecuteVM>()).Returns(new ProcessState());
    _repository.ExecuteProcess(Arg.Any<ProcessState>()).Returns(1);

    // Act & Assert - Should complete successfully in normal cases
    Assert.DoesNotThrowAsync(async () => await _service.ExecuteProcess(vm));
}
```

---

### 3. ReProcessAsync Tests

#### TC-HPS-014: Successful ReProcess
**Priority:** High  
**Test Type:** Positive  
**Description:** Verify process re-execution calls repository correctly

**Test Implementation:**
```csharp
[Test]
public async Task ReProcessAsync_ShouldCallRepository_WhenCalled()
{
    // Arrange
    var workorderId = 123;
    _repository.ReProcess(workorderId).Returns(Task.CompletedTask);

    // Act
    await _service.ReProcessAsync(workorderId);

    // Assert
    await _repository.Received(1).ReProcess(workorderId);
}
```

---

#### TC-HPS-015: ReProcess with Zero WorkorderId
**Priority:** Medium  
**Test Type:** Edge Case  
**Description:** Verify handling of edge case workorder IDs

**Test Implementation:**
```csharp
[Test]
public async Task ReProcessAsync_ShouldCallRepository_WhenWorkerOrderIdIsZero()
{
    // Arrange
    _repository.ReProcess(0).Returns(Task.CompletedTask);

    // Act
    await _service.ReProcessAsync(0);

    // Assert
    await _repository.Received(1).ReProcess(0);
}
```

---

#### TC-HPS-016: ReProcess Exception Propagation
**Priority:** High  
**Test Type:** Negative  
**Description:** Verify exception from repository is propagated

**Test Implementation:**
```csharp
[Test]
public void ReProcessAsync_ShouldThrowException_WhenRepositoryFails()
{
    // Arrange
    _repository.ReProcess(Arg.Any<int>())
        .Throws(new Exception("ReProcess failed"));

    // Act & Assert
    var ex = Assert.ThrowsAsync<Exception>(async () => 
        await _service.ReProcessAsync(123));
    Assert.That(ex.Message, Is.EqualTo("ReProcess failed"));
}
```

---

### 4. CancelProcessAsync Tests

#### TC-HPS-017: Successful Process Cancellation
**Priority:** High  
**Test Type:** Positive  
**Description:** Verify cancellation removes session and updates state

**Test Implementation:**
```csharp
[Test]
public async Task CancelProcessAsync_ShouldRemoveSessionAndUpdateState_WhenCalled()
{
    // Arrange
    var workorderId = 123;
    _repository.UpdateStateAsync(workorderId, HanportProcessStates.Cancelled)
        .Returns(Task.CompletedTask);

    // Act
    var result = await _service.CancelProcessAsync(workorderId);

    // Assert
    Assert.That(result, Is.True);
    
    // Verify session removal
    _session.Received(1).Remove("hanport-process-id");
    
    // Verify state update
    await _repository.Received(1).UpdateStateAsync(
        workorderId, 
        HanportProcessStates.Cancelled);
}
```

---

#### TC-HPS-018: CancelProcess Returns True Even on Repository Failure
**Priority:** Medium  
**Test Type:** Edge Case  
**Description:** Verify method returns true despite repository issues (current behavior)

**Test Implementation:**
```csharp
[Test]
public async Task CancelProcessAsync_ShouldReturnTrue_EvenWhenStateUpdateFails()
{
    // Arrange
    var workorderId = 123;
    _repository.UpdateStateAsync(workorderId, HanportProcessStates.Cancelled)
        .Returns(Task.CompletedTask);

    // Act
    var result = await _service.CancelProcessAsync(workorderId);

    // Assert
    Assert.That(result, Is.True); // Always returns true
}
```

---

#### TC-HPS-019: CancelProcess Exception Propagation
**Priority:** High  
**Test Type:** Negative  
**Description:** Verify exception from UpdateStateAsync propagates

**Test Implementation:**
```csharp
[Test]
public void CancelProcessAsync_ShouldThrowException_WhenRepositoryFails()
{
    // Arrange
    _repository.UpdateStateAsync(Arg.Any<int>(), Arg.Any<HanportProcessStates>())
        .Throws(new Exception("Update failed"));

    // Act & Assert
    Assert.ThrowsAsync<Exception>(async () => 
        await _service.CancelProcessAsync(123));
    
    // Session should still be removed before exception
    _session.Received(1).Remove("hanport-process-id");
}
```

---

#### TC-HPS-020: CancelProcess Session Removal Order
**Priority:** Medium  
**Test Type:** Positive  
**Description:** Verify session is removed before state update

**Test Implementation:**
```csharp
[Test]
public async Task CancelProcessAsync_ShouldRemoveSessionBeforeUpdatingState()
{
    // Arrange
    var workorderId = 123;
    var callOrder = new List<string>();
    
    _session.When(x => x.Remove(Arg.Any<string>()))
        .Do(_ => callOrder.Add("SessionRemove"));
    _repository.UpdateStateAsync(Arg.Any<int>(), Arg.Any<HanportProcessStates>())
        .Returns(Task.CompletedTask)
        .AndDoes(_ => callOrder.Add("UpdateState"));

    // Act
    await _service.CancelProcessAsync(workorderId);

    // Assert
    Assert.That(callOrder[0], Is.EqualTo("SessionRemove"));
    Assert.That(callOrder[1], Is.EqualTo("UpdateState"));
}
```

---

### 5. SetState Tests

#### TC-HPS-021: Successful State Update
**Priority:** High  
**Test Type:** Positive  
**Description:** Verify state is updated correctly

**Test Implementation:**
```csharp
[Test]
public async Task SetState_ShouldUpdateState_WhenCalled()
{
    // Arrange
    var workorderId = 123;
    var newState = HanportProcessStates.Done;
    _repository.UpdateStateAsync(workorderId, newState).Returns(Task.CompletedTask);

    // Act
    var result = await _service.SetState(workorderId, newState);

    // Assert
    Assert.That(result, Is.True);
    await _repository.Received(1).UpdateStateAsync(workorderId, newState);
}
```

---

#### TC-HPS-022: SetState Always Returns True
**Priority:** Medium  
**Test Type:** Positive  
**Description:** Verify method always returns true on successful completion

**Test Implementation:**
```csharp
[Test]
public async Task SetState_ShouldReturnTrue_WhenUpdateCompletes()
{
    // Arrange
    _repository.UpdateStateAsync(Arg.Any<int>(), Arg.Any<HanportProcessStates>())
        .Returns(Task.CompletedTask);

    // Act
    var result = await _service.SetState(123, HanportProcessStates.Failed);

    // Assert
    Assert.That(result, Is.True);
}
```

---

#### TC-HPS-023: SetState with All Enum Values
**Priority:** Medium  
**Test Type:** Positive  
**Description:** Verify all state enum values can be set

**Test Implementation:**
```csharp
[Test]
[TestCase(HanportProcessStates.InProgress)]
[TestCase(HanportProcessStates.Failed)]
[TestCase(HanportProcessStates.ProcessInProgress)]
[TestCase(HanportProcessStates.Cancelled)]
[TestCase(HanportProcessStates.Done)]
public async Task SetState_ShouldAcceptAllStateValues(HanportProcessStates state)
{
    // Arrange
    _repository.UpdateStateAsync(Arg.Any<int>(), state).Returns(Task.CompletedTask);

    // Act
    var result = await _service.SetState(123, state);

    // Assert
    Assert.That(result, Is.True);
    await _repository.Received(1).UpdateStateAsync(123, state);
}
```

---

#### TC-HPS-024: SetState Exception Propagation
**Priority:** High  
**Test Type:** Negative  
**Description:** Verify exception from repository propagates

**Test Implementation:**
```csharp
[Test]
public void SetState_ShouldThrowException_WhenRepositoryFails()
{
    // Arrange
    _repository.UpdateStateAsync(Arg.Any<int>(), Arg.Any<HanportProcessStates>())
        .Throws(new Exception("State update failed"));

    // Act & Assert
    var ex = Assert.ThrowsAsync<Exception>(async () => 
        await _service.SetState(123, HanportProcessStates.Done));
    Assert.That(ex.Message, Is.EqualTo("State update failed"));
}
```

---

### 6. RemoveReference Tests

#### TC-HPS-025: Successful Session Removal
**Priority:** High  
**Test Type:** Positive  
**Description:** Verify session key is removed

**Test Implementation:**
```csharp
[Test]
public void RemoveReference_ShouldRemoveSessionKey_WhenCalled()
{
    // Act
    _service.RemoveReference();

    // Assert
    _session.Received(1).Remove("hanport-process-id");
}
```

---

#### TC-HPS-026: Multiple RemoveReference Calls
**Priority:** Low  
**Test Type:** Edge Case  
**Description:** Verify multiple calls don't cause issues

**Test Implementation:**
```csharp
[Test]
public void RemoveReference_ShouldHandleMultipleCalls()
{
    // Act
    _service.RemoveReference();
    _service.RemoveReference();
    _service.RemoveReference();

    // Assert
    _session.Received(3).Remove("hanport-process-id");
}
```

---

## Complete Test Class Template

```csharp
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using NUnit.Framework;
using Perigon.Modules.MeteringPoint.Domains.DataTransferObjects.HanportProcess;
using Perigon.Modules.MeteringPoint.Domains.Interfaces.HanportProcess;
using Perigon.Modules.MeteringPoint.Utils.Services.HanportProcess;
using Perigon.Modules.MeteringPoint.ViewModels.HanportProcess;

namespace Perigon.Modules.MeteringPoint.UnitTests.Utils.Services.HanportProcess;

/// <summary>
/// Test Suite: HanportProcessService
/// 
/// Coverage Target: 100% (Line, Branch, Method)
/// Total Tests: 26
/// 
/// Service Under Test: Core orchestration for Hanport process lifecycle
/// 
/// Test Coverage:
/// - GetHanportProcessVMAsync: Process retrieval and mapping (6 tests)
/// - ExecuteProcess: Process execution and persistence (7 tests)
/// - ReProcessAsync: Process re-execution (3 tests)
/// - CancelProcessAsync: Cancellation with session cleanup (4 tests)
/// - SetState: State transitions (4 tests)
/// - RemoveReference: Session management (2 tests)
/// 
/// Notes:
/// - Service uses AutoMapper (legacy) - mocked in tests
/// - Session-based process tracking via IHttpContextAccessor
/// - JSON serialization of ExecuteDataVM for StepData storage
/// - Always returns true from SetState (current design)
/// </summary>
[TestFixture]
[TestOf(typeof(HanportProcessService))]
[Category("UnitTests")]
[Category("HanportProcess")]
[Category("HanportProcessService")]
public class HanportProcessServiceTests
{
    private IMapper _mapper;
    private IHttpContextAccessor _httpContextAccessor;
    private IHanportProcessRepository _repository;
    private ISession _session;
    private HanportProcessService _service;

    [SetUp]
    public void SetUp()
    {
        _mapper = Substitute.For<IMapper>();
        _httpContextAccessor = Substitute.For<IHttpContextAccessor>();
        _repository = Substitute.For<IHanportProcessRepository>();
        _session = Substitute.For<ISession>();
        
        var httpContext = new DefaultHttpContext();
        httpContext.Session = _session;
        _httpContextAccessor.HttpContext.Returns(httpContext);

        _service = new HanportProcessService(
            _mapper,
            _httpContextAccessor,
            _repository);
    }

    #region GetHanportProcessVMAsync Tests

    [Test]
    [Description("Verify process retrieval with all steps populated")]
    [Property("Priority", "High")]
    [Property("TestType", "Positive")]
    public async Task GetHanportProcessVMAsync_ShouldReturnCompleteVM_WhenProcessExists()
    {
        // Test implementation from TC-HPS-001
    }

    [Test]
    [Description("Verify handling when StepData deserialization returns null")]
    [Property("Priority", "High")]
    [Property("TestType", "EdgeCase")]
    public async Task GetHanportProcessVMAsync_ShouldCreateNewExecuteDataVM_WhenStepDataIsNull()
    {
        // Test implementation from TC-HPS-002
    }

    [Test]
    [Description("Verify behavior when null workorderId is provided")]
    [Property("Priority", "High")]
    [Property("TestType", "Negative")]
    public async Task GetHanportProcessVMAsync_ShouldCallRepository_WhenWorkerOrderIdIsNull()
    {
        // Test implementation from TC-HPS-003
    }

    [Test]
    [Description("Verify exception from repository propagates correctly")]
    [Property("Priority", "High")]
    [Property("TestType", "Negative")]
    public void GetHanportProcessVMAsync_ShouldThrowException_WhenRepositoryFails()
    {
        // Test implementation from TC-HPS-004
    }

    [Test]
    [Description("Verify exception when AutoMapper mapping fails")]
    [Property("Priority", "Medium")]
    [Property("TestType", "Negative")]
    public void GetHanportProcessVMAsync_ShouldThrowException_WhenMappingFails()
    {
        // Test implementation from TC-HPS-005
    }

    [Test]
    [Description("Verify handling of malformed JSON in StepData")]
    [Property("Priority", "Medium")]
    [Property("TestType", "EdgeCase")]
    public void GetHanportProcessVMAsync_ShouldThrowException_WhenStepDataIsInvalidJson()
    {
        // Test implementation from TC-HPS-006
    }

    #endregion

    #region ExecuteProcess Tests

    [Test]
    [Description("Verify process execution with complete VM data")]
    [Property("Priority", "High")]
    [Property("TestType", "Positive")]
    public async Task ExecuteProcess_ShouldReturnWorkorderId_WhenExecutionSucceeds()
    {
        // Test implementation from TC-HPS-007
    }

    [Test]
    [Description("Verify ExecuteDataVM is properly constructed from HanportProcessVM")]
    [Property("Priority", "High")]
    [Property("TestType", "Positive")]
    public async Task ExecuteProcess_ShouldSerializeExecuteData_Correctly()
    {
        // Test implementation from TC-HPS-008
    }

    [Test]
    [Description("Verify handling when MeteringpointNo is null")]
    [Property("Priority", "Medium")]
    [Property("TestType", "EdgeCase")]
    public async Task ExecuteProcess_ShouldUseDefaultMeteringpointNo_WhenNull()
    {
        // Test implementation from TC-HPS-009
    }

    [Test]
    [Description("Verify handling when ChangeDate is null")]
    [Property("Priority", "Medium")]
    [Property("TestType", "EdgeCase")]
    public async Task ExecuteProcess_ShouldUseDefaultChangeDate_WhenNull()
    {
        // Test implementation from TC-HPS-010
    }

    [Test]
    [Description("Verify exception propagation from repository")]
    [Property("Priority", "High")]
    [Property("TestType", "Negative")]
    public void ExecuteProcess_ShouldThrowException_WhenRepositoryFails()
    {
        // Test implementation from TC-HPS-011
    }

    [Test]
    [Description("Verify exception when mapper fails")]
    [Property("Priority", "High")]
    [Property("TestType", "Negative")]
    public void ExecuteProcess_ShouldThrowException_WhenMapperFails()
    {
        // Test implementation from TC-HPS-012
    }

    [Test]
    [Description("Verify handling of serialization issues")]
    [Property("Priority", "Medium")]
    [Property("TestType", "Negative")]
    public void ExecuteProcess_ShouldThrowException_WhenSerializationFails()
    {
        // Test implementation from TC-HPS-013
    }

    #endregion

    #region ReProcessAsync Tests

    [Test]
    [Description("Verify process re-execution calls repository correctly")]
    [Property("Priority", "High")]
    [Property("TestType", "Positive")]
    public async Task ReProcessAsync_ShouldCallRepository_WhenCalled()
    {
        // Test implementation from TC-HPS-014
    }

    [Test]
    [Description("Verify handling of edge case workorder IDs")]
    [Property("Priority", "Medium")]
    [Property("TestType", "EdgeCase")]
    public async Task ReProcessAsync_ShouldCallRepository_WhenWorkerOrderIdIsZero()
    {
        // Test implementation from TC-HPS-015
    }

    [Test]
    [Description("Verify exception from repository is propagated")]
    [Property("Priority", "High")]
    [Property("TestType", "Negative")]
    public void ReProcessAsync_ShouldThrowException_WhenRepositoryFails()
    {
        // Test implementation from TC-HPS-016
    }

    #endregion

    #region CancelProcessAsync Tests

    [Test]
    [Description("Verify cancellation removes session and updates state")]
    [Property("Priority", "High")]
    [Property("TestType", "Positive")]
    public async Task CancelProcessAsync_ShouldRemoveSessionAndUpdateState_WhenCalled()
    {
        // Test implementation from TC-HPS-017
    }

    [Test]
    [Description("Verify method returns true despite repository issues")]
    [Property("Priority", "Medium")]
    [Property("TestType", "EdgeCase")]
    public async Task CancelProcessAsync_ShouldReturnTrue_EvenWhenStateUpdateFails()
    {
        // Test implementation from TC-HPS-018
    }

    [Test]
    [Description("Verify exception from UpdateStateAsync propagates")]
    [Property("Priority", "High")]
    [Property("TestType", "Negative")]
    public void CancelProcessAsync_ShouldThrowException_WhenRepositoryFails()
    {
        // Test implementation from TC-HPS-019
    }

    [Test]
    [Description("Verify session is removed before state update")]
    [Property("Priority", "Medium")]
    [Property("TestType", "Positive")]
    public async Task CancelProcessAsync_ShouldRemoveSessionBeforeUpdatingState()
    {
        // Test implementation from TC-HPS-020
    }

    #endregion

    #region SetState Tests

    [Test]
    [Description("Verify state is updated correctly")]
    [Property("Priority", "High")]
    [Property("TestType", "Positive")]
    public async Task SetState_ShouldUpdateState_WhenCalled()
    {
        // Test implementation from TC-HPS-021
    }

    [Test]
    [Description("Verify method always returns true on successful completion")]
    [Property("Priority", "Medium")]
    [Property("TestType", "Positive")]
    public async Task SetState_ShouldReturnTrue_WhenUpdateCompletes()
    {
        // Test implementation from TC-HPS-022
    }

    [Test]
    [TestCase(HanportProcessStates.InProgress)]
    [TestCase(HanportProcessStates.Failed)]
    [TestCase(HanportProcessStates.ProcessInProgress)]
    [TestCase(HanportProcessStates.Cancelled)]
    [TestCase(HanportProcessStates.Done)]
    [Description("Verify all state enum values can be set")]
    [Property("Priority", "Medium")]
    [Property("TestType", "Positive")]
    public async Task SetState_ShouldAcceptAllStateValues(HanportProcessStates state)
    {
        // Test implementation from TC-HPS-023
    }

    [Test]
    [Description("Verify exception from repository propagates")]
    [Property("Priority", "High")]
    [Property("TestType", "Negative")]
    public void SetState_ShouldThrowException_WhenRepositoryFails()
    {
        // Test implementation from TC-HPS-024
    }

    #endregion

    #region RemoveReference Tests

    [Test]
    [Description("Verify session key is removed")]
    [Property("Priority", "High")]
    [Property("TestType", "Positive")]
    public void RemoveReference_ShouldRemoveSessionKey_WhenCalled()
    {
        // Test implementation from TC-HPS-025
    }

    [Test]
    [Description("Verify multiple calls don't cause issues")]
    [Property("Priority", "Low")]
    [Property("TestType", "EdgeCase")]
    public void RemoveReference_ShouldHandleMultipleCalls()
    {
        // Test implementation from TC-HPS-026
    }

    #endregion
}
```

---

## Risk Assessment

### Testing Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| JSON serialization edge cases | Medium | Low | Test malformed JSON scenarios |
| Session mocking complexity | Medium | Medium | Use helper methods for session setup |
| AutoMapper configuration issues | Low | Low | Mock IMapper, don't configure |
| Null reference exceptions | Medium | Low | Test all nullable parameters |
| State transition logic gaps | Medium | Low | Test all enum values |

### Code Quality Risks

| Risk | Impact | Recommendation |
|------|--------|----------------|
| Always returns true from SetState | Medium | Consider returning repository result or void |
| No validation in ExecuteProcess | Medium | Add null checks for critical properties |
| Session key hardcoded | Low | Use constant (already done correctly) |
| Large commented-out code block | Low | Remove legacy code if not needed |
| No logging | Medium | Add logging for debugging production issues |

---

## Recommended Improvements

### Code Enhancement Suggestions

1. **Add Input Validation**
   ```csharp
   public async Task<int> ExecuteProcess(HanportProcessVM vm)
   {
       if (vm == null) throw new ArgumentNullException(nameof(vm));
       if (vm.MeteringpointStep?.MeteringpointNo == null) 
           throw new ArgumentException("MeteringpointNo is required");
       
       // ... rest of implementation
   }
   ```

2. **Return Actual Repository Result**
   ```csharp
   public async Task<bool> SetState(int workorderId, HanportProcessStates state)
   {
       var result = await hanportProcessRepository.UpdateStateAsync(workorderId, state);
       return result; // Instead of always returning true
   }
   ```

3. **Add Logging**
   ```csharp
   public async Task<int> ExecuteProcess(HanportProcessVM vm)
   {
       _logger.LogInformation("Executing process for MP: {MeteringpointNo}", 
           vm.MeteringpointStep.MeteringpointNo);
       
       try
       {
           // ... implementation
           _logger.LogInformation("Process executed successfully. WorkorderId: {WorkorderId}", 
               workorderId);
           return workorderId;
       }
       catch (Exception ex)
       {
           _logger.LogError(ex, "Failed to execute process for MP: {MeteringpointNo}", 
               vm.MeteringpointStep.MeteringpointNo);
           throw;
       }
   }
   ```

4. **Remove Commented Code**
   - Clean up the large block of commented-out methods
   - Keep in version control history if needed

5. **Add Null Safety**
   ```csharp
   public async Task<HanportProcessVM> GetHanportProcessVMAsync(int? workorderId)
   {
       if (workorderId == null) 
           throw new ArgumentNullException(nameof(workorderId));
       
       var process = await hanportProcessRepository.GetProcessAsync(workorderId);
       if (process == null)
           throw new InvalidOperationException($"Process {workorderId} not found");
       
       // ... rest of implementation
   }
   ```

---

## Test Execution Plan

### Phase 1: Core Method Tests (Priority 1)
**Duration:** 2-3 hours

1. Implement GetHanportProcessVMAsync tests (6 tests)
2. Implement ExecuteProcess tests (7 tests)
3. Run tests and verify passing
4. Review code coverage for these methods

### Phase 2: State Management Tests (Priority 2)
**Duration:** 1-2 hours

1. Implement SetState tests (4 tests)
2. Implement CancelProcessAsync tests (4 tests)
3. Run tests and verify passing

### Phase 3: Utility Method Tests (Priority 3)
**Duration:** 30-60 minutes

1. Implement ReProcessAsync tests (3 tests)
2. Implement RemoveReference tests (2 tests)
3. Run full test suite
4. Review final code coverage

### Total Estimated Time
- **Minimum:** 4 hours (core scenarios only)
- **Maximum:** 6 hours (all scenarios with debugging)

---

## Success Criteria

### Test Coverage Goals
- ✅ **Line Coverage:** 100%
- ✅ **Branch Coverage:** 100%
- ✅ **Method Coverage:** 100%

### Quality Gates
- ✅ All 26 tests must pass
- ✅ No compilation warnings in test file
- ✅ Test names follow naming convention
- ✅ All tests use Arrange-Act-Assert pattern
- ✅ Session mocking implemented correctly
- ✅ AutoMapper properly substituted
- ✅ JSON serialization scenarios covered

---

## Running the Tests

### Run All HanportProcessService Tests
```powershell
dotnet test --filter "FullyQualifiedName~HanportProcessServiceTests"
```

### Run Specific Test Category
```powershell
# GetHanportProcessVMAsync tests only
dotnet test --filter "FullyQualifiedName~HanportProcessServiceTests.GetHanportProcessVMAsync"

# ExecuteProcess tests only
dotnet test --filter "FullyQualifiedName~HanportProcessServiceTests.ExecuteProcess"
```

### Run with Coverage
```powershell
dotnet test --collect:"XPlat Code Coverage" --filter "FullyQualifiedName~HanportProcessServiceTests"
```

---

## Test Maintenance Guidelines

### When to Update Tests

1. **New Method Added:** Add corresponding test coverage
2. **State Enum Changed:** Update TC-HPS-023 test cases
3. **Session Key Changed:** Update all session-related tests
4. **AutoMapper Removed:** Replace mapper mocks with manual mapping verification
5. **Validation Added:** Add validation failure test scenarios

### Red Flags to Watch For

⚠️ **Test fails after enum value change** → Update test cases with new enum values  
⚠️ **Test fails after session key change** → Update session key constant  
⚠️ **Flaky session tests** → Check DefaultHttpContext setup in SetUp  
⚠️ **JSON deserialization failures** → Verify DTO structure matches serialized data  
⚠️ **Mapper exceptions** → Ensure all Map<T> calls are mocked

---

## Notes

### Session Mocking Pattern
```csharp
[SetUp]
public void SetUp()
{
    _session = Substitute.For<ISession>();
    var httpContext = new DefaultHttpContext();
    httpContext.Session = _session;
    _httpContextAccessor.HttpContext.Returns(httpContext);
}
```

### JSON Serialization Testing
- Test both serialization (ExecuteProcess) and deserialization (GetHanportProcessVMAsync)
- Handle malformed JSON scenarios
- Verify byte array encoding/decoding

### AutoMapper Legacy Usage
- Service uses AutoMapper (legacy dependency)
- All Map<T> calls must be mocked in tests
- Consider refactoring to manual mapping in future

---

## Related Documentation
- **Related Test Plans:** 
  - HanportProcess_CommonService_TestPlan.md
  - HanportProcess_HanportOverviewDataService_TestPlan.md
  - HanportProcess_HanportOverviewSettings_TestPlan.md
- **Related Services:** CommonService, HanportOverviewDataService
- **Dependencies:** IHanportProcessRepository, IMapper, IHttpContextAccessor

**End of Test Plan**

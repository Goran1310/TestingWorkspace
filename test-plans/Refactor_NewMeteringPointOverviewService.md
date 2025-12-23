
# Refactor NewMeteringPointOverviewService - Remove AutoMapper

**Date:** December 13, 2025  
**Module:** Perigon.Modules.MeteringPoint  
**Service:** NewMeteringPointOverviewService  
**Test File:** NewMeteringPointOverviewServiceTests.cs (99 tests, 2825 lines)

---

## Executive Summary

**Question:** Can we avoid AutoMapper in NewMeteringPointOverviewServiceTests?

**Answer:** **Yes and No**

- ❌ **NO** - Cannot remove from *current* tests (service uses AutoMapper)
- ✅ **YES** - Can remove by refactoring the service implementation first

**Current State:** Service uses `IMapper` → Tests correctly mock it  
**Desired State:** Service uses manual mapping → Tests verify actual mapping logic

---

## Current Situation Analysis

### Service Implementation

**Current Code:**
```csharp
public class NewMeteringPointOverviewService(
    INewMeteringPointOverviewRepository repository, 
    IMapper mapper) : INewMeteringPointOverviewService
{
    public async Task<IEnumerable<ProcessStateVM>> GetOverviewByStateAsync()
    {
        var processStates = await repository.CreateProcessAsync();
        return mapper.Map<IEnumerable<ProcessStateVM>>(processStates);
    }
    
    public async Task UpdateStateAsync(int processId, int newState)
    {
        await repository.UpdateStateAsync(processId, newState);
    }
}
```

**Key Points:**
- Constructor requires `IMapper` dependency
- Calls `mapper.Map<>()` to transform DTOs to ViewModels
- No manual mapping logic present

### Test Implementation

**Current Pattern:**
```csharp
[SetUp]
public void SetUp()
{
    _repository = Substitute.For<INewMeteringPointOverviewRepository>();
    _mapper = Substitute.For<IMapper>();  // REQUIRED - service needs this
    _service = new NewMeteringPointOverviewService(_repository, _mapper);
}

[Test]
public async Task GetOverviewByStateAsync_ShouldCallMapper_WithCorrectSourceType()
{
    var processStates = new List<ProcessState> { /* ... */ };
    _repository.CreateProcessAsync().Returns(processStates);
    
    // MUST mock mapper - service calls it
    _mapper.Map<IEnumerable<ProcessStateVM>>(Arg.Any<IEnumerable<ProcessState>>())
        .Returns(new List<ProcessStateVM>());
    
    await _service.GetOverviewByStateAsync();
    
    // Verify mapper was called
    _mapper.Received(1).Map<IEnumerable<ProcessStateVM>>(
        Arg.Is<IEnumerable<ProcessState>>(x => x != null));
}
```

**Impact:** All 99 tests include mapper mock setup (~200 lines of mock code)

---

## Why Current Tests Are CORRECT

### The Tests Correctly Mock What The Service Uses

**Principle:** Unit tests should mock external dependencies that the code under test actually uses.

Since the service implementation:
1. Declares `IMapper` as a constructor parameter
2. Calls `mapper.Map<>()` during execution

The tests MUST:
1. Provide an `IMapper` substitute (or service won't instantiate)
2. Mock the `Map<>()` call (or tests will fail with null reference)

**This is proper unit testing practice for legacy code that uses AutoMapper.**

### What Tests Are Actually Testing

**Currently Testing:**
- ✅ Service calls repository.CreateProcessAsync()
- ✅ Service passes repository result to mapper
- ✅ Service returns mapper output unchanged
- ❌ **NOT testing actual mapping logic** (it's mocked!)

**Example of What's Hidden:**
```csharp
// Test says "mapper will return this"
_mapper.Map<IEnumerable<ProcessStateVM>>(...).Returns(fakeViewModels);

// Test passes even if REAL mapping is completely broken!
// Because we never call the real mapper - we use a mock
```

---

## Proposed Refactoring: Remove AutoMapper

### Step 1: Refactor Service Implementation

**New Service Code:**
```csharp
public class NewMeteringPointOverviewService(
    INewMeteringPointOverviewRepository repository) : INewMeteringPointOverviewService
{
    public async Task<IEnumerable<ProcessStateVM>> GetOverviewByStateAsync()
    {
        var processStates = await repository.CreateProcessAsync();
        return MapToViewModels(processStates);  // Call manual mapping
    }
    
    public async Task UpdateStateAsync(int processId, int newState)
    {
        await repository.UpdateStateAsync(processId, newState);
    }
    
    // NEW: Manual mapping method
    private static IEnumerable<ProcessStateVM> MapToViewModels(
        IEnumerable<ProcessState> states)
    {
        return states.Select(state => new ProcessStateVM
        {
            WorkorderId = state.WorkorderId,
            MeteringpointId = state.MeteringpointId,
            MeteringpointNo = state.MeteringpointNo,
            State = state.State,
            CurrentUser = state.CurrentUser,
            LastChanged = state.LastChanged
            // Add all other properties explicitly
        });
    }
}
```

**Changes:**
- ❌ Remove `IMapper` from constructor
- ✅ Add `MapToViewModels()` private method
- ✅ Replace `mapper.Map<>()` with `MapToViewModels()`

### Step 2: Refactor Tests

**New Test Pattern:**
```csharp
[SetUp]
public void SetUp()
{
    _repository = Substitute.For<INewMeteringPointOverviewRepository>();
    // NO MORE: _mapper = Substitute.For<IMapper>();
    
    _service = new NewMeteringPointOverviewService(_repository); // One parameter only
}

[Test]
public async Task GetOverviewByStateAsync_ShouldMapAllProperties_WhenCalled()
{
    // Arrange
    var processStates = new List<ProcessState>
    {
        new ProcessState 
        { 
            WorkorderId = 123, 
            MeteringpointId = "MP-001",
            MeteringpointNo = 1001,
            State = NewMeteringPointProcessStates.Done,
            CurrentUser = "testuser",
            LastChanged = new DateTime(2025, 12, 13)
        }
    };
    _repository.CreateProcessAsync().Returns(processStates);
    
    // NO MORE: _mapper.Map<>().Returns(...)
    
    // Act - Calls REAL mapping logic
    var result = await _service.GetOverviewByStateAsync();
    
    // Assert - Verify ACTUAL mapping happened correctly
    var resultList = result.ToList();
    Assert.Multiple(() =>
    {
        Assert.That(resultList, Has.Count.EqualTo(1));
        Assert.That(resultList[0].WorkorderId, Is.EqualTo(123));
        Assert.That(resultList[0].MeteringpointId, Is.EqualTo("MP-001"));
        Assert.That(resultList[0].MeteringpointNo, Is.EqualTo(1001));
        Assert.That(resultList[0].State, Is.EqualTo(NewMeteringPointProcessStates.Done));
        Assert.That(resultList[0].CurrentUser, Is.EqualTo("testuser"));
        Assert.That(resultList[0].LastChanged, Is.EqualTo(new DateTime(2025, 12, 13)));
    });
}
```

**Changes:**
- ❌ Remove all `_mapper` mock setup code
- ✅ Test verifies actual property mapping
- ✅ Compile-time safety for property names
- ✅ Tests now verify real behavior, not mock behavior

---

## Benefits of Removing AutoMapper

### 1. Compile-Time Safety ✅

**Before (AutoMapper):**
```csharp
// Runtime error if mapping misconfigured
CreateMap<ProcessState, ProcessStateVM>()
    .ForMember(dest => dest.WorkrorderId, opt => opt.MapFrom(src => src.WorkorderId));
    // Typo: "WorkrorderId" - won't compile if explicit, but AutoMapper uses strings!
// Error only found at runtime when mapper executes
```

**After (Manual Mapping):**
```csharp
new ProcessStateVM
{
    WorkrorderId = state.WorkorderId  // Won't compile - property doesn't exist
};
// Compiler catches typos immediately
```

### 2. Simpler Tests ✅

**Before:**
- 99 tests × 2-3 lines of mapper mock setup = ~200 lines
- Must mock return values for every test
- Tests verify mock behavior, not real mapping

**After:**
- 0 mapper mock lines needed
- Tests verify actual mapping logic
- Net reduction: ~150-200 lines of test code

### 3. Better Test Coverage ✅

**Before (Mocking):**
```csharp
// Test verifies mapper was CALLED, not that mapping is CORRECT
_mapper.Map<ProcessStateVM>(...).Returns(fakeVM);
Assert passes even if real AutoMapper profile is completely broken!
```

**After (Real Logic):**
```csharp
// Test verifies actual property values are mapped correctly
var result = service.GetOverviewByStateAsync();
Assert.That(result.WorkorderId, Is.EqualTo(123));  // Tests real mapping
```

### 4. Explicit Mapping Logic ✅

**Before (AutoMapper):**
```csharp
// Mapping configuration hidden somewhere in AutoMapper profile
CreateMap<ProcessState, ProcessStateVM>();
// Where is this? What does it do? Hard to find and understand
```

**After (Manual):**
```csharp
// Crystal clear what maps to what - right in the service
private static ProcessStateVM MapToViewModel(ProcessState state) =>
    new ProcessStateVM
    {
        WorkorderId = state.WorkorderId,        // Explicit
        MeteringpointId = state.MeteringpointId, // Clear
        State = state.State                     // Obvious
    };
```

### 5. AI-Assisted Development ✅

With GitHub Copilot or similar AI tools:
```csharp
// Type this:
private static ProcessStateVM MapToViewModel(ProcessState state) =>
    new ProcessStateVM
    {
        // AI autocompletes all properties instantly from state object
        // No need to configure AutoMapper profiles
```

**Manual mapping is trivial with AI assistance** - same speed as configuring AutoMapper, but with compile-time safety.

### 6. Reduced Dependencies ✅

**Before:**
- NuGet package: AutoMapper
- License management overhead
- Third-party dependency to maintain

**After:**
- No additional packages needed
- Standard C# code
- One less dependency to manage

---

## Test Count Impact Analysis

### Current State (99 tests)

**Region Breakdown:**
1. **Region 1:** Repository Invocation Tests (7 tests)
   - Impact: Remove 2 lines per test (mapper mock setup)
   - Reduction: ~14 lines

2. **Region 2:** AutoMapper Mapping Verification Tests (13 tests)
   - **These change completely:**
   - Before: "Verify mapper called with correct parameters"
   - After: "Verify properties mapped correctly"
   - Example transformation:
     ```csharp
     // BEFORE: Testing mock was called
     [Test]
     public async Task GetOverviewByStateAsync_ShouldCallMapper_WithCorrectSourceType()
     {
         _mapper.Received(1).Map<IEnumerable<ProcessStateVM>>(
             Arg.Is<IEnumerable<ProcessState>>(x => x != null));
     }
     
     // AFTER: Testing actual mapping
     [Test]
     public async Task GetOverviewByStateAsync_ShouldMapWorkorderId_Correctly()
     {
         var result = await _service.GetOverviewByStateAsync();
         Assert.That(result.First().WorkorderId, Is.EqualTo(123));
     }
     ```

3. **Region 3:** Collection Handling Tests (10 tests)
   - Impact: Remove 1 line per test (mapper mock return)
   - Reduction: ~10 lines

4. **Region 4:** Async/Await Pattern Tests (12 tests)
   - Impact: Remove 1-2 lines per test
   - Reduction: ~15 lines

5. **Regions 5-9:** Various other tests (57 tests)
   - Impact: Remove 1-2 lines per test
   - Reduction: ~80 lines

**Total Line Reduction:** ~150-200 lines of mock setup code removed

### New Tests to Add

**Property Mapping Tests (Recommended):**
```csharp
#region Property Mapping Verification Tests

[Test]
public async Task GetOverviewByStateAsync_ShouldMapWorkorderId_Correctly()
{
    var processStates = new List<ProcessState> { new ProcessState { WorkorderId = 999 } };
    _repository.CreateProcessAsync().Returns(processStates);
    
    var result = await _service.GetOverviewByStateAsync();
    
    Assert.That(result.First().WorkorderId, Is.EqualTo(999));
}

[Test]
public async Task GetOverviewByStateAsync_ShouldMapMeteringpointId_Correctly()
{
    var processStates = new List<ProcessState> { new ProcessState { MeteringpointId = "MP-TEST" } };
    _repository.CreateProcessAsync().Returns(processStates);
    
    var result = await _service.GetOverviewByStateAsync();
    
    Assert.That(result.First().MeteringpointId, Is.EqualTo("MP-TEST"));
}

[Test]
public async Task GetOverviewByStateAsync_ShouldMapNullableProperties_Correctly()
{
    var processStates = new List<ProcessState> 
    { 
        new ProcessState { WorkorderId = null, MeteringpointNo = null } 
    };
    _repository.CreateProcessAsync().Returns(processStates);
    
    var result = await _service.GetOverviewByStateAsync();
    
    Assert.Multiple(() =>
    {
        Assert.That(result.First().WorkorderId, Is.Null);
        Assert.That(result.First().MeteringpointNo, Is.Null);
    });
}

#endregion
```

**Recommendation:** Add 5-7 focused property mapping tests to replace the 13 AutoMapper verification tests.

---

## Hansen Technologies Policy Alignment

### Current Policy (from agent instructions)

> **⚠️ AutoMapper Deprecation Notice:**
> Hansen Technologies is moving away from AutoMapper due to:
> - Runtime errors that should be caught at compile time
> - License management concerns (minimizing third-party dependencies)
> - AI-assisted development makes manual mapping trivial
> - Excessive abstraction and ambiguity issues
>
> **Policy for New Work:**
> - ✅ **DO**: Write explicit mapping methods for all new code
> - ❌ **DO NOT**: Add AutoMapper to new projects or new test files
> - ⚠️ **LEGACY ONLY**: Only mock IMapper when testing existing services that already use AutoMapper

### This Refactoring Aligns With Policy ✅

**Current Status:**
- Service uses AutoMapper (legacy)
- Tests correctly mock IMapper (following legacy policy)
- Tests are NOT violating any standards

**After Refactoring:**
- Service uses manual mapping (aligns with new policy)
- Tests verify actual mapping (better quality)
- Removes AutoMapper dependency (policy goal)

---

## Implementation Plan

### Phase 1: Service Refactoring

**Files to Modify:**
1. `NewMeteringPointOverviewService.cs`
   - Remove `IMapper` from constructor
   - Add `MapToViewModels()` private method
   - Replace `mapper.Map<>()` call

**Steps:**
```csharp
// 1. Create mapping method
private static IEnumerable<ProcessStateVM> MapToViewModels(IEnumerable<ProcessState> states)
{
    return states.Select(state => new ProcessStateVM
    {
        WorkorderId = state.WorkorderId,
        MeteringpointId = state.MeteringpointId,
        MeteringpointNo = state.MeteringpointNo,
        State = state.State,
        CurrentUser = state.CurrentUser,
        LastChanged = state.LastChanged
        // Add all remaining properties
    });
}

// 2. Update GetOverviewByStateAsync
public async Task<IEnumerable<ProcessStateVM>> GetOverviewByStateAsync()
{
    var processStates = await repository.CreateProcessAsync();
    return MapToViewModels(processStates);  // Changed from mapper.Map<>()
}

// 3. Remove IMapper from constructor
public NewMeteringPointOverviewService(
    INewMeteringPointOverviewRepository repository)  // Removed IMapper mapper
{
    // Constructor simplified
}
```

### Phase 2: Test Refactoring

**Files to Modify:**
1. `NewMeteringPointOverviewServiceTests.cs`

**Steps:**
1. Update `SetUp()` method - remove `_mapper` initialization
2. Remove all `_mapper.Map<>().Returns()` mock setups
3. Transform Region 2 tests from "verify mapper called" to "verify properties mapped"
4. Add new property mapping verification tests
5. Update remaining tests to verify actual results instead of mock behavior

**Estimated Changes:**
- Lines removed: ~200 (mapper mock setup)
- Lines modified: ~80 (test assertions)
- Lines added: ~50 (new property tests)
- Net reduction: ~130 lines

### Phase 3: Validation

**Testing Checklist:**
- [ ] All 99 tests still pass (or transformed equivalents)
- [ ] Code coverage remains at 100%
- [ ] Service compiles without AutoMapper reference
- [ ] No runtime AutoMapper exceptions
- [ ] Manual code review of all mapping logic

**Run Tests:**
```powershell
cd C:\Users\goran.lovincic\Documents\GitHub\Perigon
dotnet test --filter "FullyQualifiedName~NewMeteringPointOverviewServiceTests" --verbosity normal
```

---

## Risk Assessment

### Low Risk ✅

**Why This Is Safe:**
1. **Single Service:** Only affects NewMeteringPointOverviewService
2. **Clear Mapping:** ProcessState → ProcessStateVM (one-to-one property mapping)
3. **Good Test Coverage:** 99 tests verify behavior before and after
4. **No External Impact:** Service is internal, no API changes
5. **Compile-Time Safety:** Manual mapping catches errors at compile time

### Potential Issues & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missing property in manual mapping | Low | Medium | Add property mapping tests, code review |
| Tests fail after refactoring | Medium | Low | Fix tests incrementally, verify with dotnet test |
| Performance regression | Very Low | Low | Manual mapping is faster than AutoMapper |
| Breaking other services | Very Low | None | This service is standalone |

---

## Alternative: Gradual Migration

If full refactoring seems risky, consider gradual approach:

### Option A: Keep AutoMapper, Add Manual Mapping Tests

```csharp
// Keep service as-is with AutoMapper
// Add tests that verify mapping manually

[Test]
public async Task GetOverviewByStateAsync_ManualVerification_AllPropertiesMapped()
{
    var processStates = new List<ProcessState>
    {
        new ProcessState 
        { 
            WorkorderId = 123,
            MeteringpointId = "MP-001",
            // ... all properties
        }
    };
    _repository.CreateProcessAsync().Returns(processStates);
    
    // Let AutoMapper do its thing
    var mappedVMs = processStates.Select(ps => new ProcessStateVM
    {
        WorkorderId = ps.WorkorderId,
        MeteringpointId = ps.MeteringpointId,
        // ... manual mapping for verification
    }).ToList();
    
    _mapper.Map<IEnumerable<ProcessStateVM>>(Arg.Any<IEnumerable<ProcessState>>())
        .Returns(mappedVMs);
    
    var result = await _service.GetOverviewByStateAsync();
    
    // Verify all properties manually
    Assert.That(result.First().WorkorderId, Is.EqualTo(123));
    // ... verify each property
}
```

**Pros:** No service changes, better test verification  
**Cons:** Still dependent on AutoMapper, doesn't align with policy

### Option B: Create Manual Mapping Method, Keep AutoMapper Temporarily

```csharp
// Add manual mapping method alongside AutoMapper
private static IEnumerable<ProcessStateVM> MapToViewModels(IEnumerable<ProcessState> states)
{
    return states.Select(state => new ProcessStateVM { /* ... */ });
}

// Use feature flag or config to switch
public async Task<IEnumerable<ProcessStateVM>> GetOverviewByStateAsync()
{
    var processStates = await repository.CreateProcessAsync();
    
    #if USE_MANUAL_MAPPING
        return MapToViewModels(processStates);
    #else
        return mapper.Map<IEnumerable<ProcessStateVM>>(processStates);
    #endif
}
```

**Pros:** Can test both approaches, gradual migration  
**Cons:** Code complexity, temporary duplication

---

## Recommendation

### ✅ Recommended Approach: Full Refactoring

**Why:**
1. Service is simple (single mapping operation)
2. Excellent test coverage (99 tests)
3. Aligns with Hansen Technologies policy
4. Removes technical debt immediately
5. Manual mapping is straightforward

**Timeline:**
- Service refactoring: 30 minutes
- Test refactoring: 2-3 hours
- Validation: 1 hour
- **Total: Half day of work**

**Benefits:**
- 150-200 lines of test code removed
- Compile-time safety gained
- Better test quality (testing real mapping vs mocks)
- One less AutoMapper dependency
- Full policy compliance

### When NOT to Refactor

**Keep AutoMapper mocks if:**
- Service is actively being modified by multiple teams (merge conflicts)
- Mapping logic is extremely complex (100+ properties, custom converters)
- No time budget for refactoring (tech debt accepted)
- Team unfamiliar with manual mapping patterns (training needed)

For NewMeteringPointOverviewService: **None of these apply** → Safe to refactor

---

## Conclusion

### Summary

**Question:** Can we avoid AutoMapper in these tests?

**Answer:** 
- **Current tests are CORRECT** - they properly mock the service's AutoMapper dependency
- **Yes, we CAN remove AutoMapper** - but only by refactoring the service first
- **Recommended:** Full refactoring to manual mapping (half-day effort, significant benefits)

### Key Takeaways

1. **Tests Mirror Reality:** Tests correctly mock what the service uses
2. **Service Change Required:** Can't remove AutoMapper from tests without removing it from service
3. **Manual Mapping is Better:** Compile-time safety, simpler tests, better coverage
4. **Low Risk, High Reward:** Simple service with great test coverage = safe refactoring
5. **Policy Aligned:** Removing AutoMapper aligns with Hansen Technologies direction

### Next Steps

If proceeding with refactoring:

1. ✅ Create feature branch: `git checkout -b refactor/remove-automapper-newmeteringpointoverview`
2. ✅ Modify service: Add `MapToViewModels()`, remove `IMapper`
3. ✅ Run tests: Verify which tests fail (expected: mapper verification tests)
4. ✅ Refactor tests: Remove mapper mocks, add property verification
5. ✅ Validate: Ensure all 99 tests pass with actual mapping
6. ✅ Code review: Team review of manual mapping logic
7. ✅ Merge: PR with before/after comparison

**Estimated effort:** 4 hours  
**Benefit:** Permanent removal of AutoMapper dependency, better test quality, policy compliance
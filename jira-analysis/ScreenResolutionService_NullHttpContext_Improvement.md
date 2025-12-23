# JIRA BUG: ScreenResolutionService Throws NullReferenceException on Null HttpContext

## Issue Type
**Bug / Improvement**

## Priority
**Low** (Edge case, unlikely in production)

## Component/Module
- **Module:** Perigon.Modules.MeteringPoint
- **Namespace:** `Perigon.Modules.MeteringPoint.Utils.Services.Meteringpoint360`
- **Class:** `ScreenResolutionService`
- **File:** `src/Perigon.Modules.MeteringPoint/Utils/Services/Meteringpoint360/ScreenResolutionService.cs`

## Summary
ScreenResolutionService throws `NullReferenceException` when `HttpContext` is null instead of handling the error gracefully with a more descriptive exception.

## Description

### Current Behavior
The `ScreenResolutionService` uses the null-forgiving operator (`!`) when accessing `HttpContext.Session`, which causes a `NullReferenceException` if `HttpContext` is null:

```csharp
public class ScreenResolutionService(IHttpContextAccessor ctx) : IScreenResolutionService
{
    private ISession _session => ctx.HttpContext!.Session;  // ❌ Throws NullReferenceException
    
    public ScreenResolution Get()
    {
        var response = _session.GetObject<ScreenResolution>(cacheKey);
        // ...
    }
}
```

### Expected Behavior
The service should provide clear, actionable error messages when used outside the HTTP request pipeline:

**Option 1: Defensive Check with InvalidOperationException**
```csharp
private ISession _session
{
    get
    {
        if (ctx.HttpContext == null)
        {
            throw new InvalidOperationException(
                "ScreenResolutionService requires an active HTTP context. " +
                "Ensure this service is only used within HTTP request pipeline.");
        }
        return ctx.HttpContext.Session;
    }
}
```

**Option 2: Null-Conditional with Fallback**
```csharp
private ISession? _session => ctx.HttpContext?.Session;

public ScreenResolution Get()
{
    if (_session == null)
    {
        // Return default or throw meaningful exception
        return new ScreenResolution { Width = 1600, Height = 900 };
    }
    // ...
}
```

## Steps to Reproduce

1. Create `ScreenResolutionService` instance with `IHttpContextAccessor` where `HttpContext` is null
2. Call any service method (`Get()`, `Set()`, or `GetDevice()`)
3. Observe `NullReferenceException` thrown

**Test Code:**
```csharp
[Test]
public void Edge_404_NullHttpContext_ThrowsNullReferenceException()
{
    // Arrange
    var accessor = Substitute.For<IHttpContextAccessor>();
    accessor.HttpContext.Returns((HttpContext)null);
    var service = new ScreenResolutionService(accessor);

    // Act & Assert - Currently throws NullReferenceException
    Assert.Throws<NullReferenceException>(() => service.Get());
}
```

## Actual Result
```
System.NullReferenceException: Object reference not set to an instance of an object.
   at ScreenResolutionService.get__session()
   at ScreenResolutionService.Get()
```

## Expected Result
```
System.InvalidOperationException: ScreenResolutionService requires an active HTTP context. 
Ensure this service is only used within HTTP request pipeline.
   at ScreenResolutionService.get__session()
   at ScreenResolutionService.Get()
```

## Impact Assessment

### Severity: **Low**
- **Production Likelihood:** Very low - service is dependency-injected in ASP.NET Core pipeline where HttpContext exists
- **User Impact:** None in normal operation
- **Developer Impact:** Poor debugging experience if misconfigured

### Affected Methods
All public methods rely on `_session` property:
- `Get()` → Returns screen resolution from session
- `Set(ScreenResolution)` → Stores screen resolution in session
- `GetDevice()` → Calls `Get()` internally

### Similar Services Affected
This pattern appears in multiple services across the codebase:
- `MinimizedWidgetService` (same module)
- `ScreenResolutionService` in `Perigon.Modules.Inspection` module
- `ScreenResolutionService` in `Perigon.Modules.CustomerCare` module

**Recommendation:** Apply fix consistently across all similar services.

## Root Cause Analysis

### Why This Happens
1. Service uses **primary constructor** syntax: `ScreenResolutionService(IHttpContextAccessor ctx)`
2. Property initializer uses **null-forgiving operator**: `ctx.HttpContext!.Session`
3. Compiler assumes developer guarantees non-null, disables null-safety checks
4. At runtime, if HttpContext is null → `NullReferenceException`

### Design Assumption
Service assumes it will only be called within ASP.NET Core request pipeline where HttpContext is always available. This is valid for production but problematic for:
- Unit tests (without proper mocking)
- Background jobs/services
- Console applications
- Startup/configuration code

## Proposed Solution

### Recommended Approach: Option 1 (InvalidOperationException)

**Advantages:**
- Clear error message explaining the problem
- Fails fast with actionable information
- Consistent with .NET framework patterns
- No behavior change in valid scenarios

### Code Changes Required

#### BEFORE (Current Implementation)
**File:** `src/Perigon.Modules.MeteringPoint/Utils/Services/Meteringpoint360/ScreenResolutionService.cs`

```csharp
using Component.Library.Domains.Interfaces.Common;
using Perigon.Modules.MeteringPoint.Domains.DataTransferObjects.Common;

namespace Perigon.Modules.MeteringPoint.Utils.Services.Meteringpoint360;

public interface IScreenResolutionService
{
    ScreenResolution Get();
    void Set(ScreenResolution resolution);
    DeviceType GetDevice();
}

public class ScreenResolutionService(IHttpContextAccessor ctx) : IScreenResolutionService
{
    // ❌ PROBLEM: This throws NullReferenceException if ctx.HttpContext is null
    private ISession _session => ctx.HttpContext!.Session;

    public const string cacheKey = "ScreenResolution";
    
    public ScreenResolution Get()
    {
        var response = _session.GetObject<ScreenResolution>(cacheKey);
        if (response == null)
        {
            return new ScreenResolution()
            {
                Width = 1600,
                Height = 900
            };
        }
        return response;
    }

    public void Set(ScreenResolution resolution)
    {
        if (resolution != null)
        {
            _session.SetObject(cacheKey, resolution);
        }
    }

    public DeviceType GetDevice()
    {
        var screenResoultion = Get();
        if (screenResoultion.Width.HasValue && screenResoultion.Width.Value >= 1200)
        {
            return DeviceType.Computer;
        }
        return DeviceType.Tablet;
    }
}
```

#### AFTER (Proposed Implementation)
**File:** `src/Perigon.Modules.MeteringPoint/Utils/Services/Meteringpoint360/ScreenResolutionService.cs`

```csharp
using Component.Library.Domains.Interfaces.Common;
using Perigon.Modules.MeteringPoint.Domains.DataTransferObjects.Common;

namespace Perigon.Modules.MeteringPoint.Utils.Services.Meteringpoint360;

public interface IScreenResolutionService
{
    ScreenResolution Get();
    void Set(ScreenResolution resolution);
    DeviceType GetDevice();
}

/// <summary>
/// Manages screen resolution data in HTTP session storage.
/// </summary>
/// <remarks>
/// This service requires an active HTTP context to access session data.
/// Attempting to use this service outside the HTTP request pipeline will throw InvalidOperationException.
/// </remarks>
public class ScreenResolutionService(IHttpContextAccessor ctx) : IScreenResolutionService
{
    // ✅ SOLUTION: Throws clear InvalidOperationException if ctx.HttpContext is null
    private ISession _session
    {
        get
        {
            if (ctx.HttpContext == null)
            {
                throw new InvalidOperationException(
                    "ScreenResolutionService requires an active HTTP context. " +
                    "Ensure this service is only used within HTTP request pipeline.");
            }
            return ctx.HttpContext.Session;
        }
    }

    public const string cacheKey = "ScreenResolution";
    
    public ScreenResolution Get()
    {
        var response = _session.GetObject<ScreenResolution>(cacheKey);
        if (response == null)
        {
            return new ScreenResolution()
            {
                Width = 1600,
                Height = 900
            };
        }
        return response;
    }

    public void Set(ScreenResolution resolution)
    {
        if (resolution != null)
        {
            _session.SetObject(cacheKey, resolution);
        }
    }

    public DeviceType GetDevice()
    {
        var screenResolution = Get();
        if (screenResolution.Width.HasValue && screenResolution.Width.Value >= 1200)
        {
            return DeviceType.Computer;
        }
        return DeviceType.Tablet;
    }
}
```

### Key Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Property** | `private ISession _session => ctx.HttpContext!.Session;` | `private ISession _session { get { /* null check */ } }` |
| **Exception** | `NullReferenceException` (unclear) | `InvalidOperationException` (descriptive) |
| **Message** | "Object reference not set..." | "ScreenResolutionService requires an active HTTP context..." |
| **Documentation** | None | XML comments explaining requirement |

**Updated Test:**
```csharp
[Test]
public void Edge_404_NullHttpContext_ThrowsInvalidOperationException()
{
    // Arrange
    _httpContextAccessor.HttpContext.Returns((HttpContext)null);
    var serviceWithNullContext = new ScreenResolutionService(_httpContextAccessor);

    // Act & Assert
    var ex = Assert.Throws<InvalidOperationException>(() => serviceWithNullContext.Get());
    Assert.That(ex.Message, Does.Contain("requires an active HTTP context"));
}
```

## Testing Requirements

### Unit Tests to Update
- **File:** `tests/Perigon.Modules.MeteringPoint.UnitTests/Utils/Services/Meteringpoint360/ScreenResolutionServiceTests.cs`
- **Test:** `Edge_404_NullHttpContext_ThrowsNullReferenceException`
- **Change:** Update to expect `InvalidOperationException` instead of `NullReferenceException`

### Regression Testing
- Run all existing tests: `dotnet test --filter "FullyQualifiedName~ScreenResolutionServiceTests"`
- Expected: 22 tests passing (no behavior change for valid scenarios)

### Integration Testing
- Verify service works correctly in actual HTTP requests
- Test with Meteringpoint360 controllers that use the service

## Acceptance Criteria

- [ ] Service throws `InvalidOperationException` with descriptive message when HttpContext is null
- [ ] All existing tests pass (no regression)
- [ ] Edge-404 test updated to verify new exception type and message
- [ ] Code review completed
- [ ] Similar services identified and tracked for consistent fix

## Related Services for Consistency

After fixing this service, consider applying the same pattern to:

1. **Perigon.Modules.Inspection**
   - `Utils/Services/Common/ScreenResolutionService.cs`

2. **Perigon.Modules.CustomerCare**
   - `Utils/Services/Home/ScreenResolutionService.cs`

3. **Perigon.Modules.MeteringPoint** (same module)
   - `Utils/Services/Meteringpoint360/MinimizedWidgetService.cs`
   - `Utils/Services/Meteringpoint360/UserWidgetConfigService.cs`
   - Any other session-dependent services

## Documentation Updates

- [ ] Update XML documentation comments on service class
- [ ] Add remarks about HttpContext requirement
- [ ] Update test plan: `TestingWorkspace/test-plans/ScreenResolutionService_TestPlan.md`
  - Change Edge-404 description from "Throws NullReferenceException" to "Throws InvalidOperationException"

## Effort Estimation

- **Development:** 30 minutes
  - Code change: 5 minutes per service
  - Test update: 5 minutes
  - Testing: 10 minutes
  - Code review prep: 10 minutes

- **Testing:** 15 minutes
  - Unit tests: 5 minutes
  - Integration verification: 10 minutes

- **Documentation:** 15 minutes
  - Code comments: 5 minutes
  - Test plan updates: 10 minutes

**Total Estimated Effort:** ~1 hour (for ScreenResolutionService only)

If applying to all similar services: **~3-4 hours**

## Labels/Tags
`code-quality`, `error-handling`, `technical-debt`, `meteringpoint-module`, `unit-tests`

## Environment
- **Version:** Perigon (current development branch)
- **Framework:** .NET 8.0
- **Test Framework:** NUnit 3.14+

## Additional Notes

### Why This Matters
While this is a low-priority edge case, proper error handling:
1. **Improves debugging** - Clear error messages save developer time
2. **Follows best practices** - Matches .NET framework patterns
3. **Prevents confusion** - NullReferenceException is generic and unclear
4. **Documents requirements** - Exception message serves as inline documentation

### Not Recommended
- Returning default values silently (hides configuration errors)
- Logging and continuing (masks the problem)
- Using null-conditional everywhere (adds complexity without clarity)

---

**Created:** December 19, 2024  
**Test Coverage:** Edge-404 in ScreenResolutionServiceTests.cs  
**Test Plan Reference:** TestingWorkspace/test-plans/ScreenResolutionService_TestPlan.md

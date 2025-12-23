# Test Plan: ScreenResolutionService

## Overview
Test plan for `ScreenResolutionService` in the Meteringpoint360 module. This service manages screen resolution data in HTTP session storage and determines device type based on screen width.

**Service Location:** `Perigon.Modules.MeteringPoint.Utils.Services.Meteringpoint360`  
**Dependencies:** `IHttpContextAccessor`, `ISession`  
**Test File:** `Perigon.Modules.MeteringPoint.UnitTests/Utils/Services/Meteringpoint360/ScreenResolutionServiceTests.cs`

## Service Methods

### 1. Get() → ScreenResolution
Returns screen resolution from session. If not found, returns default (1600x900).

### 2. Set(ScreenResolution) → void
Stores screen resolution in session (only if non-null).

### 3. GetDevice() → DeviceType
Returns device type based on screen width:
- Width >= 1200: Computer
- Width < 1200: Tablet

## Test Scenarios

### SR-100 Series: Get() Method Tests

#### SR-101: Get returns stored resolution from session
**Given**: Session contains ScreenResolution { Width = 1920, Height = 1080 }  
**When**: Get() is called  
**Then**: Returns ScreenResolution with Width = 1920, Height = 1080

#### SR-102: Get returns default when session is empty
**Given**: Session does not contain ScreenResolution  
**When**: Get() is called  
**Then**: Returns default ScreenResolution { Width = 1600, Height = 900 }

#### SR-103: Get returns default when session value is null
**Given**: Session.GetObject returns null  
**When**: Get() is called  
**Then**: Returns default ScreenResolution { Width = 1600, Height = 900 }

#### SR-104: Get handles various valid resolutions
**Given**: Session contains different valid resolutions (e.g., 2560x1440, 800x600)  
**When**: Get() is called  
**Then**: Returns stored resolution accurately

### SR-200 Series: Set() Method Tests

#### SR-201: Set stores valid resolution in session
**Given**: Valid ScreenResolution { Width = 1920, Height = 1080 }  
**When**: Set(resolution) is called  
**Then**: Session stores resolution with key "ScreenResolution"

#### SR-202: Set does not store null resolution
**Given**: ScreenResolution is null  
**When**: Set(null) is called  
**Then**: Session.SetObject is not called

#### SR-203: Set handles resolution with nullable values
**Given**: ScreenResolution { Width = 1024, Height = null }  
**When**: Set(resolution) is called  
**Then**: Session stores resolution with Width = 1024, Height = null

#### SR-204: Set handles resolution with both nulls
**Given**: ScreenResolution { Width = null, Height = null }  
**When**: Set(resolution) is called  
**Then**: Session stores resolution with both null values

#### SR-205: Set uses correct cache key
**Given**: Valid ScreenResolution  
**When**: Set(resolution) is called  
**Then**: Session.SetObject called with key "ScreenResolution"

### SR-300 Series: GetDevice() Method Tests

#### SR-301: GetDevice returns Computer for width >= 1200
**Given**: Session contains ScreenResolution { Width = 1920, Height = 1080 }  
**When**: GetDevice() is called  
**Then**: Returns DeviceType.Computer

#### SR-302: GetDevice returns Computer for width exactly 1200
**Given**: Session contains ScreenResolution { Width = 1200, Height = 800 }  
**When**: GetDevice() is called  
**Then**: Returns DeviceType.Computer

#### SR-303: GetDevice returns Tablet for width < 1200
**Given**: Session contains ScreenResolution { Width = 1024, Height = 768 }  
**When**: GetDevice() is called  
**Then**: Returns DeviceType.Tablet

#### SR-304: GetDevice returns Tablet for small width
**Given**: Session contains ScreenResolution { Width = 768, Height = 1024 }  
**When**: GetDevice() is called  
**Then**: Returns DeviceType.Tablet

#### SR-305: GetDevice handles null Width as Tablet
**Given**: Session contains ScreenResolution { Width = null, Height = 900 }  
**When**: GetDevice() is called  
**Then**: Returns DeviceType.Tablet

#### SR-306: GetDevice uses default when session empty
**Given**: Session does not contain ScreenResolution  
**When**: GetDevice() is called  
**Then**: Returns DeviceType.Computer (default Width = 1600)

### SR-400 Series: Integration Tests

#### SR-401: Set then Get returns same resolution
**Given**: Set() called with ScreenResolution { Width = 2560, Height = 1440 }  
**When**: Get() is called  
**Then**: Returns ScreenResolution { Width = 2560, Height = 1440 }

#### SR-402: Set then GetDevice returns correct type
**Given**: Set() called with ScreenResolution { Width = 800, Height = 600 }  
**When**: GetDevice() is called  
**Then**: Returns DeviceType.Tablet

#### SR-403: Multiple Set operations - latest wins
**Given**: Set() called with 1920x1080, then Set() called with 1024x768  
**When**: Get() is called  
**Then**: Returns ScreenResolution { Width = 1024, Height = 768 }

### Edge-400 Series: Edge Cases

#### Edge-401: GetDevice with zero width
**Given**: Session contains ScreenResolution { Width = 0, Height = 900 }  
**When**: GetDevice() is called  
**Then**: Returns DeviceType.Tablet

#### Edge-402: GetDevice with negative width
**Given**: Session contains ScreenResolution { Width = -100, Height = 900 }  
**When**: GetDevice() is called  
**Then**: Returns DeviceType.Tablet

#### Edge-403: Set with large resolution values
**Given**: ScreenResolution { Width = 7680, Height = 4320 } (8K)  
**When**: Set(resolution) is called  
**Then**: Session stores resolution successfully

#### Edge-404: Null HttpContext handling
**Given**: HttpContext is null  
**When**: Any method is called  
**Then**: Throws NullReferenceException (expected behavior - service assumes HttpContext exists)

## Test Coverage Summary

- **Total Test Cases:** 24
- **Get() Tests:** 4 (SR-101 to SR-104)
- **Set() Tests:** 5 (SR-201 to SR-205)
- **GetDevice() Tests:** 6 (SR-301 to SR-306)
- **Integration Tests:** 3 (SR-401 to SR-403)
- **Edge Cases:** 4 (Edge-401 to Edge-404)

## Implementation Notes

### Mock Setup
```csharp
// Session storage dictionary
private Dictionary<string, byte[]> _sessionStorage;

// Mock setup for SetObject
_mockSession.WhenForAnyArgs(x => x.Set(default, default))
    .Do(callInfo => {
        string key = (string)callInfo[0];
        byte[] value = (byte[])callInfo[1];
        _sessionStorage[key] = value;
    });

// Mock setup for GetObject
_mockSession.TryGetValue(default, out Arg.Any<byte[]>())
    .ReturnsForAnyArgs(callInfo => {
        string key = (string)callInfo[0];
        if (_sessionStorage.TryGetValue(key, out var value)) {
            callInfo[1] = value;
            return true;
        }
        callInfo[1] = null;
        return false;
    });
```

### Helper Methods
```csharp
private void SetSessionResolution(ScreenResolution resolution)
{
    var json = JsonConvert.SerializeObject(resolution);
    var bytes = Encoding.UTF8.GetBytes(json);
    _sessionStorage["ScreenResolution"] = bytes;
}

private ScreenResolution GetSessionResolution()
{
    if (_sessionStorage.TryGetValue("ScreenResolution", out var bytes))
    {
        var json = Encoding.UTF8.GetString(bytes);
        return JsonConvert.DeserializeObject<ScreenResolution>(json);
    }
    return null;
}
```

### Key Testing Patterns
1. **Session Object Storage**: Use JSON serialization to byte arrays
2. **Nullable Handling**: Test both HasValue and null scenarios for Width/Height
3. **Default Values**: Verify default resolution (1600x900) returned when session empty
4. **Boundary Testing**: Width = 1200 is critical boundary for device type
5. **Cache Key**: Constant "ScreenResolution" used consistently

## Risk Assessment

**Low Risk:**
- Simple CRUD operations on session
- Well-defined device type logic
- No external dependencies beyond session

**Potential Issues:**
- Null HttpContext not handled gracefully (throws NullReferenceException)
- No validation on resolution values (negative/zero width accepted)

## Dependencies

**NuGet Packages:**
- NUnit 3.14+
- NSubstitute 5.1+
- Newtonsoft.Json (for serialization)

**Types:**
- `ScreenResolution` (DTO with Width/Height nullable ints)
- `DeviceType` enum (Computer, Tablet)
- `IHttpContextAccessor`, `ISession`

---

**Test Plan Version:** 1.0  
**Created:** December 19, 2024  
**Author:** Test Planner Assistant

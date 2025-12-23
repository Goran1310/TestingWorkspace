# MinimizedWidgetService Test Plan

## Service Overview
**Service**: `MinimizedWidgetService`  
**Location**: `Perigon.Modules.MeteringPoint.Utils.Services.Meteringpoint360`  
**Purpose**: Manages widget minimization state in session storage for Meteringpoint360 dashboard widgets

## Dependencies
- `IHttpContextAccessor` - Provides access to HTTP context and session
- `ISession` - Session storage for widget state persistence

## Methods to Test

### 1. ToggleMinimized(string widget)
**Purpose**: Toggles the minimization state of a widget and returns the new state  
**Returns**: `bool` - The new minimization state (true if minimized, false if expanded)

### 2. IsMinimized(string widget)
**Purpose**: Checks if a widget is currently minimized  
**Returns**: `bool` - True if widget is minimized, false otherwise

## Test Cases

### ToggleMinimized Tests (MW-100 series)

#### MW-101: Toggle widget from expanded to minimized
**Given**: Widget is not minimized (returns false from session)  
**When**: ToggleMinimized is called  
**Then**: Returns true and stores true in session with key "360-is-minimized-{widget}"

#### MW-102: Toggle widget from minimized to expanded
**Given**: Widget is minimized (returns true from session)  
**When**: ToggleMinimized is called  
**Then**: Returns false and stores false in session with key "360-is-minimized-{widget}"

#### MW-103: Toggle with widget name in mixed case
**Given**: Widget name is "MeterValues" (mixed case)  
**When**: ToggleMinimized is called  
**Then**: Converts to lowercase "metervalues" for session key "360-is-minimized-metervalues"

#### MW-104: Toggle with widget name in uppercase
**Given**: Widget name is "OVERVIEW"  
**When**: ToggleMinimized is called  
**Then**: Converts to lowercase "overview" for session key "360-is-minimized-overview"

#### MW-105: Toggle handles session exception
**Given**: Session.SetBool throws exception  
**When**: ToggleMinimized is called  
**Then**: Returns computed value (true) - newBool calculated before exception in Set()

#### MW-106: Toggle handles null HttpContext
**Given**: HttpContext is null  
**When**: ToggleMinimized is called  
**Then**: Returns false (NullReferenceException caught)

#### MW-107: Toggle multiple different widgets
**Given**: Multiple widgets exist  
**When**: ToggleMinimized called for "widget1", "widget2", "widget3"  
**Then**: Each widget state is stored independently with correct session keys

#### MW-108: Toggle same widget multiple times
**Given**: Widget starts not minimized  
**When**: ToggleMinimized called 3 times  
**Then**: Returns true, false, true (alternating states)

### IsMinimized Tests (MW-200 series)

#### MW-201: Check widget that is minimized
**Given**: Session contains "360-is-minimized-overview" = true  
**When**: IsMinimized("overview") is called  
**Then**: Returns true

#### MW-202: Check widget that is not minimized
**Given**: Session contains "360-is-minimized-overview" = false  
**When**: IsMinimized("overview") is called  
**Then**: Returns false

#### MW-203: Check widget with no session data
**Given**: Session has no data for widget  
**When**: IsMinimized is called  
**Then**: Returns false (default value)

#### MW-204: Check with widget name case conversion
**Given**: Widget name is "MeterValues" (mixed case)  
**When**: IsMinimized is called  
**Then**: Queries session with lowercase key "360-is-minimized-metervalues"

#### MW-205: Check handles session exception
**Given**: Session.GetBool throws exception  
**When**: IsMinimized is called  
**Then**: Returns false (exception caught)

#### MW-206: Check handles null HttpContext
**Given**: HttpContext is null  
**When**: IsMinimized is called  
**Then**: Returns false (NullReferenceException caught)

#### MW-207: Check multiple widgets independently
**Given**: Session has different states for multiple widgets  
**When**: IsMinimized called for each widget  
**Then**: Returns correct state for each widget

### Integration Tests (MW-300 series)

#### MW-301: Toggle and verify state change
**Given**: Widget is not minimized  
**When**: ToggleMinimized called, then IsMinimized called  
**Then**: IsMinimized returns the same value as ToggleMinimized returned

#### MW-302: Multiple toggle-check cycles
**Given**: Widget in any state  
**When**: Alternate ToggleMinimized and IsMinimized calls  
**Then**: IsMinimized always reflects the last ToggleMinimized result

#### MW-303: Session key format validation
**Given**: Widget name "TestWidget"  
**When**: ToggleMinimized called  
**Then**: Session key is exactly "360-is-minimized-testwidget" (lowercase)

## Edge Cases

### Edge-301: Empty string widget name
**Test**: Pass empty string "" as widget name  
**Expected**: Creates session key "360-is-minimized-" (empty widget name)

### Edge-302: Null widget name
**Test**: Pass null as widget name  
**Expected**: Should throw exception or handle gracefully (catches and returns false)

### Edge-303: Widget name with special characters
**Test**: Pass "widget-123_test" as widget name  
**Expected**: Converts to lowercase "widget-123_test" for session key

### Edge-304: Very long widget name
**Test**: Pass 500-character widget name  
**Expected**: Creates session key with full name converted to lowercase

## Mock Setup Requirements

### IHttpContextAccessor Mock
```csharp
var mockHttpContextAccessor = Substitute.For<IHttpContextAccessor>();
var mockHttpContext = Substitute.For<HttpContext>();
var mockSession = Substitute.For<ISession>();

mockHttpContextAccessor.HttpContext.Returns(mockHttpContext);
mockHttpContext.Session.Returns(mockSession);
```

### Session GetBool/SetBool Mocking
```csharp
// Track session state in dictionary
var sessionStorage = new Dictionary<string, bool>();

mockSession.SetBool(Arg.Any<string>(), Arg.Any<bool>())
    .Returns(x => { 
        sessionStorage[(string)x[0]] = (bool)x[1]; 
        return null; 
    });

mockSession.GetBool(Arg.Any<string>())
    .Returns(x => sessionStorage.ContainsKey((string)x[0]) 
        ? sessionStorage[(string)x[0]] 
        : false);
```

## Test Metrics
- **Total Test Cases**: 23
- **ToggleMinimized Tests**: 8
- **IsMinimized Tests**: 7
- **Integration Tests**: 3
- **Edge Cases**: 4
- **Code Coverage Target**: 100% (simple service, all paths should be covered)

## Notes
- Service uses exception handling to return false on any error
- Widget names are always converted to lowercase for consistency
- Session keys follow format: "360-is-minimized-{lowercaseWidgetName}"
- No database dependencies - purely session-based
- Primary use case: Dashboard widget collapse/expand state persistence

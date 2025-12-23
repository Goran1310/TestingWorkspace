# Test Plan: HanportUserDataService

## Executive Summary

**Service:** `HanportUserDataService`  
**Namespace:** `Perigon.Modules.MeteringPoint.Utils.Services.HanportProcess`  
**Complexity:** Medium  
**Test Count:** 12 tests  
**Estimated Effort:** 2-3 hours  
**Priority:** Medium

### Purpose
User data persistence service for storing and retrieving HanportOverviewSettings in user-specific storage. Handles JSON serialization/deserialization with error recovery.

---

## Service Architecture

### Interface
```csharp
public interface IHanportUserDataService
{
    Task<HanportUserData> GetAsync();
    Task<bool> PutAsync(HanportUserData userData);
}
```

### Dependencies
1. **IUserDataRepository** - Persistent storage access
2. **IActionContextAccessor** - Access to HTTP context for username extraction
3. **ILogger<HanportUserDataService>** - Error logging

### Key Features
- **Username extraction** from claims (InternalClaimTypes.Username)
- **JSON serialization** with ObjectCreationHandling.Replace
- **Error handling** with graceful fallback to default values
- **Constant key**: "hanport-user-data"

### Data Models
```csharp
public class HanportUserData
{
    public HanportOverviewSettings HanportOverviewSettings { get; set; }
}

public class HanportOverviewSettings
{
    public string HanportOverview { get; set; } = "hanport-overview-progress";
}
```

---

## Test Scenarios

### GetAsync Method (7 tests)

#### 1. GetAsync_ShouldReturnUserData_WhenDataExists
**Priority:** High  
**Type:** Positive  
**Description:** Verify successful retrieval and deserialization of existing user data.

**Arrange:**
- Mock username claim: "testuser"
- Mock repository returns UserData with JSON: `{"HanportOverviewSettings":{"HanportOverview":"custom-value"}}`

**Act:** Call GetAsync()

**Assert:**
- Result is not null
- HanportOverviewSettings is not null
- HanportOverview equals "custom-value"
- Repository.GetUserData called once with correct username and key

---

#### 2. GetAsync_ShouldReturnDefaultData_WhenRepositoryReturnsNull
**Priority:** High  
**Type:** Edge Case  
**Description:** Verify service returns default HanportUserData when repository returns null.

**Arrange:**
- Mock username claim: "testuser"
- Mock repository returns null

**Act:** Call GetAsync()

**Assert:**
- Result is not null
- HanportOverviewSettings is not null
- HanportOverview equals default "hanport-overview-progress"
- No deserialization attempted

---

#### 3. GetAsync_ShouldReturnDefaultData_WhenValueIsEmpty
**Priority:** High  
**Type:** Edge Case  
**Description:** Verify service returns default data when UserData.Value is empty string.

**Arrange:**
- Mock username claim: "testuser"
- Mock repository returns UserData with Value = ""

**Act:** Call GetAsync()

**Assert:**
- Result is not null
- HanportOverviewSettings has default values
- Repository called once

---

#### 4. GetAsync_ShouldReturnDefaultData_WhenJsonDeserializationFails
**Priority:** High  
**Type:** Negative  
**Description:** Verify graceful fallback when JSON is malformed.

**Arrange:**
- Mock username claim: "testuser"
- Mock repository returns UserData with invalid JSON: "invalid json {{"

**Act:** Call GetAsync()

**Assert:**
- Result is not null (default HanportUserData)
- HanportOverviewSettings has default values
- Logger.LogError called once with exception details

---

#### 5. GetAsync_ShouldExtractUsername_FromClaims
**Priority:** High  
**Type:** Positive  
**Description:** Verify correct username extraction from HTTP context claims.

**Arrange:**
- Mock ActionContext with User.Claims containing InternalClaimTypes.Username = "john.doe"
- Mock repository returns empty data

**Act:** Call GetAsync()

**Assert:**
- Repository.GetUserData called with username "john.doe"
- Repository.GetUserData called with key "hanport-user-data"

---

#### 6. GetAsync_ShouldUseCorrectJsonSettings
**Priority:** Medium  
**Type:** Positive  
**Description:** Verify JSON deserialization uses ObjectCreationHandling.Replace.

**Arrange:**
- Mock repository returns valid JSON with nested settings

**Act:** Call GetAsync()

**Assert:**
- Deserialization successful
- Settings object properly initialized (not merged)

---

#### 7. GetAsync_ShouldHandleNullOrMissingUsernameClaim
**Priority:** Medium  
**Type:** Negative  
**Description:** Verify behavior when username claim is missing (should throw NullReferenceException).

**Arrange:**
- Mock ActionContext with User.Claims NOT containing InternalClaimTypes.Username

**Act & Assert:**
- Expect NullReferenceException when calling GetAsync()

---

### PutAsync Method (5 tests)

#### 8. PutAsync_ShouldReturnTrue_WhenUpdateSucceeds
**Priority:** High  
**Type:** Positive  
**Description:** Verify successful user data persistence.

**Arrange:**
- Mock username claim: "testuser"
- Mock HanportUserData with custom HanportOverview value
- Mock repository.UpdateUserData returns true

**Act:** Call PutAsync(userData)

**Assert:**
- Result is true
- Repository.UpdateUserData called once with correct username, key, and serialized JSON
- JSON serialization includes all properties

---

#### 9. PutAsync_ShouldSerializeCorrectly
**Priority:** High  
**Type:** Positive  
**Description:** Verify HanportUserData is correctly serialized to JSON.

**Arrange:**
- Mock username claim: "testuser"
- Create HanportUserData with HanportOverview = "test-value"
- Mock repository.UpdateUserData returns true

**Act:** Call PutAsync(userData)

**Assert:**
- Repository.UpdateUserData called with JSON string containing "test-value"
- JSON is valid and deserializable

---

#### 10. PutAsync_ShouldReturnFalse_WhenSerializationFails
**Priority:** High  
**Type:** Negative  
**Description:** Verify graceful failure when JSON serialization throws exception.

**Arrange:**
- Mock username claim: "testuser"
- Mock JsonConvert.SerializeObject to throw exception (via test-specific setup if needed)
- Otherwise, test repository exception scenario

**Act:** Call PutAsync(userData)

**Assert:**
- Result is false
- Exception caught and handled
- Repository not called (if serialization fails before call)

---

#### 11. PutAsync_ShouldReturnFalse_WhenRepositoryFails
**Priority:** High  
**Type:** Negative  
**Description:** Verify false returned when repository update fails.

**Arrange:**
- Mock username claim: "testuser"
- Mock repository.UpdateUserData returns false

**Act:** Call PutAsync(userData)

**Assert:**
- Result is false
- Repository called with correct parameters

---

#### 12. PutAsync_ShouldExtractUsername_FromClaims
**Priority:** Medium  
**Type:** Positive  
**Description:** Verify correct username extraction in PUT operation.

**Arrange:**
- Mock ActionContext with User.Claims containing InternalClaimTypes.Username = "jane.smith"
- Mock repository returns true

**Act:** Call PutAsync(userData)

**Assert:**
- Repository.UpdateUserData called with username "jane.smith"
- Repository.UpdateUserData called with key "hanport-user-data"

---

## Technical Implementation Notes

### Mocking Strategy

**IActionContextAccessor Setup:**
```csharp
private IActionContextAccessor _ctx;
private IUserDataRepository _repository;
private ILogger<HanportUserDataService> _logger;
private HanportUserDataService _service;

[SetUp]
public void SetUp()
{
    _ctx = Substitute.For<IActionContextAccessor>();
    _repository = Substitute.For<IUserDataRepository>();
    _logger = Substitute.For<ILogger<HanportUserDataService>>();
    
    // Setup ActionContext with default claims
    var actionContext = new ActionContext
    {
        HttpContext = new DefaultHttpContext()
    };
    
    var claims = new List<Claim>
    {
        new Claim(InternalClaimTypes.Username, "testuser")
    };
    
    actionContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims));
    _ctx.ActionContext.Returns(actionContext);
    
    _service = new HanportUserDataService(_repository, _ctx, _logger);
}
```

**Repository Mock Patterns:**
```csharp
// Return existing data
var userData = new UserData 
{ 
    Value = JsonConvert.SerializeObject(new HanportUserData { ... }) 
};
_repository.GetUserData("testuser", "hanport-user-data").Returns(userData);

// Return null (no data)
_repository.GetUserData(Arg.Any<string>(), Arg.Any<string>()).Returns((UserData)null);

// Successful update
_repository.UpdateUserData(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>())
    .Returns(true);
```

**Logger Verification:**
```csharp
// Verify error was logged
_logger.Received(1).LogError(
    Arg.Any<Exception>(), 
    "Unable to get user data");
```

### Test Data Setup

**Valid HanportUserData JSON:**
```json
{
  "HanportOverviewSettings": {
    "HanportOverview": "custom-value"
  }
}
```

**Invalid JSON for error testing:**
```csharp
"invalid json {{"
"{broken"
"null"
```

### Claims Setup Helper

```csharp
private void SetupUsernameClaim(string username)
{
    var actionContext = new ActionContext
    {
        HttpContext = new DefaultHttpContext()
    };
    
    var claims = new List<Claim>
    {
        new Claim(InternalClaimTypes.Username, username)
    };
    
    actionContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims));
    _ctx.ActionContext.Returns(actionContext);
}

private void SetupMissingUsernameClaim()
{
    var actionContext = new ActionContext
    {
        HttpContext = new DefaultHttpContext()
    };
    
    // No claims added
    actionContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity());
    _ctx.ActionContext.Returns(actionContext);
}
```

---

## Risk Assessment

### High Risk Areas
1. **NullReferenceException on missing username claim** - Service uses `!.Value` assuming claim exists
2. **JSON deserialization failures** - Malformed JSON should be caught and logged
3. **ActionContext null reference** - Service accesses `ctx.ActionContext!.HttpContext` without null check

### Medium Risk Areas
1. **Repository null returns** - Service handles gracefully with default values
2. **Serialization exceptions** - Caught in try-catch, returns false

### Mitigation Strategies
1. **Test missing claims scenario** - Verify NullReferenceException is thrown
2. **Test malformed JSON** - Verify graceful fallback to defaults
3. **Test null repository returns** - Verify default object creation
4. **Verify logging** - Ensure errors are logged for debugging

---

## Code Coverage Goals

### Target Metrics
- **Line Coverage:** 100%
- **Branch Coverage:** 100%
- **Method Coverage:** 100%

### Coverage Breakdown
- `GetAsync()`: 7 tests covering all branches (null checks, deserialization success/failure)
- `PutAsync()`: 5 tests covering serialization, repository success/failure, username extraction

---

## Test Execution Plan

### Phase 1: GetAsync Tests (4-5 tests)
1. Implement happy path test
2. Add null/empty value tests
3. Add deserialization failure test
4. Add username extraction test
5. Run and verify

### Phase 2: PutAsync Tests (4-5 tests)
1. Implement successful update test
2. Add serialization verification test
3. Add repository failure test
4. Add username extraction test
5. Run and verify

### Phase 3: Edge Cases (2-3 tests)
1. Missing username claim test
2. JSON settings verification
3. Final validation run

---

## Dependencies and Setup Requirements

### Required NuGet Packages
- NUnit 3.14.0 (centrally managed)
- NSubstitute 5.1.0 (centrally managed)
- Microsoft.AspNetCore.Mvc.Core (for ActionContext)
- System.Security.Claims (for ClaimsPrincipal)
- Newtonsoft.Json (for JSON operations)

### Required Using Statements
```csharp
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using NSubstitute;
using NUnit.Framework;
using Component.Library.Domains.Interfaces.Common;
using Component.Library.Parts.Utility;
```

---

## Recommended Improvements (Post-Testing)

1. **Null safety**: Add null checks for ActionContext before accessing HttpContext
2. **Defensive coding**: Validate username claim exists before accessing `.Value`
3. **Input validation**: Validate userData parameter in PutAsync
4. **Logging enhancement**: Log successful operations for audit trail
5. **Return value semantics**: PutAsync returns bool but doesn't indicate why it failed
6. **Configuration**: Move "hanport-user-data" key to configuration/constants class

---

## Test Class Template

```csharp
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Component.Library.Domains.Interfaces.Common;
using Component.Library.Parts.Utility;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using NSubstitute;
using NUnit.Framework;
using Perigon.Modules.MeteringPoint.Utils.Services.HanportProcess;

namespace Perigon.Modules.MeteringPoint.UnitTests.Utils.Services.HanportProcess;

/// <summary>
/// Test Suite: HanportUserDataService
/// 
/// Coverage Target: 100% (Line, Branch, Method)
/// Total Tests: 12
/// 
/// Service Under Test: User data persistence for HanportOverviewSettings
/// 
/// Test Coverage:
/// - GetAsync: User data retrieval and deserialization (7 tests)
/// - PutAsync: User data persistence and serialization (5 tests)
/// 
/// Notes:
/// - Uses ActionContextAccessor for username extraction from claims
/// - JSON serialization with ObjectCreationHandling.Replace
/// - Graceful error handling with default value fallback
/// - No hardcoded file paths (portable design)
/// </summary>
[TestFixture]
[TestOf(typeof(HanportUserDataService))]
[Category("UnitTests")]
[Category("HanportProcess")]
[Category("HanportUserDataService")]
public class HanportUserDataServiceTests
{
    private IActionContextAccessor _ctx;
    private IUserDataRepository _repository;
    private ILogger<HanportUserDataService> _logger;
    private HanportUserDataService _service;

    [SetUp]
    public void SetUp()
    {
        _ctx = Substitute.For<IActionContextAccessor>();
        _repository = Substitute.For<IUserDataRepository>();
        _logger = Substitute.For<ILogger<HanportUserDataService>>();
        
        SetupUsernameClaim("testuser");
        
        _service = new HanportUserDataService(_repository, _ctx, _logger);
    }

    private void SetupUsernameClaim(string username)
    {
        var actionContext = new ActionContext
        {
            HttpContext = new DefaultHttpContext()
        };
        
        var claims = new List<Claim>
        {
            new Claim(InternalClaimTypes.Username, username)
        };
        
        actionContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims));
        _ctx.ActionContext.Returns(actionContext);
    }

    #region GetAsync Tests

    [Test]
    public async Task GetAsync_ShouldReturnUserData_WhenDataExists()
    {
        // Arrange
        // Act
        // Assert
    }

    [Test]
    public async Task GetAsync_ShouldReturnDefaultData_WhenRepositoryReturnsNull()
    {
        // Arrange
        // Act
        // Assert
    }

    [Test]
    public async Task GetAsync_ShouldReturnDefaultData_WhenValueIsEmpty()
    {
        // Arrange
        // Act
        // Assert
    }

    [Test]
    public async Task GetAsync_ShouldReturnDefaultData_WhenJsonDeserializationFails()
    {
        // Arrange
        // Act
        // Assert
    }

    [Test]
    public async Task GetAsync_ShouldExtractUsername_FromClaims()
    {
        // Arrange
        // Act
        // Assert
    }

    [Test]
    public async Task GetAsync_ShouldUseCorrectJsonSettings()
    {
        // Arrange
        // Act
        // Assert
    }

    [Test]
    public void GetAsync_ShouldThrowException_WhenUsernameClaimMissing()
    {
        // Arrange
        // Act & Assert
    }

    #endregion

    #region PutAsync Tests

    [Test]
    public async Task PutAsync_ShouldReturnTrue_WhenUpdateSucceeds()
    {
        // Arrange
        // Act
        // Assert
    }

    [Test]
    public async Task PutAsync_ShouldSerializeCorrectly()
    {
        // Arrange
        // Act
        // Assert
    }

    [Test]
    public async Task PutAsync_ShouldReturnFalse_WhenRepositoryFails()
    {
        // Arrange
        // Act
        // Assert
    }

    [Test]
    public async Task PutAsync_ShouldReturnFalse_WhenSerializationThrowsException()
    {
        // Arrange
        // Act
        // Assert
    }

    [Test]
    public async Task PutAsync_ShouldExtractUsername_FromClaims()
    {
        // Arrange
        // Act
        // Assert
    }

    #endregion
}
```

---

## Success Criteria

- ✅ All 12 tests passing
- ✅ 100% code coverage (line, branch, method)
- ✅ All error paths tested
- ✅ All success paths tested
- ✅ Username extraction verified
- ✅ JSON serialization/deserialization verified
- ✅ Logger verification implemented
- ✅ No hardcoded file paths
- ✅ Clean test execution (< 5 seconds total)

---

**Test Plan Version:** 1.0  
**Created:** December 17, 2025  
**Service Complexity:** Medium (2 methods, 3 dependencies, JSON operations, claims handling)  
**Estimated Implementation Time:** 2-3 hours

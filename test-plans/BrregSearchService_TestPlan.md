# Test Plan: BrregSearchService

**Service:** `Perigon.Modules.MeteringPoint.Utils.Services.BrregSearchService`  
**Test File:** `Perigon.Modules.MeteringPoint.UnitTests.Utils.Services.Common.BrregSearchServiceTests`  
**Created:** December 15, 2025  
**Author:** Test Planner Assistant  

---

## Executive Summary

This test plan covers comprehensive unit testing for `BrregSearchService`, which integrates with the Norwegian Brønnøysund Register Centre (Brreg) API to retrieve company information and map external business codes (naeringskode) to internal business codes.

### Service Overview

**Purpose:** Search for Norwegian companies in Brreg registry and map their business codes  
**External Dependencies:** 
- Brreg API (https://data.brreg.no/enhetsregisteret/api/enheter/)
- `IPtabRepository` for business code lookup
- `IMapper` for AutoMapper (⚠️ **legacy - should be refactored**)

**Key Methods:**
1. `Search(string foretaksnummer)` - Retrieves company data from Brreg API
2. `GetBusinessCode(string foretaksnummer)` - Retrieves and maps business code

---

## Service Architecture Analysis

### Dependencies
```csharp
public BrregSearchService(
    IMapper mapper,              // ⚠️ Legacy AutoMapper - to be removed
    IPtabRepository ptabRepository
)
```

### Key Issues Identified
1. ⚠️ **AutoMapper Usage** - Service uses AutoMapper (Hansen policy violation)
2. ⚠️ **HttpClient Instantiation** - Creates new HttpClient in constructor (anti-pattern - should use IHttpClientFactory)
3. ⚠️ **Hard-coded API URL** - Base address hard-coded in constructor
4. ⚠️ **Poor Error Handling** - Generic "Bad search" exception message
5. ⚠️ **No Retry/Resilience** - No handling for network failures or API timeouts
6. ⚠️ **No Logging** - No logging for debugging or monitoring

### DTOs
```csharp
public class BrregSearchResponse
{
    public string Organisasjonsnummer { get; set; }
    public string Navn { get; set; }
    public Naeringskode Naeringskode { get; set; }
}

public class Naeringskode
{
    public string Beskrivelse { get; set; }
    public string Kode { get; set; }
}

public class BusinessCodes
{
    public int? BusinessCodeNo { get; set; }
    public string BusinessCodeName { get; set; }
    public string BusinessCodeExternal { get; set; }
}
```

---

## Test Strategy

### Approach
- **Unit Tests Only** - Mock HttpClient, IPtabRepository, IMapper
- **No Integration Tests** - External API calls should be mocked
- **NUnit + NSubstitute** - Standard Hansen pattern
- **AutoMapper Handling** - Mock IMapper for now (mark for refactoring)

### Test Coverage Goals
- ✅ All public methods (Search, GetBusinessCode)
- ✅ Success scenarios with valid company numbers
- ✅ Null/empty input validation
- ✅ HTTP error responses (404, 500, timeout)
- ✅ JSON deserialization edge cases
- ✅ Business code mapping logic
- ✅ Null handling in Naeringskode data

---

## Test Plan by Region

### Region 1: Search() - Successful API Calls (10 tests)

**Test Cases:**

| ID | Test Name | Priority | Description |
|----|-----------|----------|-------------|
| TC-Brreg-Search-01 | `Search_ShouldReturnBrregResponse_WhenValidForetaksnummerProvided` | High | Valid company number returns complete response |
| TC-Brreg-Search-02 | `Search_ShouldCallBrregApi_WithCorrectUrl` | High | Verify correct API endpoint construction |
| TC-Brreg-Search-03 | `Search_ShouldDeserializeJson_IntoCorrectDto` | High | JSON parsing produces valid BrregSearchResponse |
| TC-Brreg-Search-04 | `Search_ShouldHandleNorwegianCharacters_InCompanyName` | Medium | Names with æ, ø, å are handled correctly |
| TC-Brreg-Search-05 | `Search_ShouldReturnOrganisasjonsnummer_MatchingInput` | Medium | Response org number matches request |
| TC-Brreg-Search-06 | `Search_ShouldParseNaeringskode_WhenPresent` | High | Naeringskode object correctly populated |
| TC-Brreg-Search-07 | `Search_ShouldHandleMultipleCallsSequentially_Successfully` | Medium | Multiple searches work independently |
| TC-Brreg-Search-08 | `Search_ShouldReturnResponse_WithAllProperties` | Medium | All DTO properties populated |
| TC-Brreg-Search-09 | `Search_ShouldHandleWhitespace_InForetaksnummer` | Low | Trim/normalize input handling |
| TC-Brreg-Search-10 | `Search_ShouldUseHttpGet_NotPost` | Low | Verify HTTP method is GET |

**Example Test:**
```csharp
[Test]
[Description("Verify Search returns valid BrregSearchResponse for valid company number")]
[Property("Priority", "High")]
[Property("TestCaseId", "TC-Brreg-Search-01")]
public async Task Search_ShouldReturnBrregResponse_WhenValidForetaksnummerProvided()
{
    // Arrange
    var foretaksnummer = "123456789";
    var expectedResponse = new BrregSearchResponse
    {
        Organisasjonsnummer = "123456789",
        Navn = "Test AS",
        Naeringskode = new Naeringskode
        {
            Kode = "62.010",
            Beskrivelse = "Programmeringstjenester"
        }
    };
    
    var httpMessageHandler = new MockHttpMessageHandler(
        HttpStatusCode.OK,
        JsonConvert.SerializeObject(expectedResponse));
    var httpClient = new HttpClient(httpMessageHandler)
    {
        BaseAddress = new Uri("https://data.brreg.no/enhetsregisteret/api/enheter/")
    };
    
    // Inject mocked HttpClient via reflection or refactor service
    // (Service needs refactoring to accept IHttpClientFactory)
    
    // Act
    var result = await _service.Search(foretaksnummer);
    
    // Assert
    Assert.Multiple(() =>
    {
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Organisasjonsnummer, Is.EqualTo("123456789"));
        Assert.That(result.Navn, Is.EqualTo("Test AS"));
        Assert.That(result.Naeringskode, Is.Not.Null);
        Assert.That(result.Naeringskode.Kode, Is.EqualTo("62.010"));
    });
}
```

---

### Region 2: Search() - Error Handling (12 tests)

**Test Cases:**

| ID | Test Name | Priority | Description |
|----|-----------|----------|-------------|
| TC-Brreg-Error-01 | `Search_ShouldThrowException_WhenApiReturns404` | High | Company not found throws exception |
| TC-Brreg-Error-02 | `Search_ShouldThrowException_WhenApiReturns500` | High | Server error propagates exception |
| TC-Brreg-Error-03 | `Search_ShouldThrowException_WhenApiReturns400` | High | Bad request throws exception |
| TC-Brreg-Error-04 | `Search_ShouldThrowException_WithMessage_WhenNotSuccessful` | High | Exception contains "Bad search" message |
| TC-Brreg-Error-05 | `Search_ShouldThrowException_WhenNetworkTimeout` | High | Timeout exception propagated |
| TC-Brreg-Error-06 | `Search_ShouldThrowException_WhenNoInternetConnection` | Medium | Network unavailable handled |
| TC-Brreg-Error-07 | `Search_ShouldThrowException_WhenInvalidJson` | High | Malformed JSON throws JsonException |
| TC-Brreg-Error-08 | `Search_ShouldThrowException_WhenEmptyResponse` | Medium | Empty response body handled |
| TC-Brreg-Error-09 | `Search_ShouldThrowException_WhenNullResponse` | Medium | Null HTTP response handled |
| TC-Brreg-Error-10 | `Search_ShouldHandleApiRedirect_Appropriately` | Low | 3xx redirects followed or rejected |
| TC-Brreg-Error-11 | `Search_ShouldPropagateHttpRequestException_WhenDnsFailure` | Medium | DNS resolution failure handled |
| TC-Brreg-Error-12 | `Search_ShouldThrowException_WhenApiReturns401` | Low | Unauthorized (if API requires auth) |

**Example Test:**
```csharp
[Test]
[Description("Verify Search throws exception when API returns 404 Not Found")]
[Property("Priority", "High")]
[Property("TestCaseId", "TC-Brreg-Error-01")]
public void Search_ShouldThrowException_WhenApiReturns404()
{
    // Arrange
    var foretaksnummer = "999999999";
    var httpMessageHandler = new MockHttpMessageHandler(
        HttpStatusCode.NotFound,
        "{}");
    
    // Act & Assert
    var ex = Assert.ThrowsAsync<Exception>(
        async () => await _service.Search(foretaksnummer));
    
    Assert.That(ex.Message, Does.Contain("Bad search"));
}
```

---

### Region 3: Search() - Input Validation (8 tests)

**Test Cases:**

| ID | Test Name | Priority | Description |
|----|-----------|----------|-------------|
| TC-Brreg-Input-01 | `Search_ShouldThrowException_WhenForetaksnummerIsNull` | High | Null input validation |
| TC-Brreg-Input-02 | `Search_ShouldThrowException_WhenForetaksnummerIsEmpty` | High | Empty string validation |
| TC-Brreg-Input-03 | `Search_ShouldHandleWhitespaceForetaksnummer_Gracefully` | Medium | Whitespace-only input |
| TC-Brreg-Input-04 | `Search_ShouldAccept9DigitForetaksnummer_Successfully` | High | Standard 9-digit org number |
| TC-Brreg-Input-05 | `Search_ShouldHandleForetaksnummerWithSpaces_IfValid` | Medium | "123 456 789" format |
| TC-Brreg-Input-06 | `Search_ShouldHandleLeadingZeros_InForetaksnummer` | Medium | "012345678" treated correctly |
| TC-Brreg-Input-07 | `Search_ShouldAcceptAlphanumeric_IfApiSupports` | Low | Non-numeric characters (rare) |
| TC-Brreg-Input-08 | `Search_ShouldHandleVeryLongString_WithoutCrashing` | Low | Boundary test for string length |

---

### Region 4: Search() - Response Parsing (10 tests)

**Test Cases:**

| ID | Test Name | Priority | Description |
|----|-----------|----------|-------------|
| TC-Brreg-Parse-01 | `Search_ShouldParseOrganisasjonsnummer_Correctly` | High | Org number extracted from JSON |
| TC-Brreg-Parse-02 | `Search_ShouldParseNavn_WithSpecialCharacters` | High | Company names with special chars |
| TC-Brreg-Parse-03 | `Search_ShouldParseNaeringskode_WhenPresent` | High | Naeringskode object populated |
| TC-Brreg-Parse-04 | `Search_ShouldHandleNullNaeringskode_InResponse` | High | Missing naeringskode handled |
| TC-Brreg-Parse-05 | `Search_ShouldHandlePartialNaeringskode_Data` | Medium | Only Kode or Beskrivelse present |
| TC-Brreg-Parse-06 | `Search_ShouldIgnoreExtraJsonFields_Gracefully` | Medium | Unknown JSON properties ignored |
| TC-Brreg-Parse-07 | `Search_ShouldHandleEmptyNavn_InResponse` | Medium | Empty company name string |
| TC-Brreg-Parse-08 | `Search_ShouldDeserializeNestedJsonProperly_Always` | High | Nested object structure verified |
| TC-Brreg-Parse-09 | `Search_ShouldHandleNullJsonValues_Appropriately` | Medium | Null values in JSON fields |
| TC-Brreg-Parse-10 | `Search_ShouldPreserveCasing_InStringProperties` | Low | Case sensitivity of strings |

---

### Region 5: GetBusinessCode() - Successful Mapping (12 tests)

**Test Cases:**

| ID | Test Name | Priority | Description |
|----|-----------|----------|-------------|
| TC-Brreg-BC-01 | `GetBusinessCode_ShouldReturnBusinessCode_WhenMatchFound` | High | Valid code mapping succeeds |
| TC-Brreg-BC-02 | `GetBusinessCode_ShouldCallSearch_WithForetaksnummer` | High | Search method invoked correctly |
| TC-Brreg-BC-03 | `GetBusinessCode_ShouldCallPtabRepository_GetBusinessCodes` | High | Repository called for code lookup |
| TC-Brreg-BC-04 | `GetBusinessCode_ShouldMatchExternalCode_ToBrregCode` | High | BusinessCodeExternal matches Kode |
| TC-Brreg-BC-05 | `GetBusinessCode_ShouldReturnFirstMatch_WhenMultipleExist` | Medium | FirstOrDefault behavior verified |
| TC-Brreg-BC-06 | `GetBusinessCode_ShouldReturnBusinessCodeNo_WhenMapped` | Medium | Complete BusinessCodes DTO returned |
| TC-Brreg-BC-07 | `GetBusinessCode_ShouldReturnBusinessCodeName_WhenMapped` | Medium | Name property populated |
| TC-Brreg-BC-08 | `GetBusinessCode_ShouldHandleCaseInsensitiveMatch_IfNeeded` | Low | Case sensitivity in code matching |
| TC-Brreg-BC-09 | `GetBusinessCode_ShouldNotModifyRepository_Data` | Medium | Read-only repository access |
| TC-Brreg-BC-10 | `GetBusinessCode_ShouldWorkWithMultipleCodeFormats_Successfully` | Medium | Various code formats (62.010, 62010) |
| TC-Brreg-BC-11 | `GetBusinessCode_ShouldCacheNothing_BetweenCalls` | Low | Each call is independent |
| TC-Brreg-BC-12 | `GetBusinessCode_ShouldHandleLargeRepositoryList_Efficiently` | Low | Performance with many codes |

**Example Test:**
```csharp
[Test]
[Description("Verify GetBusinessCode returns mapped code when match exists")]
[Property("Priority", "High")]
[Property("TestCaseId", "TC-Brreg-BC-01")]
public async Task GetBusinessCode_ShouldReturnBusinessCode_WhenMatchFound()
{
    // Arrange
    var foretaksnummer = "123456789";
    var brregResponse = new BrregSearchResponse
    {
        Organisasjonsnummer = foretaksnummer,
        Navn = "Test AS",
        Naeringskode = new Naeringskode
        {
            Kode = "62.010",
            Beskrivelse = "Programmeringstjenester"
        }
    };
    
    var businessCodes = new List<BusinessCodes>
    {
        new BusinessCodes
        {
            BusinessCodeNo = 1,
            BusinessCodeName = "IT Services",
            BusinessCodeExternal = "62.010"
        },
        new BusinessCodes
        {
            BusinessCodeNo = 2,
            BusinessCodeName = "Construction",
            BusinessCodeExternal = "41.200"
        }
    };
    
    // Mock Search method
    var searchMethod = _service.GetType().GetMethod("Search");
    // ... setup mock to return brregResponse
    
    _ptabRepository.GetBusinessCodes().Returns(businessCodes);
    
    // Act
    var result = await _service.GetBusinessCode(foretaksnummer);
    
    // Assert
    Assert.Multiple(() =>
    {
        Assert.That(result, Is.Not.Null);
        Assert.That(result.BusinessCodeNo, Is.EqualTo(1));
        Assert.That(result.BusinessCodeExternal, Is.EqualTo("62.010"));
        Assert.That(result.BusinessCodeName, Is.EqualTo("IT Services"));
    });
    
    await _ptabRepository.Received(1).GetBusinessCodes();
}
```

---

### Region 6: GetBusinessCode() - No Match Scenarios (10 tests)

**Test Cases:**

| ID | Test Name | Priority | Description |
|----|-----------|----------|-------------|
| TC-Brreg-NoMatch-01 | `GetBusinessCode_ShouldReturnNull_WhenNoMatchFound` | High | No matching code returns null |
| TC-Brreg-NoMatch-02 | `GetBusinessCode_ShouldReturnNull_WhenNaeringskodeIsNull` | High | Missing Naeringskode returns null |
| TC-Brreg-NoMatch-03 | `GetBusinessCode_ShouldReturnNull_WhenKodeIsNull` | High | Naeringskode.Kode == null |
| TC-Brreg-NoMatch-04 | `GetBusinessCode_ShouldReturnNull_WhenKodeIsEmpty` | High | Naeringskode.Kode == "" |
| TC-Brreg-NoMatch-05 | `GetBusinessCode_ShouldReturnNull_WhenRepositoryIsEmpty` | High | No codes in repository |
| TC-Brreg-NoMatch-06 | `GetBusinessCode_ShouldReturnNull_WhenBrregResponseIsNull` | High | Search returns null |
| TC-Brreg-NoMatch-07 | `GetBusinessCode_ShouldHandlePartialMatch_Correctly` | Medium | Similar but not exact codes |
| TC-Brreg-NoMatch-08 | `GetBusinessCode_ShouldReturnNull_WhenCodeNotInRepository` | High | Valid Brreg code not in Perigon |
| TC-Brreg-NoMatch-09 | `GetBusinessCode_ShouldNotThrowException_WhenNoMatch` | High | Null return, not exception |
| TC-Brreg-NoMatch-10 | `GetBusinessCode_ShouldStillCallRepository_EvenIfNoMatch` | Medium | Repository called regardless |

**Example Test:**
```csharp
[Test]
[Description("Verify GetBusinessCode returns null when Naeringskode.Kode is null")]
[Property("Priority", "High")]
[Property("TestCaseId", "TC-Brreg-NoMatch-03")]
public async Task GetBusinessCode_ShouldReturnNull_WhenKodeIsNull()
{
    // Arrange
    var foretaksnummer = "123456789";
    var brregResponse = new BrregSearchResponse
    {
        Organisasjonsnummer = foretaksnummer,
        Navn = "Test AS",
        Naeringskode = new Naeringskode
        {
            Kode = null,  // Null code
            Beskrivelse = "Some description"
        }
    };
    
    var businessCodes = new List<BusinessCodes>
    {
        new BusinessCodes
        {
            BusinessCodeNo = 1,
            BusinessCodeExternal = "62.010"
        }
    };
    
    // Mock Search to return brregResponse
    // Mock _ptabRepository.GetBusinessCodes() to return businessCodes
    _ptabRepository.GetBusinessCodes().Returns(businessCodes);
    
    // Act
    var result = await _service.GetBusinessCode(foretaksnummer);
    
    // Assert
    Assert.That(result, Is.Null, "Should return null when Kode is null");
    
    // Verify repository was NOT called (early return)
    await _ptabRepository.DidNotReceive().GetBusinessCodes();
}
```

---

### Region 7: GetBusinessCode() - Repository Integration (8 tests)

**Test Cases:**

| ID | Test Name | Priority | Description |
|----|-----------|----------|-------------|
| TC-Brreg-Repo-01 | `GetBusinessCode_ShouldCallRepository_ExactlyOnce` | High | Single repository call per request |
| TC-Brreg-Repo-02 | `GetBusinessCode_ShouldHandleRepositoryException_Gracefully` | High | Repository errors propagated |
| TC-Brreg-Repo-03 | `GetBusinessCode_ShouldAwaitRepositoryCall_Properly` | Medium | Async/await pattern verified |
| TC-Brreg-Repo-04 | `GetBusinessCode_ShouldUseWhereClause_OnBusinessCodes` | High | LINQ Where() filtering verified |
| TC-Brreg-Repo-05 | `GetBusinessCode_ShouldNotCacheRepositoryResults_BetweenCalls` | Medium | Each call fetches fresh data |
| TC-Brreg-Repo-06 | `GetBusinessCode_ShouldHandleRepositoryReturningNull_Safely` | Medium | Null repository result handled |
| TC-Brreg-Repo-07 | `GetBusinessCode_ShouldFilterByBusinessCodeExternal_NotOtherFields` | High | Correct property used for matching |
| TC-Brreg-Repo-08 | `GetBusinessCode_ShouldNotCallRepository_WhenNaeringskodeNull` | High | Early return before repository call |

---

### Region 8: Concurrent/Async Behavior (6 tests)

**Test Cases:**

| ID | Test Name | Priority | Description |
|----|-----------|----------|-------------|
| TC-Brreg-Async-01 | `Search_ShouldSupportConcurrentCalls_Independently` | Medium | Multiple searches in parallel |
| TC-Brreg-Async-02 | `GetBusinessCode_ShouldSupportConcurrentCalls_Independently` | Medium | Concurrent GetBusinessCode calls |
| TC-Brreg-Async-03 | `Search_ShouldReturnTask_ThatCanBeAwaited` | High | Proper Task<> return type |
| TC-Brreg-Async-04 | `GetBusinessCode_ShouldAwaitSearchCall_BeforeRepository` | High | Sequential async operations |
| TC-Brreg-Async-05 | `Search_ShouldHandleAsyncHttpCall_WithTimeout` | High | HTTP timeout handling |
| TC-Brreg-Async-06 | `GetBusinessCode_ShouldNotBlockThread_DuringExecution` | Low | Non-blocking async behavior |

---

### Region 9: Edge Cases & Boundary Tests (8 tests)

**Test Cases:**

| ID | Test Name | Priority | Description |
|----|-----------|----------|-------------|
| TC-Brreg-Edge-01 | `Search_ShouldHandleVeryLargeJsonResponse_Successfully` | Medium | Large company data handled |
| TC-Brreg-Edge-02 | `GetBusinessCode_ShouldHandleUnicodeInCodes_Correctly` | Low | Non-ASCII characters in codes |
| TC-Brreg-Edge-03 | `Search_ShouldHandleSpecialCharactersInNavn_Properly` | Medium | &, <, >, quotes in names |
| TC-Brreg-Edge-04 | `GetBusinessCode_ShouldHandleDuplicateCodes_InRepository` | Medium | Multiple same external codes |
| TC-Brreg-Edge-05 | `Search_ShouldHandleMaxIntForetaksnummer_Successfully` | Low | Boundary test for numbers |
| TC-Brreg-Edge-06 | `GetBusinessCode_ShouldHandleNullableBusinessCodeNo_Correctly` | Medium | Nullable int? handling |
| TC-Brreg-Edge-07 | `Search_ShouldHandleJsonWithMissingFields_Gracefully` | High | Partial JSON responses |
| TC-Brreg-Edge-08 | `GetBusinessCode_ShouldMatchExactly_NotPartially` | High | "62" doesn't match "62.010" |

---

## Test Implementation Notes

### HttpClient Mocking Challenge

⚠️ **CRITICAL ISSUE**: The service creates HttpClient in constructor, making it difficult to mock:

```csharp
public BrregSearchService(IMapper mapper, IPtabRepository ptabRepository)
{
    _httpClient = new HttpClient  // ❌ Anti-pattern
    {
        BaseAddress = new Uri("https://data.brreg.no/enhetsregisteret/api/enheter/")
    };
    // ...
}
```

**Solutions:**

1. **Option A: Refactor Service (RECOMMENDED)**
   ```csharp
   public BrregSearchService(
       IMapper mapper, 
       IPtabRepository ptabRepository,
       IHttpClientFactory httpClientFactory)  // ✅ Proper pattern
   {
       _httpClient = httpClientFactory.CreateClient("Brreg");
       // ...
   }
   ```

2. **Option B: Use HttpMessageHandler Mock (Current Testing)**
   ```csharp
   public class MockHttpMessageHandler : HttpMessageHandler
   {
       private readonly HttpStatusCode _statusCode;
       private readonly string _content;
       
       protected override Task<HttpResponseMessage> SendAsync(
           HttpRequestMessage request, 
           CancellationToken cancellationToken)
       {
           return Task.FromResult(new HttpResponseMessage
           {
               StatusCode = _statusCode,
               Content = new StringContent(_content)
           });
       }
   }
   ```

3. **Option C: Use Reflection (AVOID - brittle)**
   ```csharp
   var field = typeof(BrregSearchService)
       .GetField("_httpClient", BindingFlags.NonPublic | BindingFlags.Instance);
   field.SetValue(_service, mockHttpClient);
   ```

**RECOMMENDATION:** 
- File Jira ticket to refactor service to use IHttpClientFactory
- For now, use Option B (HttpMessageHandler mocking) for tests
- Mark tests with `[Category("RequiresRefactoring")]`

---

### AutoMapper Handling

⚠️ **AutoMapper Present But Not Used in Logic**

Current code shows:
```csharp
private readonly IMapper _mapper;  // Field declared

public BrregSearchService(IMapper mapper, ...)
{
    _mapper = mapper;  // Assigned but never used
    // ...
}
```

**Analysis:** The `_mapper` field is never referenced in method logic. It appears to be **dead code** from a previous refactoring.

**Test Strategy:**
1. Mock IMapper in SetUp (standard pattern)
2. **DO NOT** verify mapper calls (it's never used)
3. Add comment: "IMapper mocked for constructor but not used in service logic - candidate for removal"

**Example SetUp:**
```csharp
[SetUp]
public void SetUp()
{
    _mapper = Substitute.For<IMapper>();  // Required for constructor
    _ptabRepository = Substitute.For<IPtabRepository>();
    _service = new BrregSearchService(_mapper, _ptabRepository);
    
    // Note: IMapper is injected but never used in service - dead code
}
```

---

## Test Coverage Estimate

| Region | Test Count | Estimated Hours |
|--------|-----------|-----------------|
| Region 1: Search() - Successful API Calls | 10 | 2-3 hours |
| Region 2: Search() - Error Handling | 12 | 3-4 hours |
| Region 3: Search() - Input Validation | 8 | 2 hours |
| Region 4: Search() - Response Parsing | 10 | 2-3 hours |
| Region 5: GetBusinessCode() - Successful Mapping | 12 | 3-4 hours |
| Region 6: GetBusinessCode() - No Match Scenarios | 10 | 2-3 hours |
| Region 7: GetBusinessCode() - Repository Integration | 8 | 2 hours |
| Region 8: Concurrent/Async Behavior | 6 | 1-2 hours |
| Region 9: Edge Cases & Boundary Tests | 8 | 2 hours |
| **TOTAL** | **84 tests** | **19-24 hours** |

---

## Risks & Mitigation

### Risk 1: HttpClient Not Mockable
**Impact:** HIGH - Cannot test without refactoring service  
**Mitigation:** 
- Use HttpMessageHandler mocking pattern
- File Jira ticket for IHttpClientFactory refactoring
- Mark tests with `[Category("RequiresRefactoring")]`

### Risk 2: External API Dependency
**Impact:** MEDIUM - Tests rely on API contract  
**Mitigation:**
- Mock all HTTP responses
- Document expected JSON structure
- Add integration tests separately (not unit tests)

### Risk 3: No Error Logging
**Impact:** MEDIUM - Hard to debug test failures  
**Mitigation:**
- Add descriptive assertion messages
- Include actual vs expected in failures
- Log HTTP request/response in tests

### Risk 4: Poor Exception Messages
**Impact:** LOW - Generic "Bad search" unhelpful  
**Mitigation:**
- Test exception messages as-is
- Document need for improvement in Jira

---

## Refactoring Recommendations

### Priority 1: Remove AutoMapper
```csharp
// Current (BAD):
public BrregSearchService(IMapper mapper, IPtabRepository ptabRepository)

// Recommended (GOOD):
public BrregSearchService(IPtabRepository ptabRepository)
```

### Priority 2: Use IHttpClientFactory
```csharp
// Current (BAD):
_httpClient = new HttpClient { BaseAddress = ... };

// Recommended (GOOD):
public BrregSearchService(
    IPtabRepository ptabRepository,
    IHttpClientFactory httpClientFactory)
{
    _httpClient = httpClientFactory.CreateClient("Brreg");
}

// In Startup.cs:
services.AddHttpClient("Brreg", client =>
{
    client.BaseAddress = new Uri("https://data.brreg.no/enhetsregisteret/api/enheter/");
    client.Timeout = TimeSpan.FromSeconds(30);
});
```

### Priority 3: Improve Error Handling
```csharp
// Current (BAD):
if (!response.IsSuccessStatusCode)
{
    throw new Exception("Bad search");
}

// Recommended (GOOD):
if (!response.IsSuccessStatusCode)
{
    var errorContent = await response.Content.ReadAsStringAsync();
    throw new BrregApiException(
        $"Brreg API returned {response.StatusCode} for company {foretaksnummer}. " +
        $"Response: {errorContent}",
        response.StatusCode);
}
```

### Priority 4: Add Logging
```csharp
// Recommended:
public BrregSearchService(
    IPtabRepository ptabRepository,
    IHttpClientFactory httpClientFactory,
    ILogger<BrregSearchService> logger)
{
    _logger = logger;
    // ...
}

public async Task<BrregSearchResponse> Search(string foretaksnummer)
{
    _logger.LogInformation("Searching Brreg for company: {Foretaksnummer}", foretaksnummer);
    
    try
    {
        var response = await _httpClient.GetAsync(foretaksnummer);
        // ...
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to search Brreg for {Foretaksnummer}", foretaksnummer);
        throw;
    }
}
```

### Priority 5: Add Resilience (Polly)
```csharp
// In Startup.cs:
services.AddHttpClient("Brreg")
    .AddTransientHttpErrorPolicy(builder => 
        builder.WaitAndRetryAsync(3, retryAttempt => 
            TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))))
    .AddTransientHttpErrorPolicy(builder => 
        builder.CircuitBreakerAsync(5, TimeSpan.FromSeconds(30)));
```

---

## Test Execution Plan

### Phase 1: Foundation (Week 1)
1. Create test file structure
2. Implement SetUp with HttpMessageHandler mocking
3. Create Region 1 tests (Search success scenarios)
4. Verify mocking approach works

### Phase 2: Error Handling (Week 1)
5. Implement Region 2 (Search errors)
6. Implement Region 3 (Input validation)
7. Implement Region 4 (Response parsing)

### Phase 3: Business Logic (Week 2)
8. Implement Region 5 (GetBusinessCode success)
9. Implement Region 6 (GetBusinessCode no-match)
10. Implement Region 7 (Repository integration)

### Phase 4: Advanced (Week 2)
11. Implement Region 8 (Async behavior)
12. Implement Region 9 (Edge cases)
13. Run all tests, verify 100% coverage

---

## Success Criteria

- ✅ 84 unit tests implemented
- ✅ 100% code coverage (both methods)
- ✅ All tests passing
- ✅ HttpClient properly mocked
- ✅ Repository properly mocked
- ✅ No external API calls during tests
- ✅ Test execution < 5 seconds
- ✅ Clear test names following convention
- ✅ Comprehensive edge case coverage

---

## Related Documentation

- **Service File:** `src/Perigon.Modules.MeteringPoint/Utils/Services/Common/BrregSearchService.cs`
- **Repository Interface:** `src/Perigon.Modules.MeteringPoint.Domains/Interfaces/Common/IPtabRepository.cs`
- **DTOs:** `src/Perigon.Modules.MeteringPoint/Utils/Services/Common/BrregSearchService.cs` (lines 6-22)
- **Brreg API Docs:** https://data.brreg.no/enhetsregisteret/api/docs/index.html

---

## Notes

1. **Service requires refactoring** before ideal testing can occur
2. **AutoMapper is dead code** - can be safely removed
3. **External API calls must be mocked** - no integration tests in unit test suite
4. **HttpMessageHandler pattern** required for current implementation
5. **Consider Polly resilience** for production deployment
6. **Add ILogger** for better observability
7. **Error messages need improvement** for better debugging

---

**Test Plan Version:** 1.0  
**Last Updated:** December 15, 2025  
**Status:** Ready for Implementation

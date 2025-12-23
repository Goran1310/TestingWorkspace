# Test Plan: MeteringPoint Common Services

**Created**: December 18, 2025  
**Module**: Perigon.Modules.MeteringPoint  
**Namespace**: Utils.Services.Common  
**Test Type**: Unit Tests (NUnit + NSubstitute)

---

## Executive Summary

This test plan covers **13 untested services** in the MeteringPoint Common namespace. These services handle critical functionality including address conversion, search operations, file management, user data persistence, dropdown population, and widget services. Currently, only `BrregSearchService` has unit test coverage.

**Testing Priority**: High - these services are foundational to the MeteringPoint module's functionality.

---

## Services Requiring Tests

### ✅ Already Tested
- `BrregSearchService` - Has test coverage

### ❌ Missing Tests (13 Services)
1. AddressConvertService
2. AddressSearchService
3. AppService
4. BusinessProcessVisualisationService
5. DropdownService
6. FileService
7. GeoNorgeSearchService
8. IconService
9. LastVisitedMeteringpointService
10. MarketMessageWidgetService
11. ProcessStateService
12. RecentSearchesService
13. UserDataService

---

## 1. AddressConvertService

**Purpose**: Bidirectional conversion between structured address objects and single-line string addresses.

**Dependencies**: None (pure logic)

**Methods**:
- `GetSingleStringStreetAddress(StreetAddressObject)` → string
- `GetStreetAddressFromSingleString(string)` → StreetAddressObject

### Test Scenarios

#### GetSingleStringStreetAddress Tests
| Test Name | Input | Expected Output | Priority |
|-----------|-------|----------------|----------|
| `GetSingleStringStreetAddress_WithFullAddress_ReturnsFormattedString` | All fields populated | "StreetName BuildingNumber BuildingLetter Apartment" | High |
| `GetSingleStringStreetAddress_WithStreetAndNumberOnly_ReturnsPartialString` | Street + Number only | "StreetName BuildingNumber" | High |
| `GetSingleStringStreetAddress_WithEmptyAddress_ReturnsEmptyString` | All fields null/empty | "" | Medium |
| `GetSingleStringStreetAddress_WithWhitespace_TrimsCorrectly` | Fields with extra spaces | Trimmed output | Medium |
| `GetSingleStringStreetAddress_WithNullObject_ThrowsException` | null parameter | NullReferenceException | Low |
| `GetSingleStringStreetAddress_WithOnlyApartment_ReturnsApartment` | Only Apartment field | "Apartment" | Low |

#### GetStreetAddressFromSingleString Tests
| Test Name | Input | Expected Output | Priority |
|-----------|-------|----------------|----------|
| `GetStreetAddressFromSingleString_WithFullAddress_ParsesCorrectly` | "Main St 123 A H0101" | Parsed StreetAddressObject | High |
| `GetStreetAddressFromSingleString_WithStreetAndNumber_ParsesPartial` | "Main St 123" | Partial object | High |
| `GetStreetAddressFromSingleString_WithEmptyString_ReturnsEmptyObject` | "" | Empty object | Medium |
| `GetStreetAddressFromSingleString_WithNullString_HandlesGracefully` | null | Empty or throws | Medium |
| `GetStreetAddressFromSingleString_WithSpecialCharacters_ParsesCorrectly` | Norwegian characters | Handles Æ,Ø,Å | Low |

**Risk Assessment**: Low complexity, pure string manipulation logic. Primary risk is regex parsing edge cases.

---

## 2. AddressSearchService

**Purpose**: Retrieves address coordinates from repository for new metering points.

**Dependencies**: 
- `IAddressRepository` (repository)

**Methods**:
- `GetAddressCooridinates(NewMeteringPointVM)` → Task<NewMeteringPointVM>

### Test Scenarios

| Test Name | Mock Setup | Expected Behavior | Priority |
|-----------|------------|-------------------|----------|
| `GetAddressCooridinates_WithMatchingAddresses_ReturnsFirstMatch` | Repository returns list | Sets first address on VM | High |
| `GetAddressCooridinates_WithNoMatches_ReturnsUnmodifiedRequest` | Repository returns empty | VM unchanged | High |
| `GetAddressCooridinates_WithMultipleMatches_UsesFirstOnly` | Repository returns 3+ items | Uses index [0] | Medium |
| `GetAddressCooridinates_WithRepositoryException_PropagatesException` | Repository throws | Exception bubbles up | Medium |
| `GetAddressCooridinates_WithNullRequest_ThrowsException` | null parameter | NullReferenceException | Low |

**Risk Assessment**: Simple pass-through service. Main risk is null handling and repository failure scenarios.

---

## 3. AppService

**Purpose**: Provides application configuration settings (DSO realm, nationality).

**Dependencies**:
- `IAppConfiguration<AppConfiguration>` (config)

**Methods**:
- `IsDsoRealm()` → Task<bool>
- `Nationality()` → Task<string>

### Test Scenarios

| Test Name | Mock Setup | Expected Output | Priority |
|-----------|------------|----------------|----------|
| `IsDsoRealm_WhenConfigured_ReturnsTrue` | IsDsoRealm = true | true | High |
| `IsDsoRealm_WhenNotConfigured_ReturnsFalse` | IsDsoRealm = false | false | High |
| `Nationality_WithNorwegianConfig_ReturnsNorway` | Nationality = "NO" | "NO" | High |
| `Nationality_WithSwedishConfig_ReturnsSweden` | Nationality = "SE" | "SE" | Medium |
| `IsDsoRealm_WithConfigException_PropagatesException` | GetAsync throws | Exception bubbles | Medium |

**Risk Assessment**: Minimal logic, configuration wrapper. Test config retrieval and value pass-through.

---

## 4. BusinessProcessVisualisationService

**Purpose**: Maps business process visualization data from repository to ViewModels.

**Dependencies**:
- `IBusinessProcessVisualisationRepository` (repository)
- `IMapper` (AutoMapper)

**Methods**:
- `GetBusinessProcessVisualisationVM(int workorderID)` → Task<List<BusinessProcessVisualisationVM>>

### Test Scenarios

| Test Name | Mock Setup | Expected Behavior | Priority |
|-----------|------------|-------------------|----------|
| `GetBusinessProcessVisualisationVM_WithValidWorkorder_ReturnsMappedList` | Repository + Mapper return data | Returns mapped VMs | High |
| `GetBusinessProcessVisualisationVM_WithEmptyResult_ReturnsEmptyList` | Repository returns empty | Empty list | High |
| `GetBusinessProcessVisualisationVM_WithMultipleSteps_MapsAll` | 5 process steps | All mapped | Medium |
| `GetBusinessProcessVisualisationVM_WithRepositoryException_PropagatesException` | Repository throws | Exception bubbles | Medium |
| `GetBusinessProcessVisualisationVM_WithMappingException_PropagatesException` | Mapper throws | Exception bubbles | Low |

**Risk Assessment**: ⚠️ **Uses AutoMapper** - legacy service. Verify mappings are configured. Test mapper invocation.

---

## 5. DropdownService

**Purpose**: Provides dropdown data for technical fields (gridtype, fuse, serviceline options).

**Dependencies**:
- `ITechnicalRepository` (repository)
- `IAppConfiguration<AppConfiguration>` (config)

**Methods**:
- `GetTechnicalDD()` → Task<TechnicalDropdown>
- `GetGridtypeDD()` → Task<List<Dropdown>>
- `GetServicelineConnectedDD()` → Task<List<Dropdown>>
- `GetServicelineMaterialDD()` → Task<List<Dropdown>>
- `GetServicelineTypeDD()` → Task<List<Dropdown>>
- `GetFuseDD()` → Task<List<FuseDropdown>>

### Test Scenarios

| Test Name | Mock Setup | Expected Behavior | Priority |
|-----------|------------|-------------------|----------|
| `GetTechnicalDD_WithNorwegianNationality_CallsRepositoryWithNO` | Nationality = "NO" | Repository called with "NO" | High |
| `GetTechnicalDD_WithValidResponse_ReturnsFullDropdown` | Complete dropdown data | Returns TechnicalDropdown | High |
| `GetGridtypeDD_WithPopulatedData_ReturnsGridtypeList` | TechnicalDD has gridtypes | Returns correct list | High |
| `GetServicelineConnectedDD_ReturnsCorrectSubset` | Full dropdown | Returns ServicelineConnected | Medium |
| `GetServicelineMaterialDD_ReturnsCorrectSubset` | Full dropdown | Returns ServicelineMaterial | Medium |
| `GetServicelineTypeDD_ReturnsCorrectSubset` | Full dropdown | Returns ServicelineType | Medium |
| `GetFuseDD_ReturnsCorrectSubset` | Full dropdown | Returns Fuse list | Medium |
| `GetTechnicalDD_WithEmptyDropdown_ReturnsEmptyLists` | Repository returns empty | Empty TechnicalDropdown | Low |
| `GetGridtypeDD_WithRepositoryException_PropagatesException` | Repository throws | Exception bubbles | Low |

**Risk Assessment**: Multiple method calls chain through `GetTechnicalDD()`. Test caching behavior if applicable.

---

## 6. FileService

**Purpose**: Handles file uploads to customers, metering points, and component handling workorders.

**Dependencies**:
- `IDocumentRepository` (repository)
- `ICompHandlingSummaryRepository` (repository)

**Methods**:
- `UploadFileToCustomer(int, int?, List<IFormFile>)` → void
- `UploadFileToMeteringpoint(int, List<IFormFile>)` → void
- `UploadFile(int?, int?, int?, List<IFormFile>)` → void
- `UploadFileComphandling(int?, List<IFormFile>)` → Task
- `DeleteFile(int)` → Task<bool>

### Test Scenarios

| Test Name | Mock Setup | Expected Behavior | Priority |
|-----------|------------|-------------------|----------|
| `UploadFileToCustomer_WithValidFiles_CallsRepositoryForEach` | 2 files, customerId=123 | Repository called 2x | High |
| `UploadFileToCustomer_WithZeroLengthFile_SkipsFile` | File.Length = 0 | Repository not called | High |
| `UploadFileToCustomer_WithContractNo_PassesContractNo` | ContractNo provided | DTO includes ContractNo | Medium |
| `UploadFileToMeteringpoint_WithValidFiles_SetsCorrectDTO` | MeteringpointNo=456 | DTO has MeteringpointNo | High |
| `UploadFile_WithAllParameters_CreatesFullDTO` | All IDs provided | DTO has all fields | Medium |
| `UploadFile_WithEmptyList_NoRepositoryCalls` | Empty file list | No calls | Low |
| `UploadFileComphandling_WithValidWorkorder_CallsCompRepository` | WorkorderId provided | CompRepository called | High |
| `DeleteFile_WithValidDocumentNo_ReturnsTrue` | Repository returns true | Returns true | Medium |
| `DeleteFile_WithRepositoryException_PropagatesException` | Repository throws | Exception bubbles | Medium |
| `Content_WithValidStream_ConvertsToByteArray` | IFormFile mock | Byte array returned | High |

**Risk Assessment**: Medium - File I/O mocking required. Test stream handling and byte conversion carefully.

---

## 7. GeoNorgeSearchService

**Purpose**: Searches GeoNorge API for Norwegian addresses with coordinates.

**Dependencies**:
- `HttpClient` (external API)
- `IMapper` (AutoMapper)

**Methods**:
- `Search(GeoNorgeAddress)` → Task<IEnumerable<GeoNorgeAddress>>

### Test Scenarios

| Test Name | Mock Setup | Expected Behavior | Priority |
|-----------|------------|-------------------|----------|
| `Search_WithValidAddress_ReturnsAddresses` | API returns addresses | Mapped addresses returned | High |
| `Search_WithNoMatches_ReturnsEmptyList` | API returns empty | Empty enumerable | High |
| `Search_WithMultipleResults_MapsAll` | API returns 5 addresses | 5 mapped addresses | Medium |
| `Search_WithCoordinates_RoundsTo5Decimals` | Coordinates with 10 decimals | Rounded to 5 | High |
| `Search_WithBadApiResponse_ThrowsException` | HTTP 500/404 | "Bad search" exception | High |
| `Search_WithMalformedJson_HandlesGracefully` | Invalid JSON | Exception or empty | Medium |
| `Search_WithNullResponse_HandlesGracefully` | Null deserialization | Empty GeoNorgeResponse | Low |
| `Search_PreservesMeteringpointNo_FromInput` | Input has MeteringpointNo | Output preserves it | Medium |

**Risk Assessment**: ⚠️ **High** - External API dependency, uses AutoMapper. Requires HttpClient mocking. Test error handling thoroughly.

---

## 8. IconService

**Purpose**: Maps file extensions to icon names and validates file types.

**Dependencies**: None (pure logic)

**Methods**:
- `GetIcon(string fileType)` → string
- `IsImage(string fileType)` → bool
- `IsPdf(string fileType)` → bool
- `IsFile(string fileType)` → bool

### Test Scenarios

| Test Name | Input | Expected Output | Priority |
|-----------|-------|----------------|----------|
| `GetIcon_WithDocExtension_ReturnsWord` | "doc" | "word" | High |
| `GetIcon_WithXlsxExtension_ReturnsExcel` | "xlsx" | "excel" | High |
| `GetIcon_WithPngExtension_ReturnsImage` | "png" | "image" | High |
| `GetIcon_WithPdfExtension_ReturnsPdf` | "pdf" | "pdf" | High |
| `GetIcon_WithUnknownExtension_ReturnsOriginal` | "xyz" | "xyz" | Medium |
| `IsImage_WithJpeg_ReturnsTrue` | "jpeg" | true | High |
| `IsImage_WithPdf_ReturnsFalse` | "pdf" | false | High |
| `IsPdf_WithPdf_ReturnsTrue` | "pdf" | true | High |
| `IsPdf_WithDoc_ReturnsFalse` | "doc" | false | High |
| `IsFile_WithVariousTypes_ReturnsExpected` | Various | Per implementation | Medium |
| `GetIcon_WithCaseSensitivity_HandlesCorrectly` | "DOC" vs "doc" | Test case handling | Low |

**Risk Assessment**: Low - Pure logic, switch statement. Verify all supported extensions.

---

## 9. LastVisitedMeteringpointService

**Purpose**: Tracks last 10 visited metering points per user with timestamps.

**Dependencies**:
- `IUserDataService` (user data)
- `IOverviewRepository` (validation)

**Methods**:
- `VisitAsync(int meteringpointNo)` → Task<VisitedMeteringpoint>
- `GetAllAsync()` → Task<(IEnumerable<VisitedMeteringpoint>, Dictionary<int, VisitedMeteringpointDTO>)>

### Test Scenarios

| Test Name | Mock Setup | Expected Behavior | Priority |
|-----------|------------|-------------------|----------|
| `VisitAsync_WithNewMeteringpoint_AddsToList` | Empty visited list | Adds new entry | High |
| `VisitAsync_WithExistingMeteringpoint_ReturnsExisting` | Already in list | Returns existing entry | High |
| `VisitAsync_WithNonExistentMeteringpoint_ReturnsNull` | Repository returns empty | Returns null | High |
| `VisitAsync_WithFullList_RemovesOldest` | 10 items in list | Oldest removed | High |
| `VisitAsync_SetsCorrectTimestamp_OnCreation` | New visit | VisitedAt = DateTime.Now | Medium |
| `VisitAsync_WithUserDataUpdateFailure_ReturnsNull` | PutAsync returns false | Returns null | Medium |
| `GetAllAsync_ReturnsOrderedByDate_Descending` | Multiple visits | Ordered by VisitedAt DESC | High |
| `GetAllAsync_FiltersNonExistentMeteringpoints` | Deleted metering points | Filters out invalid | Medium |
| `GetAllAsync_WithEmptyList_ReturnsEmptyCollections` | No visits | Empty tuple | Low |
| `GetAllAsync_BuildsDTODictionary_Correctly` | 3 visits | Dict with 3 entries | Medium |

**Risk Assessment**: Medium - Complex business logic with list management, validation, and dictionary operations. Test boundary at 10 items.

---

## 10. MarketMessageWidgetService

**Purpose**: Retrieves and creates market messages for metering points.

**Dependencies**:
- `IMarketMessageWidgetRepository` (repository)
- `IMapper` (AutoMapper)

**Methods**:
- `GetMarketMessages(int workOrderID, int meteringPointNO)` → Task<MarketMessageWidgetDetailsVM>
- `GetMarketMessagesNamesJson(int meteringPointNO)` → Task<List<MarketMessageVM>>
- `CreateMarketMessage(JsonObject)` → Task<string>

### Test Scenarios

| Test Name | Mock Setup | Expected Behavior | Priority |
|-----------|------------|-------------------|----------|
| `GetMarketMessages_WithValidIDs_ReturnsDetailsVM` | Repository returns messages | Mapped DetailsVM | High |
| `GetMarketMessages_SetsWorkOrderID_Correctly` | workOrderID=123 | VM.WorkOrderID = 123 | High |
| `GetMarketMessages_WithEmptyMessages_ReturnsEmptyList` | No messages | Empty list | Medium |
| `GetMarketMessagesNamesJson_WithValidMeteringpoint_ReturnsMappedList` | Repository returns data | Mapped VMs | High |
| `CreateMarketMessage_WithValidJson_ParsesCorrectly` | Valid JsonObject | DTO populated | High |
| `CreateMarketMessage_WithInvalidDateFormat_UsesYesterday` | Invalid date string | fromDate = Now - 1 day | High |
| `CreateMarketMessage_WithMissingFields_UsesDefaults` | Null properties | Defaults to 0 | Medium |
| `CreateMarketMessage_WithValidDateFormat_ParsesDate` | "12/18/2025" format | Parsed correctly | High |
| `CreateMarketMessage_CallsRepository_WithCorrectDTO` | Valid input | Repository called | High |

**Risk Assessment**: ⚠️ **Medium-High** - Uses AutoMapper, complex JSON parsing, date parsing logic. Test all parsing edge cases.

---

## 11. ProcessStateService

**Purpose**: Retrieves MGA (likely "Market Grid Area") data.

**Dependencies**:
- `IProcessStateRepository` (repository)

**Methods**:
- `GetMGAAsync()` → Task<List<MGA>>

### Test Scenarios

| Test Name | Mock Setup | Expected Output | Priority |
|-----------|------------|----------------|----------|
| `GetMGAAsync_WithAvailableData_ReturnsList` | Repository returns MGA list | List<MGA> | High |
| `GetMGAAsync_WithEmptyData_ReturnsEmptyList` | Repository returns empty | Empty list | High |
| `GetMGAAsync_WithRepositoryException_PropagatesException` | Repository throws | Exception bubbles | Medium |
| `GetMGAAsync_WithMultipleMGAs_ReturnsAll` | 3+ MGAs | All returned | Medium |

**Risk Assessment**: Low - Simple pass-through service. Minimal logic to test.

---

## 12. RecentSearchesService

**Purpose**: Manages user's last 10 recent searches with JSON payloads.

**Dependencies**:
- `IUserDataService` (user data)

**Methods**:
- `CreateAsync(CreateRecentSearchRequest)` → Task<RecentSearch>
- `GetAllAsync()` → Task<IEnumerable<RecentSearch>>
- `GetByIdAsync(int id)` → Task<RecentSearch>

### Test Scenarios

| Test Name | Mock Setup | Expected Behavior | Priority |
|-----------|------------|-------------------|----------|
| `CreateAsync_WithNewSearch_AddsToList` | Empty list | Adds with ID=1 | High |
| `CreateAsync_WithExistingSearches_IncrementsID` | 3 searches | New ID = 4 | High |
| `CreateAsync_WithFullList_RemovesOldest` | 10 searches | Oldest removed | High |
| `CreateAsync_SetsTimestamp_ToNow` | New search | CreatedAt = DateTime.Now | Medium |
| `CreateAsync_WithUserDataFailure_ReturnsNull` | SetRecentSearches fails | Returns null | Medium |
| `CreateAsync_StoresJsonPayload_Correctly` | JSON string | Stored in search | High |
| `GetByIdAsync_WithExistingID_ReturnsSearch` | ID exists | Returns search | High |
| `GetByIdAsync_WithNonExistentID_ReturnsNull` | ID not found | Returns null | High |
| `GetAllAsync_ReturnsOrderedByID_Descending` | Multiple searches | Ordered by ID DESC | High |
| `GetAllAsync_WithEmptyList_ReturnsEmpty` | No searches | Empty enumerable | Low |
| `CreateAsync_LimitsTo10Items_Maximum` | 15 creates | Only keeps 10 | High |

**Risk Assessment**: Medium - Similar to LastVisitedMeteringpointService. Test list management and ID generation.

---

## 13. UserDataService

**Purpose**: Persists and retrieves user-specific settings (widgets, recent visits, searches).

**Dependencies**:
- `IUserDataRepository` (repository)
- `IActionContextAccessor` (user claims)
- `ILogger<UserDataService>` (logging)

**Methods**:
- `GetAsync()` → Task<UserData>
- `PutAsync(UserData)` → Task<bool>
- `SetRecentSearches(Dictionary<int, RecentSearch>)` → Task<bool>

### Test Scenarios

| Test Name | Mock Setup | Expected Behavior | Priority |
|-----------|------------|-------------------|----------|
| `GetAsync_WithExistingData_DeserializesCorrectly` | Repository returns JSON | Deserialized UserData | High |
| `GetAsync_WithNullData_ReturnsEmptyUserData` | Repository returns null | New UserData() | High |
| `GetAsync_WithEmptyValue_ReturnsEmptyUserData` | Value = "" | New UserData() | High |
| `GetAsync_WithInvalidJson_LogsAndReturnsEmpty` | Malformed JSON | Logs error, returns empty | High |
| `GetAsync_ExtractsUsername_FromClaims` | Claims include username | Uses correct username | High |
| `PutAsync_WithValidData_SerializesAndSaves` | Valid UserData | Repository called with JSON | High |
| `PutAsync_WithSerializationError_ReturnsFalse` | Serialization throws | Returns false | Medium |
| `PutAsync_WithRepositoryFailure_ReturnsFalse` | UpdateUserData fails | Returns false | Medium |
| `SetRecentSearches_UpdatesUserData_Correctly` | Existing UserData | Updates searches, calls Put | High |
| `SetRecentSearches_WithEmptyDictionary_SavesEmpty` | Empty dict | Saves empty searches | Low |
| `GetAsync_WithMissingUsernameClaim_ThrowsException` | No username claim | NullReferenceException | Medium |

**Risk Assessment**: ⚠️ **High** - Critical service for user state. Test serialization, error handling, and claim extraction thoroughly.

---

## Testing Resources

### Required NuGet Packages
- NUnit 3.14.0
- NSubstitute 5.1.0
- NUnit3TestAdapter 4.5.0
- Microsoft.NET.Test.Sdk 17.8.0

### Test Project Structure
```
Perigon.Modules.MeteringPoint.UnitTests/
└── Utils/
    └── Services/
        └── Common/
            ├── AddressConvertServiceTests.cs
            ├── AddressSearchServiceTests.cs
            ├── AppServiceTests.cs
            ├── BusinessProcessVisualisationServiceTests.cs
            ├── DropdownServiceTests.cs
            ├── FileServiceTests.cs
            ├── GeoNorgeSearchServiceTests.cs
            ├── IconServiceTests.cs
            ├── LastVisitedMeteringpointServiceTests.cs
            ├── MarketMessageWidgetServiceTests.cs
            ├── ProcessStateServiceTests.cs
            ├── RecentSearchesServiceTests.cs
            └── UserDataServiceTests.cs
```

### Special Considerations

#### AutoMapper Services (Legacy - ⚠️ Do NOT add to new code)
- BusinessProcessVisualisationService
- GeoNorgeSearchService
- MarketMessageWidgetService

**Testing Strategy**: Mock IMapper with `Arg.Any<T>()` and `Returns()`. Verify Map() is called with correct source type.

#### HttpClient Services
- GeoNorgeSearchService

**Testing Strategy**: Use `HttpMessageHandler` mocking or test wrapper. Mock HTTP responses.

#### IFormFile Services
- FileService

**Testing Strategy**: Create mock `IFormFile` with mock streams. Test `OpenReadStream()`, `Length`, `FileName`.

#### Session/User Context Services
- UserDataService
- LastVisitedMeteringpointService
- RecentSearchesService

**Testing Strategy**: Mock `IActionContextAccessor` and `HttpContext.User.Claims`. Test claim extraction.

---

## Implementation Approach

### Phase 1: Simple Services (Week 1)
- IconService (pure logic)
- ProcessStateService (simple pass-through)
- AppService (config wrapper)
- AddressConvertService (string manipulation)

**Target**: 4 services, ~40 tests

### Phase 2: Repository Services (Week 2)
- AddressSearchService
- DropdownService
- BusinessProcessVisualisationService

**Target**: 3 services, ~30 tests

### Phase 3: Complex Logic Services (Week 3)
- LastVisitedMeteringpointService
- RecentSearchesService
- MarketMessageWidgetService

**Target**: 3 services, ~40 tests

### Phase 4: High-Risk Services (Week 4)
- UserDataService
- GeoNorgeSearchService
- FileService

**Target**: 3 services, ~50 tests

**Total Estimated Tests**: ~160 tests across 13 services

---

## Success Criteria

- ✅ All 13 services have test coverage
- ✅ Minimum 90% code coverage per service
- ✅ All public methods tested with positive, negative, and edge cases
- ✅ Exception handling verified for repository/external failures
- ✅ All tests follow Hansen Technologies naming conventions
- ✅ Tests execute in < 5 seconds total
- ✅ Zero test failures in CI/CD pipeline

---

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| AutoMapper configuration missing | Mock IMapper, verify calls without actual mapping |
| HttpClient mocking complexity | Use HttpMessageHandler wrapper or test library |
| IFormFile stream handling | Create test helpers for IFormFile mocking |
| User claims extraction failures | Comprehensive null/missing claim tests |
| External API failures (GeoNorge) | Test all HTTP status codes and timeouts |
| Serialization errors | Test malformed JSON, null values, type mismatches |

---

## Notes

- **BrregSearchService**: Already has tests - review for patterns to reuse
- **AutoMapper**: Legacy pattern - do not add to new services
- **File I/O**: FileService requires careful stream mocking
- **DateTime.Now**: Use time abstraction for testability or accept minor flakiness
- **JavaScript Epoch**: Test `ToJavaScriptMilliseconds()` extension method separately if needed

---

**Next Steps**: 
1. Create test files for Phase 1 services
2. Implement IconService tests (simplest starting point)
3. Run tests and validate patterns
4. Proceed to Phase 2 after Phase 1 completion

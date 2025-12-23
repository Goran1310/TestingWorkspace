# Test Plan: OverviewWidgetDataService

## Overview
Test plan for `OverviewWidgetDataService` in the Meteringpoint360 module. This service manages user-specific overview widget tab states through the UserDataService layer, providing Get and Save operations for 10 different widget tabs.

**Service Location:** `Perigon.Modules.MeteringPoint.Utils.Services.Meteringpoint360`  
**Dependencies:** `IUserDataService`  
**Test File:** `Perigon.Modules.MeteringPoint.UnitTests/Utils/Services/Meteringpoint360/OverviewWidgetDataServiceTests.cs`

## Service Methods

### 1. GetAsync() → Task<OverviewWidgetSettings>
Retrieves user's overview widget settings from UserDataService.

### 2. SaveXXXTabAsync(string tabState) → Task<bool> (10 methods)
Each method saves a specific tab state for different widgets:
- `SaveDeliveryTabAsync` - Delivery widget tab state
- `SaveDocumentTabAsync` - Document widget tab state
- `SaveEquipmentTabAsync` - Equipment widget tab state
- `SaveMeteringgroupTabAsync` - Meteringgroup widget tab state
- `SaveMeteringseriesTabAsync` - Meteringseries widget tab state
- `SavePropertyTabAsync` - Property widget tab state
- `SaveRetailerTabAsync` - Retailer widget tab state
- `SaveCustomerTabAsync` - Customer widget tab state
- `SaveRelationTabAsync` - Relation widget tab state
- `SaveWorkorderTabAsync` - Workorder widget tab state

**Pattern**: All Save methods follow identical logic:
1. Get current UserData via `userDataService.GetAsync()`
2. Update specific tab property in `OverviewWidgetSettings`
3. Save via `userDataService.PutAsync()` and return result

## Test Scenarios

### OWD-100 Series: GetAsync() Method Tests

#### OWD-101: GetAsync returns widget settings from UserData
**Given**: UserDataService.GetAsync() returns UserData with OverviewWidgetSettings  
**When**: GetAsync is called  
**Then**: Returns OverviewWidgetSettings object

#### OWD-102: GetAsync returns settings with default tab states
**Given**: UserData has default-initialized OverviewWidgetSettings  
**When**: GetAsync is called  
**Then**: Returns settings with default values (e.g., CustomerTab="tab-customer", DeliveryTab="delivery-current")

#### OWD-103: GetAsync returns settings with custom tab states
**Given**: UserData has custom tab states (DeliveryTab="delivery-historical")  
**When**: GetAsync is called  
**Then**: Returns settings with custom values

#### OWD-104: GetAsync handles null UserData gracefully
**Given**: UserDataService.GetAsync() returns UserData with null OverviewWidgetSettings  
**When**: GetAsync is called  
**Then**: Returns null (no null check in service)

### OWD-200 Series: SaveDeliveryTabAsync() Tests

#### OWD-201: SaveDeliveryTabAsync updates delivery tab state
**Given**: Current DeliveryTab="delivery-current", new state="delivery-historical"  
**When**: SaveDeliveryTabAsync("delivery-historical") is called  
**Then**: UserDataService.PutAsync called with DeliveryTab="delivery-historical", returns true

#### OWD-202: SaveDeliveryTabAsync preserves other tab states
**Given**: All other tabs have existing values  
**When**: SaveDeliveryTabAsync is called  
**Then**: Only DeliveryTab updated, all other tabs unchanged

#### OWD-203: SaveDeliveryTabAsync returns repository result
**Given**: UserDataService.PutAsync returns false  
**When**: SaveDeliveryTabAsync is called  
**Then**: Returns false

### OWD-300 Series: SaveDocumentTabAsync() Tests

#### OWD-301: SaveDocumentTabAsync updates document tab state
**Given**: Current DocumentTab="document-all", new state="document-recent"  
**When**: SaveDocumentTabAsync("document-recent") is called  
**Then**: UserDataService.PutAsync called with DocumentTab="document-recent", returns true

### OWD-400 Series: SaveEquipmentTabAsync() Tests

#### OWD-401: SaveEquipmentTabAsync updates equipment tab state
**Given**: Current EquipmentTab="equipment-current", new state="equipment-all"  
**When**: SaveEquipmentTabAsync("equipment-all") is called  
**Then**: UserDataService.PutAsync called with EquipmentTab="equipment-all", returns true

### OWD-500 Series: SaveMeteringgroupTabAsync() Tests

#### OWD-501: SaveMeteringgroupTabAsync updates meteringgroup tab state
**Given**: Current MeteringgroupTab="meteringgroup-current", new state="meteringgroup-historical"  
**When**: SaveMeteringgroupTabAsync("meteringgroup-historical") is called  
**Then**: UserDataService.PutAsync called with MeteringgroupTab="meteringgroup-historical", returns true

### OWD-600 Series: SaveMeteringseriesTabAsync() Tests

#### OWD-601: SaveMeteringseriesTabAsync updates meteringseries tab state
**Given**: Current MeteringseriesTab="meteringseries-current", new state="meteringseries-all"  
**When**: SaveMeteringseriesTabAsync("meteringseries-all") is called  
**Then**: UserDataService.PutAsync called with MeteringseriesTab="meteringseries-all", returns true

### OWD-700 Series: SavePropertyTabAsync() Tests

#### OWD-701: SavePropertyTabAsync updates property tab state
**Given**: Current PropertyTab="property-current", new state="property-historical"  
**When**: SavePropertyTabAsync("property-historical") is called  
**Then**: UserDataService.PutAsync called with PropertyTab="property-historical", returns true

### OWD-800 Series: SaveRetailerTabAsync() Tests

#### OWD-801: SaveRetailerTabAsync updates retailer tab state
**Given**: Current RetailerTab="retailer-current", new state="retailer-all"  
**When**: SaveRetailerTabAsync("retailer-all") is called  
**Then**: UserDataService.PutAsync called with RetailerTab="retailer-all", returns true

### OWD-900 Series: SaveCustomerTabAsync() Tests

#### OWD-901: SaveCustomerTabAsync updates customer tab state
**Given**: Current CustomerTab="tab-customer", new state="tab-customer-details"  
**When**: SaveCustomerTabAsync("tab-customer-details") is called  
**Then**: UserDataService.PutAsync called with CustomerTab="tab-customer-details", returns true

### OWD-1000 Series: SaveRelationTabAsync() Tests

#### OWD-1001: SaveRelationTabAsync updates relation tab state
**Given**: Current RelationTab="relation-current", new state="relation-all"  
**When**: SaveRelationTabAsync("relation-all") is called  
**Then**: UserDataService.PutAsync called with RelationTab="relation-all", returns true

### OWD-1100 Series: SaveWorkorderTabAsync() Tests

#### OWD-1101: SaveWorkorderTabAsync updates workorder tab state
**Given**: Current WorkorderTab="workorder-current", new state="workorder-completed"  
**When**: SaveWorkorderTabAsync("workorder-completed") is called  
**Then**: UserDataService.PutAsync called with WorkorderTab="workorder-completed", returns true

### OWD-1200 Series: Integration Tests

#### OWD-1201: Get then Save workflow
**Given**: UserData exists with default settings  
**When**: GetAsync called, then SaveDeliveryTabAsync with new state  
**Then**: Both operations succeed, delivery tab updated

#### OWD-1202: Multiple Save operations in sequence
**Given**: UserData with default settings  
**When**: SaveDeliveryTabAsync, then SaveDocumentTabAsync, then SaveEquipmentTabAsync called  
**Then**: All three updates succeed, UserDataService.PutAsync called 3 times

#### OWD-1203: Save all tabs
**Given**: UserData with default settings  
**When**: All 10 Save methods called with custom states  
**Then**: All tabs updated with new values

### Edge-1200 Series: Edge Cases

#### Edge-1201: SaveDeliveryTabAsync with empty string
**Given**: tabState=""  
**When**: SaveDeliveryTabAsync("") is called  
**Then**: DeliveryTab set to empty string, PutAsync succeeds

#### Edge-1202: SaveDeliveryTabAsync with null string
**Given**: tabState=null  
**When**: SaveDeliveryTabAsync(null) is called  
**Then**: DeliveryTab set to null, PutAsync called

#### Edge-1203: SaveDeliveryTabAsync with very long string
**Given**: tabState with 1000 characters  
**When**: SaveDeliveryTabAsync is called  
**Then**: Accepts long string, no validation

#### Edge-1204: UserDataService.PutAsync fails
**Given**: UserDataService.PutAsync returns false (save failed)  
**When**: Any Save method is called  
**Then**: Returns false to caller

## Test Coverage Summary

- **Total Test Cases:** 22
- **GetAsync() Tests:** 4 (OWD-101 to OWD-104)
- **Save Method Tests:** 10 (one per Save method OWD-201, 301, 401, etc.)
- **Property Preservation Tests:** 1 (OWD-202)
- **Return Value Tests:** 1 (OWD-203)
- **Integration Tests:** 3 (OWD-1201 to OWD-1203)
- **Edge Cases:** 4 (Edge-1201 to Edge-1204)

## Implementation Notes

### Mock Setup Pattern
```csharp
private IUserDataService _userDataService;
private OverviewWidgetDataService _service;

[SetUp]
public void SetUp()
{
    _userDataService = Substitute.For<IUserDataService>();
    _service = new OverviewWidgetDataService(_userDataService);
}
```

### Test Data Helpers
```csharp
private UserData CreateUserData(OverviewWidgetSettings settings = null)
{
    return new UserData
    {
        OverviewWidgetSettings = settings ?? new OverviewWidgetSettings()
    };
}

private OverviewWidgetSettings CreateDefaultSettings()
{
    return new OverviewWidgetSettings(); // Uses default constructor values
}

private OverviewWidgetSettings CreateCustomSettings()
{
    return new OverviewWidgetSettings
    {
        CustomerTab = "custom-customer",
        DeliveryTab = "custom-delivery",
        DocumentTab = "custom-document",
        EquipmentTab = "custom-equipment",
        MeteringgroupTab = "custom-meteringgroup",
        MeteringseriesTab = "custom-meteringseries",
        PropertyTab = "custom-property",
        RelationTab = "custom-relation",
        RetailerTab = "custom-retailer",
        WorkorderTab = "custom-workorder"
    };
}
```

### Testing Pattern for Save Methods
```csharp
[Test]
public async Task OWD_201_SaveDeliveryTabAsync_UpdatesDeliveryTabState()
{
    // Arrange
    var userData = CreateUserData();
    _userDataService.GetAsync().Returns(userData);
    _userDataService.PutAsync(Arg.Any<UserData>()).Returns(true);

    // Act
    var result = await _service.SaveDeliveryTabAsync("delivery-historical");

    // Assert
    Assert.That(result, Is.True);
    await _userDataService.Received(1).GetAsync();
    await _userDataService.Received(1).PutAsync(
        Arg.Is<UserData>(ud => ud.OverviewWidgetSettings.DeliveryTab == "delivery-historical"));
}
```

### Verification of Unchanged Properties
```csharp
[Test]
public async Task OWD_202_SaveDeliveryTabAsync_PreservesOtherTabStates()
{
    // Arrange
    var customSettings = CreateCustomSettings();
    var userData = CreateUserData(customSettings);
    _userDataService.GetAsync().Returns(userData);
    _userDataService.PutAsync(Arg.Any<UserData>()).Returns(true);

    // Act
    await _service.SaveDeliveryTabAsync("new-delivery-state");

    // Assert - Verify only DeliveryTab changed
    await _userDataService.Received(1).PutAsync(
        Arg.Is<UserData>(ud =>
            ud.OverviewWidgetSettings.DeliveryTab == "new-delivery-state" &&
            ud.OverviewWidgetSettings.CustomerTab == "custom-customer" &&
            ud.OverviewWidgetSettings.DocumentTab == "custom-document" &&
            ud.OverviewWidgetSettings.EquipmentTab == "custom-equipment" &&
            ud.OverviewWidgetSettings.MeteringgroupTab == "custom-meteringgroup" &&
            ud.OverviewWidgetSettings.MeteringseriesTab == "custom-meteringseries" &&
            ud.OverviewWidgetSettings.PropertyTab == "custom-property" &&
            ud.OverviewWidgetSettings.RelationTab == "custom-relation" &&
            ud.OverviewWidgetSettings.RetailerTab == "custom-retailer" &&
            ud.OverviewWidgetSettings.WorkorderTab == "custom-workorder"));
}
```

## Service Pattern Analysis

**Observation**: All 10 Save methods follow identical implementation pattern:
1. `var data = await userDataService.GetAsync();`
2. `data.OverviewWidgetSettings.XXXTab = tabState;`
3. `return await userDataService.PutAsync(data);`

**Code Quality Note**: This is a thin wrapper service with significant code duplication. Each Save method differs only in the property name being updated. This pattern is acceptable but could potentially be refactored using:
- Dictionary-based approach with property name mapping
- Expression trees for dynamic property access
- Single `SaveTabAsync(string tabName, string tabState)` method

However, current explicit approach has advantages:
- Clear, readable code
- Type-safe at compile time
- Easy to extend with tab-specific validation
- No reflection overhead

## Risk Assessment

**Low Risk:**
- Service is thin wrapper with simple pass-through logic
- No complex business rules or transformations
- Depends entirely on UserDataService behavior

**Potential Issues:**
- No null checking on UserData or OverviewWidgetSettings returned from GetAsync
- No validation on tabState input (accepts null, empty, very long strings)
- Multiple Get/Put calls for sequential Save operations (not batch-optimized)

## Dependencies

**NuGet Packages:**
- NUnit 3.14+
- NSubstitute 5.1+

**Types:**
- `UserData` - Container for user settings
- `OverviewWidgetSettings` - 10 string properties for tab states
- `IUserDataService` - Get/Put operations for UserData

**Default Tab States** (from OverviewWidgetSettings constructor):
- CustomerTab: "tab-customer"
- DeliveryTab: "delivery-current"
- DocumentTab: "document-all"
- EquipmentTab: "equipment-current"
- MeteringgroupTab: "meteringgroup-current"
- MeteringseriesTab: "meteringseries-current"
- PropertyTab: "property-current"
- RelationTab: "relation-current"
- RetailerTab: "retailer-current"
- WorkorderTab: "workorder-current"

---

**Test Plan Version:** 1.0  
**Created:** December 19, 2024  
**Author:** Test Planner Assistant

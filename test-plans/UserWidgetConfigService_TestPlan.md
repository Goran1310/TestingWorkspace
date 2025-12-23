# UserWidgetConfigService Test Plan

**Service:** `Perigon.Modules.MeteringPoint.Utils.Services.Meteringpoint360.UserWidgetConfigService`  
**Purpose:** Manages user widget template configurations for Meteringpoint360 overview  
**Test File:** `tests/Perigon.Modules.MeteringPoint.UnitTests/Utils/Services/Meteringpoint360/UserWidgetConfigServiceTests.cs`

## Service Overview

UserWidgetConfigService is a complex 650-line service that manages widget template configurations for users across different device types (Computer/Tablet). It handles:
- Default widget configurations (17+ widgets for Computer, 16+ for Tablet)
- User-customized templates (saving, loading, applying)
- Template management (create, retrieve, update)
- Session-based caching of current template selection
- Feature flag integration (FeatureV2: adds Relation and Workorder widgets)

**Dependencies:**
- `IUserWidgetConfigRepository` - Database operations for templates
- `IHttpContextAccessor` - Session access
- `IScreenResolutionService` - Device type detection
- `IStringLocalizer<SharedResource>` - Localization
- `IAppConfiguration<AppConfiguration>` - Realm configuration
- `IUserDataRepository` - User preference storage
- `IFeatureReleaseService` - Feature flag checks

## Testing Strategy

Given the service's complexity (13 public methods, 650 lines), tests focus on:
1. **Core scenarios** - Most frequently used methods
2. **Critical business logic** - Template selection, widget merging
3. **Edge cases** - Null handling, empty collections, feature flags

**Note:** Full coverage would require 60+ tests. This plan covers 20 essential scenarios.

---

## Test Scenarios

### UWCS-100 Series: GetDefaultConfiguration

Tests the foundational method that returns default widget setups.

#### UWCS-101: Returns Computer Configuration When Device Is Computer
**Input:** `DeviceType.Computer`, feature V2 disabled  
**Expected:**
- Device = Computer
- 17 widgets (Meteringpoint, Customer, Retailer, Metervalues, Maps, Address, etc.)
- No Relation or Workorder widgets

#### UWCS-102: Returns Tablet Configuration When Device Is Tablet
**Input:** `DeviceType.Tablet`, feature V2 disabled  
**Expected:**
- Device = Tablet
- 16 widgets with different width configurations
- ViewOrder matches device-specific layout

#### UWCS-103: Returns Computer Configuration When Device Is Null
**Input:** `null`  
**Expected:** Defaults to Computer configuration (17 widgets)

#### UWCS-104: Adds Feature V2 Widgets When Enabled
**Input:** `DeviceType.Computer`, feature V2 enabled  
**Expected:**
- 19 widgets (17 base + Relation + Workorder)
- Relation widget at ViewOrder 3
- Workorder widget at ViewOrder 18

---

### UWCS-200 Series: SaveUserWidgetTemplateSetup

Tests template saving logic with duplicate detection.

#### UWCS-201: Saves New Template Successfully
**Input:** New template with unique name  
**Mock:** Repository returns success (1)  
**Expected:** Returns 1 (success)

#### UWCS-202: Prevents Duplicate Template Names
**Input:** Template name that already exists  
**Mock:** Repository returns existing template with same name  
**Expected:** Returns 3 (duplicate error)

#### UWCS-203: Allows Editing Existing Template With Same Name
**Input:** Existing template (WidgetTemplateId > 0) with unchanged name  
**Expected:** Returns 1 (update success)

#### UWCS-204: Sets ViewReference And DeviceType
**Input:** Template without CcmViewId/CcmDeviceId  
**Expected:**
- Template.CcmViewId = ViewReference.MPOverview
- Template.CcmDeviceId matches input deviceType

---

### UWCS-300 Series: GetUserWidgetTemplateSetup (Overloads)

Tests retrieval of user templates.

#### UWCS-301: GetUserWidgetTemplateSetup Returns All User Templates
**Input:** `userName`  
**Mock:** Repository returns 3 templates (Computer, Tablet, master)  
**Expected:** Configs list contains 3 templates with deserialized WidgetSetup

#### UWCS-302: Filters Templates By DeviceType
**Input:** `userName`, `DeviceType.Computer`  
**Mock:** Repository returns mix of Computer and Tablet templates  
**Expected:** Only Computer templates in result

#### UWCS-303: Returns Single Template By WidgetTemplateId
**Input:** `userName`, `widgetTemplateId = 5`  
**Mock:** Repository returns template with ID 5  
**Expected:** UserWidgetTemplateSetup for template ID 5

#### UWCS-304: Excludes Templates From Different Realms
**Input:** `userName`, realm = "RealmA"  
**Mock:** Repository returns templates with realms "RealmA", "RealmB", and null  
**Expected:** Only "RealmA" and null realm templates included

---

### UWCS-400 Series: ApplyAnyNewWidgetChanges

Tests widget merging logic (adds new default widgets, removes obsolete ones).

#### UWCS-401: Preserves Existing User Widget Configuration
**Input:** User setup with 5 widgets (all still in defaults)  
**Expected:** All 5 widgets retained with original settings

#### UWCS-402: Adds New Widgets From Defaults
**Input:** User setup missing 2 new widgets from defaults  
**Expected:**
- Missing widgets added with Display=true
- ViewOrder = max(existing) + 1 for new widgets

#### UWCS-403: Removes Obsolete Widgets Not In Defaults
**Input:** User setup includes widget "Legacy" not in defaults  
**Expected:** "Legacy" widget removed from result

#### UWCS-404: Orders Widgets By ViewOrder
**Input:** Unordered widget list  
**Expected:** Result sorted by ViewOrder ascending

---

### UWCS-500 Series: GetOverviewUserWidgetTemplateSetup

Tests the main method that loads user's current template configuration.

#### UWCS-501: Returns User's Selected Template
**Input:** User has selected template "My Custom"  
**Mock:**
- Session returns "My Custom" as displayName
- Repository returns matching template
**Expected:**
- userWidgetSettings.DisplayName = "My Custom"
- setups contains all applicable templates

#### UWCS-502: Defaults To Standard When No Selection
**Input:** User has no saved template selection  
**Mock:** Session returns null/empty  
**Expected:**
- userWidgetSettings = Standard template
- IsMasterTemplate = true

#### UWCS-503: Applies New Widget Changes To Selected Template
**Input:** User template missing new default widgets  
**Expected:** Returned template includes new widgets (via ApplyAnyNewWidgetChanges)

#### UWCS-504: Falls Back To Standard On Exception
**Input:** Invalid displayName causes exception during retrieval  
**Expected:**
- userWidgetSettings = Standard template
- No exception thrown

---

### UWCS-600 Series: Session And UserData Management

Tests caching and persistence.

#### UWCS-601: SetCurrentUserWidgetTemplateSetup Saves To Session And DB
**Input:** `userName`, `templateSetup` with displayName "Custom"  
**Expected:**
- Session key set: "MPOverview-widgetTemplateSetupDisplayName" = "Custom"
- UserData repository called with key and value

#### UWCS-602: GetCurrentUserWidgetTemplateSetupDisplayName Returns Cached Value
**Input:** Session contains "My Setup"  
**Expected:** Returns "My Setup" (no DB call)

#### UWCS-603: Loads From DB When Session Empty
**Input:** Session empty, DB has saved displayName  
**Expected:**
- DB queried via GetStoredUserWidgetTemplateSetupDisplayNameAsync
- Returns DB value

---

## Test Case Reference Matrix

| Test ID | Method | Scenario | Priority |
|---------|--------|----------|----------|
| UWCS-101 | GetDefaultConfiguration | Computer defaults | HIGH |
| UWCS-102 | GetDefaultConfiguration | Tablet defaults | HIGH |
| UWCS-103 | GetDefaultConfiguration | Null device defaults | MEDIUM |
| UWCS-104 | GetDefaultConfiguration | Feature V2 widgets | HIGH |
| UWCS-201 | SaveUserWidgetTemplateSetup | Save new template | HIGH |
| UWCS-202 | SaveUserWidgetTemplateSetup | Duplicate prevention | HIGH |
| UWCS-203 | SaveUserWidgetTemplateSetup | Edit existing | MEDIUM |
| UWCS-204 | SaveUserWidgetTemplateSetup | Set view/device refs | MEDIUM |
| UWCS-301 | GetUserWidgetTemplateSetup | All templates | HIGH |
| UWCS-302 | GetUserWidgetTemplateSetup(device) | Filter by device | HIGH |
| UWCS-303 | GetUserWidgetTemplateSetup(id) | Single template | MEDIUM |
| UWCS-304 | GetUserWidgetTemplateSetup | Realm filtering | MEDIUM |
| UWCS-401 | ApplyAnyNewWidgetChanges | Preserve existing | HIGH |
| UWCS-402 | ApplyAnyNewWidgetChanges | Add new widgets | HIGH |
| UWCS-403 | ApplyAnyNewWidgetChanges | Remove obsolete | MEDIUM |
| UWCS-404 | ApplyAnyNewWidgetChanges | Sort by ViewOrder | MEDIUM |
| UWCS-501 | GetOverviewUserWidgetTemplateSetup | User selection | HIGH |
| UWCS-502 | GetOverviewUserWidgetTemplateSetup | Default fallback | HIGH |
| UWCS-503 | GetOverviewUserWidgetTemplateSetup | Apply widget changes | HIGH |
| UWCS-504 | GetOverviewUserWidgetTemplateSetup | Exception fallback | MEDIUM |
| UWCS-601 | SetCurrentUserWidgetTemplateSetup | Save session/DB | MEDIUM |
| UWCS-602 | GetCurrentUserWidgetTemplateSetupDisplayName | Session cache | MEDIUM |
| UWCS-603 | GetStoredUserWidgetTemplateSetupDisplayNameAsync | DB retrieval | MEDIUM |

**Total Tests:** 23 covering core functionality

---

## Widget Configuration Reference

### Computer (DeviceType.Computer) - 17 Base Widgets

| WidgetId | ViewOrder | Width | Display |
|----------|-----------|-------|---------|
| Meteringpoint | 0 | 16 | true |
| Customer | 1 | 5 | true |
| Retailer | 2 | 11 | true |
| Metervalues | 4 | 16 | true |
| Maps | 5 | 10 | true |
| address | 6 | 6 | true |
| Meteringseries | 7 | 16 | true |
| Hanport | 8 | 6 | true |
| Equipment | 9 | 10 | true |
| Technical | 10 | 6 | true |
| Delivery | 11 | 10 | true |
| Ledger | 12 | 6 | true |
| MarketMessages | 13 | 16 | true |
| Property | 14 | 16 | true |
| Statuslog | 15 | 16 | true |
| Document | 16 | 16 | true |
| MeteringGroup | 17 | 16 | true |

**Feature V2 Additions:**
- Relation (ViewOrder 3, Width 16)
- Workorder (ViewOrder 18, Width 16)

### Tablet (DeviceType.Tablet) - 16 Base Widgets

Different width allocations optimized for tablet screens (similar widget set).

---

## Implementation Notes

### Helper Methods Required

```csharp
private UserWidgetTemplate CreateTemplate(int? id = null, string name = "Test Template")
{
    return new UserWidgetTemplate
    {
        WidgetTemplateId = id,
        WidgetTemplateName = name,
        UserName = "testuser",
        Config = JsonConvert.SerializeObject(new List<UserWidgetSetup>
        {
            new UserWidgetSetup { WidgetId = "Widget1", ViewOrder = 1, Width = 16, Display = true }
        }),
        CcmViewId = ViewReference.MPOverview,
        CcmDeviceId = DeviceType.Computer
    };
}

private void SetupSessionData(string key, object value)
{
    var json = JsonConvert.SerializeObject(value);
    var bytes = Encoding.UTF8.GetBytes(json);
    _session.TryGetValue(key, out Arg.Any<byte[]>())
        .Returns(x => { x[1] = bytes; return true; });
}

private void SetupEmptySession()
{
    _session.TryGetValue(Arg.Any<string>(), out Arg.Any<byte[]>()).Returns(false);
}
```

### Mock Setup Patterns

**Feature Flag:**
```csharp
_featureReleaseService.FeatureIsEnabled(FeatureParameter.MeteringpointV2).Returns(true);
```

**Repository Returns:**
```csharp
_userWidgetConfigRepository.GetUserWidgetTemplates(Arg.Any<string>(), Arg.Any<int?>(), "testuser", Arg.Any<int?>())
    .Returns(new List<UserWidgetTemplate> { template1, template2 });
```

**AppConfiguration:**
```csharp
var appConfig = new AppConfiguration 
{ 
    RealmSettings = new RealmSettings { Realm = Realm.RealmA } 
};
_configuration.GetAsync().Returns(appConfig);
```

### Assertion Examples

**Widget Count:**
```csharp
Assert.That(result.WidgetSetup, Has.Count.EqualTo(17));
```

**Specific Widget:**
```csharp
var meteringpoint = result.WidgetSetup.FirstOrDefault(w => w.WidgetId == "Meteringpoint");
Assert.Multiple(() =>
{
    Assert.That(meteringpoint, Is.Not.Null);
    Assert.That(meteringpoint.ViewOrder, Is.EqualTo(0));
    Assert.That(meteringpoint.Width, Is.EqualTo(16));
});
```

**Sorted Order:**
```csharp
Assert.That(result.WidgetSetup, Is.Ordered.By("ViewOrder"));
```

---

## Potential Issues Identified

1. **No null handling** - `GetUserWidgetTemplateConfig` returns empty template on exception (silent failure)
2. **Session dependency** - Service uses `ctx.HttpContext!.Session` (throws NullReferenceException if HttpContext null)
3. **Empty catch blocks** - Multiple methods swallow exceptions without logging
4. **Magic strings** - Widget IDs hardcoded throughout ("Meteringpoint", "Customer", etc.)
5. **Complex deserialization** - JSON.NET settings with `ObjectCreationHandling.Replace` may mask errors

**Recommendations:**
- Add null guards for HttpContext (similar to ScreenResolutionService fix)
- Log exceptions instead of silently catching
- Extract widget configuration to constants or configuration file
- Add validation for deserialized widget setups

---

## Test Execution

**Command:**
```bash
dotnet test --filter "FullyQualifiedName~UserWidgetConfigServiceTests" --verbosity normal
```

**Expected:**
- 23 tests passing
- ~5 seconds execution time

---

**Created:** December 19, 2024  
**Service Lines:** 650  
**Public Methods:** 13  
**Test Coverage:** 23 essential tests (full coverage would require 60+)

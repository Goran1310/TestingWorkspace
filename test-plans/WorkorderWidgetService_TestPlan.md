# WorkorderWidgetService Test Plan

## Service Overview

**Namespace:** `Perigon.Modules.MeteringPoint.Utils.Services.Meteringpoint360.Widgets`  
**Service:** `WorkorderWidgetService`  
**Dependencies:** 
- `IWorkorderWidgetRepository`
- `IMapper` (AutoMapper)

**Public Methods:**
1. `Task<WorkorderVM> GetWorkorderWidgetAsync(int inMp)` - Retrieves workorders for a metering point with filtering
2. `Task<WorkorderSelections> GetWorkorderDropdownSelectionsAsync()` - Retrieves dropdown selections for workorder forms
3. `Task<int> PostNewWorkorderAsync(CaseInformationVM caseVM)` - Creates new workorder and returns case ID

## Service Architecture

### GetWorkorderWidgetAsync Logic
- Calls repository to get workorder list
- If null/empty → returns `WorkorderVM { HasData = false }`
- If data exists:
  - Maps all workorders to `AllWorkorders`
  - Filters active/future (EndDate == null or >= today) to `ActiveAndFuture`
  - Orders ActiveAndFuture by CaseNo descending
  - Sets `HasData = true`

### GetWorkorderDropdownSelectionsAsync Logic
- Direct passthrough to repository
- Returns WorkorderSelections with dropdown lists

### PostNewWorkorderAsync Logic
- Maps CaseInformationVM → Workorder DTO
- Calls repository to create workorder
- Returns generated case ID

## Test Series

### WOWS-100: GetWorkorderWidgetAsync - Basic Retrieval

**WOWS-101: GetWorkorderWidgetAsync Returns Data When Workorders Exist**
- **Arrange**: Repository returns 5 workorders (mix of active, future, completed)
- **Act**: Call GetWorkorderWidgetAsync(123)
- **Assert**:
  - HasData = true
  - AllWorkorders.Count = 5
  - All fields mapped correctly (CaseNo, StatusNo, Header, etc.)

**WOWS-102: GetWorkorderWidgetAsync Returns Empty ViewModel When Repository Returns Null**
- **Arrange**: Repository returns null
- **Act**: Call GetWorkorderWidgetAsync(123)
- **Assert**:
  - HasData = false
  - ActiveAndFuture = null
  - AllWorkorders = null

**WOWS-103: GetWorkorderWidgetAsync Returns Empty ViewModel When Repository Returns Empty List**
- **Arrange**: Repository returns empty list `new List<WorkorderWidget>()`
- **Act**: Call GetWorkorderWidgetAsync(123)
- **Assert**:
  - HasData = false
  - ActiveAndFuture = null
  - AllWorkorders = null

### WOWS-200: GetWorkorderWidgetAsync - ActiveAndFuture Filtering

**WOWS-201: ActiveAndFuture Includes Workorders With Null EndDate**
- **Arrange**: Repository returns 3 workorders with EndDate = null
- **Act**: Call GetWorkorderWidgetAsync(123)
- **Assert**: ActiveAndFuture.Count = 3

**WOWS-202: ActiveAndFuture Includes Workorders With Future EndDate**
- **Arrange**: 
  - Current date: 2024-12-19
  - Repository returns workorders with EndDate = 2024-12-20, 2024-12-25, 2025-01-01
- **Act**: Call GetWorkorderWidgetAsync(123)
- **Assert**: ActiveAndFuture.Count = 3

**WOWS-203: ActiveAndFuture Includes Workorders With Today EndDate**
- **Arrange**: 
  - Current date: 2024-12-19 (assumes DateTime.Now.Date comparison)
  - Repository returns workorder with EndDate = 2024-12-19
- **Act**: Call GetWorkorderWidgetAsync(123)
- **Assert**: ActiveAndFuture contains workorder (EndDate >= now.Date)

**WOWS-204: ActiveAndFuture Excludes Workorders With Past EndDate**
- **Arrange**: 
  - Current date: 2024-12-19
  - Repository returns 5 workorders: 2 past (EndDate < today), 3 active/future
- **Act**: Call GetWorkorderWidgetAsync(123)
- **Assert**: 
  - AllWorkorders.Count = 5
  - ActiveAndFuture.Count = 3
  - Past workorders not in ActiveAndFuture

**WOWS-205: ActiveAndFuture Excludes All When All Workorders Have Past EndDates**
- **Arrange**: Repository returns 3 workorders all with EndDate < today
- **Act**: Call GetWorkorderWidgetAsync(123)
- **Assert**: 
  - HasData = true (data exists)
  - AllWorkorders.Count = 3
  - ActiveAndFuture.Count = 0

### WOWS-300: GetWorkorderWidgetAsync - Ordering and Mapping

**WOWS-301: ActiveAndFuture Ordered By CaseNo Descending**
- **Arrange**: Repository returns workorders with CaseNo: 100, 200, 150, 300
- **Act**: Call GetWorkorderWidgetAsync(123)
- **Assert**: ActiveAndFuture ordered as [300, 200, 150, 100]

**WOWS-302: AllWorkorders Preserves Repository Order**
- **Arrange**: Repository returns workorders in order: CaseNo 200, 100, 300
- **Act**: Call GetWorkorderWidgetAsync(123)
- **Assert**: AllWorkorders maintains order [200, 100, 300]

**WOWS-303: Mapper Correctly Maps All WorkorderWidget Properties**
- **Arrange**: Repository returns workorder with all properties set
- **Act**: Call GetWorkorderWidgetAsync(123)
- **Assert**: Verify all properties mapped:
  - CaseNo, StatusNo, StatusName
  - NotificationCodeNo, NotificationCodeName
  - Header, Message, Receiver
  - ReceiverGroupId, ReceiverGroupName
  - CreatedDate, EditedDate, EndDate

### WOWS-400: GetWorkorderDropdownSelectionsAsync

**WOWS-401: GetWorkorderDropdownSelectionsAsync Returns Selections**
- **Arrange**: Repository returns WorkorderSelections with 10 populated lists
- **Act**: Call GetWorkorderDropdownSelectionsAsync()
- **Assert**: 
  - Result not null
  - All lists populated (ReferenceNames, Senders, Recipients, etc.)

**WOWS-402: GetWorkorderDropdownSelectionsAsync Handles Empty Selections**
- **Arrange**: Repository returns WorkorderSelections with empty lists
- **Act**: Call GetWorkorderDropdownSelectionsAsync()
- **Assert**: Returns empty WorkorderSelections (no exception)

**WOWS-403: GetWorkorderDropdownSelectionsAsync Handles Null Return**
- **Arrange**: Repository returns null
- **Act**: Call GetWorkorderDropdownSelectionsAsync()
- **Assert**: Result is null (no exception)

### WOWS-500: PostNewWorkorderAsync

**WOWS-501: PostNewWorkorderAsync Creates Workorder Successfully**
- **Arrange**: 
  - CaseInformationVM with MeteringpointNo = 123
  - Repository returns case ID = 5000
- **Act**: Call PostNewWorkorderAsync(caseVM)
- **Assert**: 
  - Result = 5000
  - Repository.PostNewWorkorderAsync called with mapped Workorder

**WOWS-502: PostNewWorkorderAsync Maps CaseInformationVM to Workorder Correctly**
- **Arrange**: CaseInformationVM with all properties set
- **Act**: Call PostNewWorkorderAsync(caseVM)
- **Assert**: Repository received Workorder with matching properties

**WOWS-503: PostNewWorkorderAsync Returns CaseId From Repository**
- **Arrange**: Repository returns case ID = 7890
- **Act**: Call PostNewWorkorderAsync(caseVM)
- **Assert**: Result = 7890

### Edge-600: Edge Cases

**Edge-601: GetWorkorderWidgetAsync Handles Large Dataset**
- **Arrange**: Repository returns 1000 workorders
- **Act**: Call GetWorkorderWidgetAsync(123)
- **Assert**: No performance issues, all mapped

**Edge-602: GetWorkorderWidgetAsync Handles Mixed Null EndDates**
- **Arrange**: Repository returns workorders with mix of null, past, present, future EndDates
- **Act**: Call GetWorkorderWidgetAsync(123)
- **Assert**: Correctly filters and orders

**Edge-603: PostNewWorkorderAsync Handles Minimal CaseInformationVM**
- **Arrange**: CaseInformationVM with only MeteringpointNo set (other fields null)
- **Act**: Call PostNewWorkorderAsync(caseVM)
- **Assert**: No exception, repository called correctly

## Test Data Reference

### Sample WorkorderWidget DTO
```csharp
new WorkorderWidget
{
    CaseNo = 12345,
    StatusNo = 1,
    StatusName = "Open",
    NotificationCodeNo = 10,
    NotificationCodeName = "Meter Issue",
    Header = "Meter Replacement Required",
    Message = "Customer reported faulty meter",
    Receiver = "john.smith@company.com",
    ReceiverGroupId = 5,
    ReceiverGroupName = "Field Services",
    CreatedDate = new DateTime(2024, 12, 1),
    EditedDate = new DateTime(2024, 12, 15),
    EndDate = new DateTime(2024, 12, 31)
}
```

### Sample CaseInformationVM
```csharp
new CaseInformationVM
{
    MeteringpointNo = 123,
    Title = "New Workorder",
    Description = "Test workorder creation",
    Sender = "user@test.com",
    Recipient = "admin@test.com",
    Status = new GeneralDictionary { Id = 1, Name = "Open" }
}
```

### Sample WorkorderSelections
```csharp
new WorkorderSelections
{
    ReferenceNames = new List<GeneralDictionary> { new() { Id = 1, Name = "Ref1" } },
    Senders = new List<GeneralDictionary> { new() { Id = 1, Name = "Sender1" } },
    Recipients = new List<GeneralDictionary> { new() { Id = 1, Name = "Recipient1" } },
    StatusList = new List<GeneralDictionary> { new() { Id = 1, Name = "Open" } },
    MainDialogues = new List<MainDialogue> { new() { Id = 1, Name = "Main1" } },
    SubDialogues = new List<SubDialogue> { new() { Id = 1, Name = "Sub1", ParentId = 1 } }
}
```

## Helper Methods

### CreateWorkorderWidget
```csharp
private WorkorderWidget CreateWorkorderWidget(int caseNo, DateTime? endDate = null)
{
    return new WorkorderWidget
    {
        CaseNo = caseNo,
        StatusNo = 1,
        StatusName = "Open",
        NotificationCodeNo = 10,
        NotificationCodeName = "Standard",
        Header = $"Workorder {caseNo}",
        Message = "Test message",
        Receiver = "test@test.com",
        ReceiverGroupId = 1,
        ReceiverGroupName = "Group1",
        CreatedDate = DateTime.Now.AddDays(-10),
        EditedDate = DateTime.Now.AddDays(-5),
        EndDate = endDate
    };
}
```

### CreateCaseInformationVM
```csharp
private CaseInformationVM CreateCaseInformationVM(int meteringpointNo)
{
    return new CaseInformationVM
    {
        MeteringpointNo = meteringpointNo,
        Title = "Test Workorder",
        Description = "Test description",
        Sender = "sender@test.com",
        Recipient = "recipient@test.com"
    };
}
```

## Mock Setup Patterns

### Repository Mock - GetWorkorderWidgetAsync
```csharp
var workorders = new List<WorkorderWidget>
{
    CreateWorkorderWidget(100, null),  // Active (no end date)
    CreateWorkorderWidget(200, DateTime.Now.AddDays(10)),  // Future
    CreateWorkorderWidget(300, DateTime.Now.AddDays(-5))  // Past
};
_repository.GetWorkorderWidgetAsync(123).Returns(workorders);
```

### Mapper Mock - WorkorderWidget → WorkorderWidgetVM
```csharp
_mapper.Map<List<WorkorderWidgetVM>>(Arg.Any<List<WorkorderWidget>>())
    .Returns(args => 
    {
        var source = args.Arg<List<WorkorderWidget>>();
        return source.Select(w => new WorkorderWidgetVM
        {
            CaseNo = w.CaseNo,
            StatusNo = w.StatusNo,
            StatusName = w.StatusName,
            NotificationCodeNo = w.NotificationCodeNo,
            NotificationCodeName = w.NotificationCodeName,
            Header = w.Header,
            Message = w.Message,
            Receiver = w.Receiver,
            ReceiverGroupId = w.ReceiverGroupId,
            ReceiverGroupName = w.ReceiverGroupName,
            CreatedDate = w.CreatedDate,
            EditedDate = w.EditedDate,
            EndDate = w.EndDate
        }).ToList();
    });
```

### Mapper Mock - CaseInformationVM → Workorder
```csharp
_mapper.Map<Workorder>(Arg.Any<CaseInformationVM>())
    .Returns(args =>
    {
        var source = args.Arg<CaseInformationVM>();
        return new Workorder
        {
            MeteringpointNo = source.MeteringpointNo,
            Title = source.Title,
            Description = source.Description,
            Sender = source.Sender,
            Recipient = source.Recipient
        };
    });
```

## Testing Considerations

### DateTime.Now Testing
The service uses `DateTime.Now` for filtering, which can cause flaky tests. Consider:
- Using fixed dates in test setup
- Mocking DateTime (if infrastructure supports it)
- Ensuring test dates are relative (e.g., DateTime.Now.AddDays(-1))

### AutoMapper Configuration
- Mapper must be configured to map WorkorderWidget → WorkorderWidgetVM
- Mapper must be configured to map CaseInformationVM → Workorder
- Use `Arg.Is<T>()` if mapper creates new objects internally

### Known Issues/Observations
1. **No null handling**: Service doesn't check if repository is null
2. **No null handling**: Service doesn't check if mapper is null
3. **DateTime.Now dependency**: Makes date-based filtering hard to test consistently
4. **No validation**: PostNewWorkorderAsync doesn't validate CaseInformationVM
5. **No exception handling**: Service doesn't catch repository/mapper exceptions

## Test Coverage Summary

| Method | Test Scenarios | Edge Cases |
|--------|---------------|------------|
| GetWorkorderWidgetAsync | 9 tests (data retrieval, filtering, mapping, ordering) | 3 tests |
| GetWorkorderDropdownSelectionsAsync | 3 tests (populated, empty, null) | - |
| PostNewWorkorderAsync | 3 tests (create, mapping, return value) | 1 test |
| **Total** | **15 tests** | **3 edge tests** |

**Total Test Count:** 18 tests

## Priority Test Implementation

### Must-Have (12 tests):
- WOWS-101, WOWS-102, WOWS-103 (basic retrieval)
- WOWS-201, WOWS-204 (filtering logic)
- WOWS-301 (ordering)
- WOWS-303 (mapping)
- WOWS-401 (dropdown selections)
- WOWS-501, WOWS-502, WOWS-503 (create workorder)
- Edge-602 (mixed dates)

### Should-Have (6 tests):
- WOWS-202, WOWS-203, WOWS-205 (additional filtering scenarios)
- WOWS-302 (order preservation)
- WOWS-402, WOWS-403 (edge cases for dropdowns)

## Expected Outcomes

After implementation:
- 18 tests total
- 95%+ pass rate expected
- Core functionality (retrieve, filter, create) fully validated
- AutoMapper integration verified
- Date filtering logic confirmed working

---

**Test Plan Created:** December 19, 2024  
**Service Complexity:** Low (3 simple methods)  
**Estimated Implementation Time:** 1 hour  
**Dependencies:** IWorkorderWidgetRepository, IMapper

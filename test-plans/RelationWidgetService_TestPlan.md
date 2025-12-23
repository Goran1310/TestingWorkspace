# RelationWidgetService Test Plan

## Service Overview
**Service**: `RelationWidgetService`  
**Module**: Perigon.Modules.MeteringPoint  
**Location**: `Utils/Services/Meteringpoint360/RelationWidgetService.cs`  
**Purpose**: Retrieves and enriches metering point relation data with type names

## Dependencies
- `IRelationWidgetRepository` - Data access for relations
- `IPtabRepository` - Retrieval of relation type metadata
- `IMapper` - AutoMapper for DTO→ViewModel transformation

## Service Methods

### GetRelationWidgetAsync(int mp)
Retrieves relation data for a metering point, enriches with type names, and categorizes into active/future vs all relations.

**Business Logic**:
1. Fetch raw relation data from repository by metering point number
2. Return empty result (`HasData = false`) if no data found
3. Fetch relation type lookup data from ptab repository
4. Enrich each relation with `RelationTypeName` via lookup
5. Map to ViewModels and categorize:
   - `ActiveAndFuture`: `ToDate > DateTime.Now.Date`, ordered by `FromDate` descending
   - `AllRelations`: All relations unfiltered
6. Return populated `RelationsVM` with `HasData = true`

## Test Plan

### RW-100 Series: GetRelationWidgetAsync - Basic Scenarios

**RW-101: GetRelationWidgetAsync_ReturnsEmptyResult_WhenRepositoryReturnsNull**
- **Setup**: `relationWidgetRepository.GetRelationWidgetAsync(mp)` returns `null`
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: `HasData = false`, empty lists, `ptab.GetRelations()` not called

**RW-102: GetRelationWidgetAsync_ReturnsEmptyResult_WhenRepositoryReturnsEmptyList**
- **Setup**: Repository returns `new List<RelationWidgetDto>()`
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: `HasData = false`, empty lists

**RW-103: GetRelationWidgetAsync_EnrichesRelationTypeName_WhenTypeExists**
- **Setup**:
  - Repository returns 1 relation with `RelationTypeNo = 5`
  - Ptab returns relation type `{ RelationTypeNo = 5, RelationTypeName = "Parent-Child" }`
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: Result has `RelationTypeName = "Parent-Child"` enriched

**RW-104: GetRelationWidgetAsync_LeavesTypeNameNull_WhenTypeNotFound**
- **Setup**:
  - Repository returns relation with `RelationTypeNo = 99`
  - Ptab returns types not including 99
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: `RelationTypeName = null` (FirstOrDefault returns null)

### RW-200 Series: Active/Future Filtering

**RW-201: GetRelationWidgetAsync_FiltersActiveAndFuture_ByToDate**
- **Setup**: Repository returns 3 relations:
  - Relation A: `ToDate = DateTime.Now.AddDays(10)` (future)
  - Relation B: `ToDate = DateTime.Now.AddDays(-5)` (past)
  - Relation C: `ToDate = DateTime.Now.AddYears(1)` (future)
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**:
  - `ActiveAndFuture` contains 2 items (A, C)
  - `AllRelations` contains 3 items

**RW-202: GetRelationWidgetAsync_OrdersActiveAndFutureByFromDateDescending**
- **Setup**: Repository returns 3 future relations:
  - Relation A: `FromDate = 2025-01-01`, `ToDate = 2025-12-31`
  - Relation B: `FromDate = 2024-06-01`, `ToDate = 2026-01-01`
  - Relation C: `FromDate = 2024-12-01`, `ToDate = 2025-06-01`
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: `ActiveAndFuture` ordered [A, C, B] by `FromDate` descending

**RW-203: GetRelationWidgetAsync_IncludesRelationWithTodayAsToDate**
- **Setup**: Relation with `ToDate = DateTime.Now.Date` (edge case: exact boundary)
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: **NOT** in `ActiveAndFuture` (condition is `> DateTime.Now.Date`, not `>=`)

**RW-204: GetRelationWidgetAsync_IncludesRelationWithTomorrowAsToDate**
- **Setup**: Relation with `ToDate = DateTime.Now.Date.AddDays(1)`
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: Included in `ActiveAndFuture`

### RW-300 Series: Mapping and Data Integrity

**RW-301: GetRelationWidgetAsync_MapsAllPropertiesToViewModel**
- **Setup**: Repository returns complete DTO with all properties populated
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: Verify all properties mapped correctly (SiteRelationNo, ParentMeteringpointNo, ChildMeteringpointNo, FromDate, ToDate, RelationTypeNo, RelationTypeName)

**RW-302: GetRelationWidgetAsync_PreservesAllRelationsUnfiltered**
- **Setup**: Repository returns 5 relations (2 past, 3 future)
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: `AllRelations.Count = 5` (no filtering applied)

**RW-303: GetRelationWidgetAsync_SetsHasDataTrue_WhenDataExists**
- **Setup**: Repository returns any non-empty list
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: `HasData = true`

### RW-400 Series: Multiple Type Enrichment

**RW-401: GetRelationWidgetAsync_EnrichesMultipleRelationsWithDifferentTypes**
- **Setup**:
  - Relations: TypeNo 1, 2, 3
  - Ptab returns types: `{ 1: "Type A", 2: "Type B", 3: "Type C" }`
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: Each relation has correct `RelationTypeName` based on `RelationTypeNo`

**RW-402: GetRelationWidgetAsync_HandlesPartialTypeMatches**
- **Setup**:
  - Relations: TypeNo 1, 2, 99
  - Ptab returns: `{ 1: "Type A", 2: "Type B" }` (no 99)
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**:
  - Relation 1 and 2 enriched
  - Relation 99 has `null` RelationTypeName

### RW-500 Series: Integration Workflows

**RW-501: GetRelationWidgetAsync_CallsBothRepositories_InCorrectSequence**
- **Setup**: Mock both repositories with data
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**:
  - `relationWidgetRepository.GetRelationWidgetAsync(123)` called once
  - `ptab.GetRelations()` called once
  - Calls occur in correct order

**RW-502: GetRelationWidgetAsync_UsesMapperForTransformation**
- **Setup**: Repository returns DTO data
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: `mapper.Map<List<RelationWidgetVM>>()` called twice (ActiveAndFuture, AllRelations)

### Edge-600 Series: Edge Cases

**Edge-601: GetRelationWidgetAsync_HandlesEmptyPtabRelations**
- **Setup**:
  - Repository returns relations with TypeNo values
  - `ptab.GetRelations()` returns empty list
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: All `RelationTypeName` values are `null`, no exceptions

**Edge-602: GetRelationWidgetAsync_HandlesNullPtabRelations**
- **Setup**: `ptab.GetRelations()` returns `null`
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: `NullReferenceException` when calling `FirstOrDefault()` on null collection
  - **Note**: This is a potential bug - service should handle null ptab response

**Edge-603: GetRelationWidgetAsync_HandlesLargeDataset**
- **Setup**: Repository returns 1000 relations
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: All processed correctly, performance acceptable

**Edge-604: GetRelationWidgetAsync_HandlesRepositoryException**
- **Setup**: `relationWidgetRepository.GetRelationWidgetAsync()` throws exception
- **Action**: Call `GetRelationWidgetAsync(123)`
- **Expected**: Exception propagates to caller (no try-catch in service)

## Test Coverage Summary
- **Total Test Cases**: 22
- **Basic Scenarios**: 4 (RW-100 series)
- **Active/Future Filtering**: 4 (RW-200 series)
- **Mapping/Integrity**: 3 (RW-300 series)
- **Multiple Type Enrichment**: 2 (RW-400 series)
- **Integration**: 2 (RW-500 series)
- **Edge Cases**: 4 (Edge-600 series)

## Key Testing Patterns
1. **Date Boundary Testing**: Critical for `ToDate > DateTime.Now.Date` logic
2. **Type Enrichment**: Verify `FirstOrDefault()` lookup with matching/non-matching types
3. **Filtering vs Full List**: Ensure `ActiveAndFuture` filters correctly while `AllRelations` contains all
4. **Ordering**: Descending `FromDate` validation in filtered list
5. **Null Handling**: Repository nulls, empty lists, missing type matches

## Potential Issues Identified
1. **Edge-602**: Service does not handle `null` return from `ptab.GetRelations()` - will throw `NullReferenceException` on `FirstOrDefault()`
   - **Severity**: Low (unlikely scenario if repository contract enforced)
   - **Recommendation**: Add null check or ensure repository never returns null
2. **AutoMapper Dependency**: Service uses AutoMapper (legacy pattern at Hansen) - acceptable for existing code but not for new services
3. **Date Comparison**: Uses `DateTime.Now.Date` which can cause timezone issues in distributed systems - acceptable for current implementation

## Implementation Notes
- Service is thin wrapper combining repository data with type enrichment
- Filtering logic straightforward: `ToDate > DateTime.Now.Date`
- Type name enrichment done via `FirstOrDefault()` lookup
- Two mapper calls required (filtered list + full list)
- No caching, session state, or complex business logic

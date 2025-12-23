# Test Plan: MetervaluesWidgetService

## Overview
This test plan covers the `MetervaluesWidgetService` class located in `Perigon.Modules.MeteringPoint.Utils.Services.Meteringpoint360`.

## Service Description
The `MetervaluesWidgetService` provides functionality for retrieving meter values, getting meter value request types, and inserting meter value request types for metering points.

## Dependencies
- `IMetervaluesWidgetRepository` - Repository for data access

## Methods to Test

### 1. GetValuesAsync
**Signature:** `Task<MetervaluesWidget> GetValuesAsync(int meteringpointno, DateTime? startdate, DateTime? enddate)`

**Purpose:** Retrieves meter values for a specific metering point within an optional date range.

**Test Cases:**

| Test ID | Test Name | Input | Expected Behavior | Priority |
|---------|-----------|-------|-------------------|----------|
| MVWS-001 | GetValuesAsync_WithValidMeteringPointAndDates_ReturnsWidget | meteringpointno=12345, startdate=2025-01-01, enddate=2025-12-31 | Returns populated MetervaluesWidget | High |
| MVWS-002 | GetValuesAsync_WithValidMeteringPointNoDates_ReturnsWidget | meteringpointno=12345, startdate=null, enddate=null | Returns MetervaluesWidget (repository handles null dates) | High |
| MVWS-003 | GetValuesAsync_WithNonExistentMeteringPoint_ReturnsEmptyWidget | meteringpointno=99999 | Returns empty/null MetervaluesWidget | Medium |
| MVWS-004 | GetValuesAsync_WithOnlyStartDate_ReturnsWidget | meteringpointno=12345, startdate=2025-01-01, enddate=null | Returns MetervaluesWidget | Medium |
| MVWS-005 | GetValuesAsync_WithOnlyEndDate_ReturnsWidget | meteringpointno=12345, startdate=null, enddate=2025-12-31 | Returns MetervaluesWidget | Medium |
| MVWS-006 | GetValuesAsync_WithRepositoryException_ThrowsException | meteringpointno=12345 | Propagates repository exception | High |
| MVWS-007 | GetValuesAsync_WithProductionValues_ReturnsWidgetWithProduction | meteringpointno=12345 | Returns widget with ProductionValues populated | Medium |
| MVWS-008 | GetValuesAsync_WithConsumptionValues_ReturnsWidgetWithConsumption | meteringpointno=12345 | Returns widget with ConsumptionValues populated | Medium |

### 2. GetMeterValueRequestTypes
**Signature:** `Task<List<RequestTypes>> GetMeterValueRequestTypes(int meteringpointno)`

**Purpose:** Retrieves available meter value request types for a specific metering point.

**Test Cases:**

| Test ID | Test Name | Input | Expected Behavior | Priority |
|---------|-----------|-------|-------------------|----------|
| MVWS-101 | GetMeterValueRequestTypes_WithValidMeteringPoint_ReturnsRequestTypes | meteringpointno=12345 | Returns list of RequestTypes | High |
| MVWS-102 | GetMeterValueRequestTypes_WithNonExistentMeteringPoint_ReturnsEmptyList | meteringpointno=99999 | Returns empty list | Medium |
| MVWS-103 | GetMeterValueRequestTypes_WithMultipleRequestTypes_ReturnsAllTypes | meteringpointno=12345 | Returns list with multiple RequestTypes | Medium |
| MVWS-104 | GetMeterValueRequestTypes_WithRepositoryException_ThrowsException | meteringpointno=12345 | Propagates repository exception | High |

### 3. InsertMVRequestTypes
**Signature:** `Task<int> InsertMVRequestTypes(MetevaluesdatesVM form)`

**Purpose:** Inserts a meter value request type record based on the provided form data.

**Test Cases:**

| Test ID | Test Name | Input | Expected Behavior | Priority |
|---------|-----------|-------|-------------------|----------|
| MVWS-201 | InsertMVRequestTypes_WithValidForm_ReturnsInsertedId | Valid MetevaluesdatesVM with all fields | Returns inserted ID (int) | High |
| MVWS-202 | InsertMVRequestTypes_WithMultipleRequestTypes_UsesFirstRequestType | MetevaluesdatesVM with multiple RequestTypes | Uses FirstOrDefault() RequestTypeNo | High |
| MVWS-203 | InsertMVRequestTypes_WithSingleRequestType_UsesRequestType | MetevaluesdatesVM with single RequestType | Uses the RequestTypeNo | Medium |
| MVWS-204 | InsertMVRequestTypes_WithNullDates_UsesDefaultDates | MetevaluesdatesVM with null dates | Uses default dates from Metervaluesdates | Medium |
| MVWS-205 | InsertMVRequestTypes_WithRepositoryException_ThrowsException | Valid form | Propagates repository exception | High |
| MVWS-206 | InsertMVRequestTypes_MapsFormToMetervaluesdates_CorrectlyMapsFields | Valid MetevaluesdatesVM | All fields mapped correctly (Fromdate, Todate, MeteringpointNo, RequestTypeNo) | High |
| MVWS-207 | InsertMVRequestTypes_WithEmptyRequestTypesList_HandlesGracefully | MetevaluesdatesVM with empty RequestTypes list | Should handle FirstOrDefault() returning null | High |

## Mock Setup Requirements

### Repository Mock
- **IMetervaluesWidgetRepository**
  - `GetValues(int meteringpointno, DateTime? startdate, DateTime? enddate)` - Return mock MetervaluesWidget
  - `GetMeterValueRequestTypes(int meteringpointno)` - Return mock List<RequestTypes>
  - `InsertMVRequestTypes(Metervaluesdates request)` - Return mock int (inserted ID)

## Test Data Models

### MetervaluesWidget
```csharp
{
    ProductionValues = List<MetervaluesDTO>,
    Production = int?,
    ConsumptionValues = List<MetervaluesDTO>,
    Consumption = int?
}
```

### MetervaluesDTO
```csharp
{
    Volume = decimal,
    Dato = string,
    Measured = int?,
    Estimated = int?
}
```

### RequestTypes
```csharp
{
    RequestTypeNo = int,
    RequestTypeName = string
}
```

### MetevaluesdatesVM
```csharp
{
    Fromdate = DateTime?,
    Todate = DateTime?,
    MeteringpointNo = int?,
    RequestTypes = List<RequestTypes>
}
```

### Metervaluesdates (DTO created by service)
```csharp
{
    Fromdate = DateTime?,
    Todate = DateTime?,
    MeteringpointNo = int?,
    RequestTypeNo = int
}
```

## Edge Cases & Special Considerations

1. **Date Handling:** The service passes nullable dates to the repository - ensure null handling is tested
2. **FirstOrDefault() Usage:** InsertMVRequestTypes uses FirstOrDefault() on RequestTypes list - test with empty list
3. **Direct Pass-through:** Most methods are simple pass-throughs to repository - focus on proper mapping and parameter passing
4. **Field Mapping:** InsertMVRequestTypes maps from VM to DTO - verify all fields are correctly mapped

## Priority Summary
- **High Priority:** 12 tests (Core functionality, exception handling, field mapping)
- **Medium Priority:** 8 tests (Edge cases, variations)
- **Total Tests:** 20

## Estimated Implementation Time
- Setup and infrastructure: 30 minutes
- Test implementation: 2-3 hours
- Review and refinement: 30 minutes
- **Total:** ~3-4 hours

## Success Criteria
- ✅ All 20 test cases implemented
- ✅ Code coverage > 95%
- ✅ All tests passing
- ✅ Edge cases handled properly
- ✅ Repository interactions properly mocked
- ✅ Field mapping validated

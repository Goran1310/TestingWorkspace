# TechnicalService Test Plan

## Service Overview
**Service**: `TechnicalService`  
**Module**: Perigon.Modules.MeteringPoint  
**Location**: `Utils/Services/Meteringpoint360/TechnicalService.cs`  
**Purpose**: Retrieves and enriches technical data for metering points with power calculations and type name lookups

## Dependencies
- `ITechnicalRepository` - Data access for technical information
- `IPtabRepository` - Lookup data for grid types, cable materials, and cable methods
- `IMapper` - AutoMapper for DTO→ViewModel transformation

## Service Methods

### GetValuesAsync(int meteringPointNo)
Retrieves technical data and calculates power values for three fuse types.

**Business Logic**:
1. Fetch raw technical data from repository
2. Calculate `_MainFusePower` using voltage, phases, and amperage
3. Calculate `_OverLoadFusePower` using voltage, phases, and amperage
4. Calculate `_KVFusePower` using voltage, phases, and amperage
5. Return enriched `TechnicalData` object

**Power Calculation Formula**:
```csharp
power = Math.Ceiling((voltage * fuseAmp * Math.Sqrt(fusePhases)) / 1000)
```

### GetTechicalDataSummary(int mpNo)
Retrieves technical data, maps to ViewModel, and enriches with lookup names.

**Business Logic**:
1. Call `GetValuesAsync()` to get base data with calculated powers
2. Map DTO to `TechnicalDataVM` using AutoMapper
3. If `GridType` exists: Fetch grid types from ptab, enrich with name
4. If `CabelMaterial` exists: Fetch cable materials from ptab, enrich with name
5. If `CabelMethod` exists: Fetch cable methods from ptab, enrich with name
6. Return enriched ViewModel

### CalculatePower(int? voltage, int? fusePhases, int? fuseAmp)
Public utility method for power calculation (exposed for reuse/testing).

## Test Plan

### TS-100 Series: GetValuesAsync - Basic Retrieval

**TS-101: GetValuesAsync_ReturnsTechnicalData_WithCalculatedPowers**
- **Setup**: Repository returns technical data with voltage=230, MainFuse 3 phases 16A, OverloadFuse 3 phases 25A, KVFuse 3 phases 35A
- **Action**: Call `GetValuesAsync(123)`
- **Expected**: 
  - Returns `TechnicalData` object
  - `_MainFusePower = Math.Ceiling((230 * 16 * √3) / 1000)` = 7 kW
  - `_OverLoadFusePower = Math.Ceiling((230 * 25 * √3) / 1000)` = 10 kW
  - `_KVFusePower = Math.Ceiling((230 * 35 * √3) / 1000)` = 14 kW

**TS-102: GetValuesAsync_ReturnsTechnicalData_WhenRepositoryReturnsData**
- **Setup**: Repository returns complete technical data
- **Action**: Call `GetValuesAsync(123)`
- **Expected**: Returns non-null `TechnicalData`, all repository properties preserved

**TS-103: GetValuesAsync_HandlesNullFuseValues_SetsPowerToZero**
- **Setup**: Repository returns data with null MainFusePhases, OverloadFuseAmp=null, KVFuseAmp=null
- **Action**: Call `GetValuesAsync(123)`
- **Expected**: All three power values = 0 (CalculatePower returns 0 when any parameter is null)

**TS-104: GetValuesAsync_CallsRepositoryOnce**
- **Setup**: Mock repository
- **Action**: Call `GetValuesAsync(123)`
- **Expected**: `technicalRepository.GetTechnicalDataAsync(123)` called exactly once

### TS-200 Series: GetTechicalDataSummary - Mapping and Enrichment

**TS-201: GetTechicalDataSummary_MapsToViewModel_WithoutLookups**
- **Setup**: 
  - Repository returns data with GridType=null, CabelMaterial=null, CabelMethod=null
  - Mapper returns ViewModel
- **Action**: Call `GetTechicalDataSummary(123)`
- **Expected**: Returns `TechnicalDataVM` with properties mapped, no ptab lookups called

**TS-202: GetTechicalDataSummary_EnrichesGridType_WhenExists**
- **Setup**:
  - Repository returns data with GridType=2
  - Ptab returns grid types including `{ GridTypeId = 2, GridType = "TN-system" }`
- **Action**: Call `GetTechicalDataSummary(123)`
- **Expected**: ViewModel `GridType = "TN-system"`

**TS-203: GetTechicalDataSummary_EnrichesCabelMaterial_WhenExists**
- **Setup**:
  - Repository returns data with CabelMaterial=1
  - Ptab returns cable materials including `{ CabelMaterialId = 1, CabelMaterial = "Copper" }`
- **Action**: Call `GetTechicalDataSummary(123)`
- **Expected**: ViewModel `CabelMaterial = "Copper"`

**TS-204: GetTechicalDataSummary_EnrichesCabelMethod_WhenExists**
- **Setup**:
  - Repository returns data with CabelMethod=3
  - Ptab returns cable methods including `{ CabelMethodId = 3, CabelMethod = "Underground" }`
- **Action**: Call `GetTechicalDataSummary(123)`
- **Expected**: ViewModel `CabelMethod = "Underground"`

**TS-205: GetTechicalDataSummary_EnrichesAllThreeLookups_WhenAllExist**
- **Setup**: Repository returns data with all three lookup IDs, ptab returns matching values
- **Action**: Call `GetTechicalDataSummary(123)`
- **Expected**: All three properties enriched with names

**TS-206: GetTechicalDataSummary_LeavesLookupNull_WhenIdNotFound**
- **Setup**:
  - Repository returns GridType=999
  - Ptab returns grid types not including 999
- **Action**: Call `GetTechicalDataSummary(123)`
- **Expected**: ViewModel `GridType = null` (FirstOrDefault returns null)

### TS-300 Series: CalculatePower - Power Calculation Logic

**TS-301: CalculatePower_CalculatesCorrectly_For230V_3Phase_16A**
- **Setup**: voltage=230, fusePhases=3, fuseAmp=16
- **Action**: Call `CalculatePower(230, 3, 16)`
- **Expected**: Returns 7.0 (Math.Ceiling((230 * 16 * 1.732) / 1000))

**TS-302: CalculatePower_CalculatesCorrectly_For400V_3Phase_32A**
- **Setup**: voltage=400, fusePhases=3, fuseAmp=32
- **Action**: Call `CalculatePower(400, 3, 32)`
- **Expected**: Returns 23.0 (Math.Ceiling((400 * 32 * 1.732) / 1000))

**TS-303: CalculatePower_CalculatesCorrectly_For230V_1Phase_20A**
- **Setup**: voltage=230, fusePhases=1, fuseAmp=20
- **Action**: Call `CalculatePower(230, 1, 20)`
- **Expected**: Returns 5.0 (Math.Ceiling((230 * 20 * 1.0) / 1000))

**TS-304: CalculatePower_ReturnsZero_WhenVoltageIsNull**
- **Setup**: voltage=null, fusePhases=3, fuseAmp=16
- **Action**: Call `CalculatePower(null, 3, 16)`
- **Expected**: Returns 0.0

**TS-305: CalculatePower_ReturnsZero_WhenFusePhasesIsNull**
- **Setup**: voltage=230, fusePhases=null, fuseAmp=16
- **Action**: Call `CalculatePower(230, null, 16)`
- **Expected**: Returns 0.0

**TS-306: CalculatePower_ReturnsZero_WhenFuseAmpIsNull**
- **Setup**: voltage=230, fusePhases=3, fuseAmp=null
- **Action**: Call `CalculatePower(230, 3, null)`
- **Expected**: Returns 0.0

**TS-307: CalculatePower_ReturnsZero_WhenAllParametersNull**
- **Setup**: voltage=null, fusePhases=null, fuseAmp=null
- **Action**: Call `CalculatePower(null, null, null)`
- **Expected**: Returns 0.0

**TS-308: CalculatePower_RoundsUpCeiling_ForFractionalResults**
- **Setup**: voltage=230, fusePhases=3, fuseAmp=13
- **Action**: Call `CalculatePower(230, 3, 13)`
- **Expected**: Returns 6.0 (Math.Ceiling(5.18...) = 6)

### TS-400 Series: Integration Workflows

**TS-401: GetTechicalDataSummary_CallsGetValuesAsync_Internally**
- **Setup**: Mock repository and ptab
- **Action**: Call `GetTechicalDataSummary(123)`
- **Expected**: 
  - Verify `GetValuesAsync()` called (indirectly via repository call)
  - Verify power calculations performed before mapping

**TS-402: GetTechicalDataSummary_CallsPtabRepositories_InSequence**
- **Setup**: Repository returns data with all three lookup IDs
- **Action**: Call `GetTechicalDataSummary(123)`
- **Expected**:
  - `ptabRepository.GetGridTypes()` called once (if GridType exists)
  - `ptabRepository.GetCabelMaterials()` called once (if CabelMaterial exists)
  - `ptabRepository.GetCabelMethods()` called once (if CabelMethod exists)

**TS-403: GetTechicalDataSummary_UsesMapper_ForTransformation**
- **Setup**: Repository returns technical data
- **Action**: Call `GetTechicalDataSummary(123)`
- **Expected**: `mapper.Map<TechnicalDataVM>(technicalData)` called once

### Edge-500 Series: Edge Cases

**Edge-501: GetValuesAsync_HandlesRepositoryNull**
- **Setup**: Repository returns null
- **Action**: Call `GetValuesAsync(123)`
- **Expected**: NullReferenceException when accessing properties (service doesn't handle null)
  - **Note**: Current implementation assumes repository never returns null

**Edge-502: GetTechicalDataSummary_HandlesEmptyPtabLookups**
- **Setup**:
  - Repository returns data with lookup IDs
  - All ptab methods return empty lists
- **Action**: Call `GetTechicalDataSummary(123)`
- **Expected**: All lookup properties remain null (FirstOrDefault on empty returns null)

**Edge-503: CalculatePower_HandlesZeroValues**
- **Setup**: voltage=0, fusePhases=3, fuseAmp=16
- **Action**: Call `CalculatePower(0, 3, 16)`
- **Expected**: Returns 0.0 (0 * 16 * √3 / 1000 = 0)

**Edge-504: CalculatePower_HandlesVeryLargeValues**
- **Setup**: voltage=50000, fusePhases=3, fuseAmp=5000
- **Action**: Call `CalculatePower(50000, 3, 5000)`
- **Expected**: Returns Math.Ceiling((50000 * 5000 * √3) / 1000) = large number

**Edge-505: GetTechicalDataSummary_HandlesMapperReturnsNull**
- **Setup**: Mapper returns null
- **Action**: Call `GetTechicalDataSummary(123)`
- **Expected**: NullReferenceException when setting properties on null VM
  - **Note**: Service assumes mapper never returns null

**Edge-506: GetValuesAsync_HandlesRepositoryException**
- **Setup**: Repository throws exception
- **Action**: Call `GetValuesAsync(123)`
- **Expected**: Exception propagates to caller

## Test Coverage Summary
- **Total Test Cases**: 24
- **Basic Retrieval**: 4 (TS-100 series)
- **Mapping/Enrichment**: 6 (TS-200 series)
- **Power Calculations**: 8 (TS-300 series)
- **Integration**: 3 (TS-400 series)
- **Edge Cases**: 6 (Edge-500 series)

## Key Testing Patterns
1. **Power Calculation Validation**: Critical - verify Math.Ceiling and √phases formula
2. **Null Parameter Handling**: Ensure CalculatePower returns 0 when any param is null
3. **Lookup Enrichment**: Verify FirstOrDefault pattern for matching IDs
4. **Sequential Enrichment**: Only fetch ptab data if ID exists
5. **AutoMapper Integration**: Verify mapping happens before enrichment

## Potential Issues Identified
1. **Edge-501, Edge-505**: Service doesn't handle null returns from repository or mapper
   - **Severity**: Medium (should validate or document assumptions)
   - **Recommendation**: Add null checks or document "never null" contract
2. **Lookup Performance**: Three sequential ptab calls if all lookups exist
   - **Severity**: Low (could optimize with Task.WhenAll if needed)
3. **AutoMapper Dependency**: Uses legacy AutoMapper pattern
   - **Severity**: Low (acceptable for existing code)

## Power Calculation Reference

| Voltage | Phases | Amperage | Formula | Result (kW) |
|---------|--------|----------|---------|-------------|
| 230V | 1 | 16A | Math.Ceiling((230 * 16 * √1) / 1000) | 4 |
| 230V | 3 | 16A | Math.Ceiling((230 * 16 * √3) / 1000) | 7 |
| 230V | 3 | 25A | Math.Ceiling((230 * 25 * √3) / 1000) | 10 |
| 230V | 3 | 35A | Math.Ceiling((230 * 35 * √3) / 1000) | 14 |
| 400V | 3 | 32A | Math.Ceiling((400 * 32 * √3) / 1000) | 23 |
| 400V | 3 | 63A | Math.Ceiling((400 * 63 * √3) / 1000) | 44 |

## Implementation Notes
- Service has three distinct responsibilities: retrieval, calculation, enrichment
- CalculatePower is public (exposed for reuse/testing)
- Power values are set directly on DTO properties (`_MainFusePower`, etc.)
- Enrichment only happens in GetTechicalDataSummary (not GetValuesAsync)
- Norwegian comment in code: "// endre repository til å sende navn i stedet for nummer" (change repository to send names instead of numbers) - suggests future refactoring
- FirstOrDefault pattern used for lookups (returns null if no match)
- No caching, no session state, straightforward repository wrapper with calculations

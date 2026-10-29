# MeteringPoint + MeterValues Coverage Test Plan - Week 26 (June 22-28, 2026)

**Plan Created**: June 16, 2026  
**Focus**: New test creation from scratch for remaining Week 25 gaps  
**Current Status**: Completed (11/11 tests passing)

---

## Executive Summary

Week 26 extends the Week 25 coverage effort by targeting still-missing tests in the MeterValues domain and controller layers. The immediate implementation batch is repository-first to add reliable, low-flake coverage around Oracle procedure invocation and response handling.

## Week 26 Scope

### Included

- `Perigon.Modules.MeterValues.Domains` repository tests created from scratch
- NUnit + NSubstitute behavior tests for procedure routing and null/empty handling
- Focus on classes that had no dedicated tests

### Excluded (this batch)

- UI/end-to-end flows
- Refactoring existing production code
- Controller-heavy scenario expansion (deferred to next batch)

## Sprint E - New Repository Tests (from scratch)

### Target Classes

- `CommonRepository`
- `EntityLevelRepository`
- `GlobalSearchRepository`

### Test Intent

1. Validate correct stored procedure names for `IOracleDatabaseConnection` calls.
2. Validate transaction invocation and result mapping for `IDatabaseConnection.InTransation` calls.
3. Validate null/empty response handling (`FirstOrDefault`, empty enumerables).

### Planned Deliverables

- `CommonRepositoryTests.cs`
- `EntityLevelRepositoryTests.cs`
- `GlobalSearchRepositoryTests.cs`

## Validation Commands

```bash
# Build
dotnet build

# Run only new Week 26 repository tests
dotnet test tests/Perigon.Modules.MeterValues.Domains.UnitTests/Perigon.Modules.MeterValues.Domains.UnitTests.csproj --filter "FullyQualifiedName~CommonRepositoryTests|FullyQualifiedName~EntityLevelRepositoryTests|FullyQualifiedName~GlobalSearchRepositoryTests"
```

## Progress Tracker

- [x] Week 26 plan file created
- [x] New test files created from scratch
- [x] Focused test run green (11/11 passed)
- [x] Week 26 repository test batch completed and validated on August 15, 2026
- [ ] Optional PR prep

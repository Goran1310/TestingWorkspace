# Test Plan: FaultHandlingCompProcessService (April 2026)

## Scope
Service under test: `FaultHandlingCompProcessService` in MeteringPoint module.

Coverage report reference: `code-coverage-report-2447` showed this service as the lowest-covered MeteringPoint service (`80.3%`, 31 uncovered lines).

## Goal
Increase line and branch coverage by targeting uncovered process-flow branches, not already covered repository pass-through behavior.

## New Test Focus (April)
1. `SetState(ProcessVM vm, FaultHandlingCompProcessStates state)`
- Verify VM state mutation branch.

2. `GetFaultHandlingCompVMAsync(int? workorderId)`
- Cover null-deserialization fallback path (`DeserializeObject(...) ?? new ExecuteDataVM()`).

3. `MapMeteringpointStep(MeteringpointStepVM form)`
- Non-crosschange branch where second meteringpoint changes and second component is reset.
- Branch where `form.FirstMeteringpoint` is null and `MeteringpointNo`/`MeteringpointId` become null.

4. `AppendComponentStep(FaultHandlingVM vm)`
- Crosschange branch: split/route components by `NewMs`, then sort by date and assign both component lists.
- Rechange branch: fetch and assign first component details.

## Acceptance Criteria
- New tests compile and pass in `Perigon.Modules.MeteringPoint.UnitTests`.
- Added tests execute uncovered branches listed above.
- No production code changes required for this coverage step.

## Execution
```powershell
dotnet test tests/Perigon.Modules.MeteringPoint.UnitTests/ --filter "FullyQualifiedName~FaultHandlingCompProcessServiceTests" --verbosity minimal
```

## Risks
- Session-extension behavior can be brittle in pure unit tests.
- Existing service has large branching surface; this plan intentionally focuses on highest-value uncovered lines first.

# Test Plan: UserWidgetConfigService (April 2026)

## Scope
Service under test: `UserWidgetConfigService` in MeteringPoint module.

Coverage report reference: `code-coverage-report-2447` showed this service as the next lowest-covered MeteringPoint service (`90.7%`, 43 uncovered lines).

## Goal
Improve branch coverage around template deduplication, tablet feature flags, setup grouping, and persisted selection state.

## New Test Focus (April)
1. `SaveUserWidgetTemplateSetup(UserWidgetTemplate template, DeviceType deviceType)`
- Cover update path when template has ID and same name exists under differing device/view context.

2. `GetDefaultConfiguration(DeviceType? device)`
- Cover tablet + `MeteringpointV2` branch that appends `Relation` and `Workorder` widgets.

3. `GetUserWidgetTemplateSetupSets(string userName)`
- Cover branch where same display name merges into one set and updates changed metadata.
- Cover branch where different display names create separate sets.

4. `GetUserWidgetTemplateConfig(string userName, string widgetTemplateId)`
- Cover found-template path (`templateList.Count > 0`).

5. `SetCurrentUserWidgetTemplateSetup(...)`
- Verify persisted display name is written through `PutUserWidgetTemplateSetupAsync`/`UpdateUserData`.

## Acceptance Criteria
- New tests compile and pass in `Perigon.Modules.MeteringPoint.UnitTests`.
- Added tests execute branch paths listed above.
- Existing test behavior remains stable.

## Execution
```powershell
dotnet test tests/Perigon.Modules.MeteringPoint.UnitTests/ --filter "FullyQualifiedName~UserWidgetConfigServiceTests" --verbosity minimal
```

## Risks
- Session extension method internals are difficult to assert directly with substitutes; persistence verification is performed via repository call assertions.

# Pull Request Workflow - Perigon Project

**Date:** December 15, 2025  
**Project:** Hansen Technologies - Perigon  
**Coverage Threshold:** 3.3%

---

## Executive Summary

This document explains the actual Pull Request (PR) workflow in the Perigon project, including build validation, test execution, and code coverage requirements.

---

## Actual PR Workflow

```
Pull Request Created
    ↓
GitHub Actions Workflow Triggers (build.yml)
    ↓
    ├─→ Build/Compile Code
    │       ↓
    │   [FAIL] → ❌ PR Blocked
    │       ↓
    │   [PASS] → Continue
    │
    ├─→ Run Unit Tests (parallel with coverage collection)
    │       ↓
    │   [ANY TEST FAILS] → ❌ PR Blocked
    │       ↓
    │   [ALL PASS] → Continue
    │
    └─→ Code Coverage Analysis
            ↓
        Calculate coverage for NEW/CHANGED code
            ↓
        [Coverage < 3.3%] → ❌ PR Blocked
            ↓
        [Coverage ≥ 3.3%] → ✅ Build Passes
            ↓
        Human Reviewer Approval Still Required
            ↓
        PR Merged
```

---

## Key Clarifications

### 1. **Tests and Coverage Run Together**
- **Not sequential** - they run as part of the same build step
- Coverage is collected **while** tests run
- Both are evaluated before determining build success

### 2. **Coverage is Delta-Based (New Code Only)**

```yaml
TestCoverageThreshold: 3.3  # Applies to changed lines, not entire codebase
```

**Important Points:**
- 3.3% threshold applies to **code added/modified in the PR**
- **NOT** the total project coverage (which would be much higher)
- This is why it's so low - even minimal test coverage on new code passes
- Legacy codebase strategy - gradual improvement approach

### 3. **Build Failure ≠ PR Rejection**
- Failed checks **block merging** but don't auto-reject
- PR stays open with ❌ status
- Developer fixes issues, pushes new commit
- Workflow re-runs automatically
- No need to close and recreate PR

### 4. **Human Approval Still Required**
- Even with ✅ passing build
- Code review required
- At least one approver needed (configurable)
- Merge button only enabled after both checks pass AND approval received

---

## What Actually Happens - Scenarios

### Scenario 1: Tests Fail

```
PR Created → Tests Run → 5 tests fail
    ↓
❌ Build Failed - "Tests failed (5 failures)"
    ↓
PR cannot be merged (even with approvals)
    ↓
Developer fixes code → Pushes commit
    ↓
Workflow re-runs automatically
```

### Scenario 2: Coverage Too Low

```
PR Created → Tests Pass → Coverage: 2.1% (< 3.3%)
    ↓
❌ Build Failed - "Coverage below threshold"
    ↓
PR cannot be merged
    ↓
Developer adds more tests → Pushes commit
    ↓
Coverage: 5.2% → Build passes
```

### Scenario 3: All Checks Pass

```
PR Created → Tests Pass → Coverage: 85%
    ↓
✅ Build Passed
    ↓
Awaiting reviewer approval
    ↓
Reviewer reviews code
    ↓
Reviewer approves → Merge button enabled
    ↓
PR merged to main/master
```

---

## Why 3.3% is So Low

This reflects a **legacy codebase** with gradual improvement strategy:

### Background
- Old code has minimal/no tests
- Current codebase has low overall coverage
- Strict threshold (like 80%) would block all PRs
- Need to balance improvement with productivity

### Strategy
- 3.3% ensures **any** new code has **some** tests
- Prevents coverage from decreasing further
- Allows gradual improvement over time
- As codebase improves, this threshold should be raised

### Future Plans
- Monitor average PR coverage over time
- Increase threshold quarterly (e.g., 3.3% → 5% → 10% → 20%)
- Eventually reach industry standard (70-80%)
- Refactor legacy code to add tests

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│              Pull Request Submitted                 │
└─────────────────┬───────────────────────────────────┘
                  ▼
         ┌────────────────┐
         │ Build & Compile│
         └────────┬───────┘
                  │
         ┌────────▼────────┐
         │   Run Tests +   │
         │ Collect Coverage│
         └────────┬────────┘
                  │
         ┌────────▼─────────┐
         │ All Tests Pass?  │
         └────────┬─────────┘
              No  │  Yes
         ┌────────▼─────────┐
    ❌  │  Coverage ≥ 3.3%? │  ✅
         └────────┬─────────┘
              No  │  Yes
         ┌────────▼─────────┐
         │  Build Status:   │
         │  ❌ Failed       │
         │  ✅ Passed       │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │ Human Review &   │
         │    Approval      │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │   Merge to Main  │
         └──────────────────┘
```

---

## Detailed Process Steps

### Step 1: PR Created
- Developer creates PR from feature branch
- GitHub Actions workflow automatically triggered
- Status checks appear on PR page

### Step 2: Build Phase
- Solution compiled
- Dependencies restored
- Build errors prevent further steps
- **Exit Code 0** = Success, continue
- **Exit Code ≠ 0** = Failure, stop

### Step 3: Test Execution
```powershell
dotnet test --configuration Release --collect:"XPlat Code Coverage"
```
- All unit tests executed
- Coverage data collected simultaneously
- Test results displayed in PR checks
- **All Pass** = Continue
- **Any Fail** = Build fails

### Step 4: Coverage Analysis
```yaml
# From .github/workflows/build.yml
- name: Code Coverage Check
  run: |
    $coverage = Get-Coverage-Percentage
    if ($coverage -lt 3.3) {
      Write-Error "Coverage $coverage% below threshold 3.3%"
      exit 1
    }
```
- Coverage calculated for changed lines only
- Compared against 3.3% threshold
- **≥ 3.3%** = Pass
- **< 3.3%** = Fail

### Step 5: Human Review
- Reviewer examines code changes
- Checks for:
  - Code quality
  - Architecture adherence
  - Security concerns
  - Performance implications
  - Test adequacy
- Approves or requests changes

### Step 6: Merge
- All checks passed ✅
- Approval received ✅
- Merge button enabled
- Developer or maintainer merges PR

---

## Common Misunderstandings - Corrected

| ❌ Common Misconception | ✅ Actual Truth |
|------------------------|-----------------|
| Tests run, **then** coverage calculated | Tests and coverage run **simultaneously** |
| 3.3% applies to entire project | 3.3% applies to **new/changed code only** |
| Failed build = PR rejected/closed | Failed build = **PR blocked**, stays open for fixes |
| Passing build = PR auto-merged | Passing build = **still needs human approval** |
| Coverage must be 3.3% total | Coverage must be 3.3% **on delta** (your changes) |

---

## Example: Your BrregSearchService Tests

### Your PR Will Have:
- **New Code:** BrregSearchServiceTests.cs (480 lines)
- **Tests Added:** 84 tests
- **Coverage of New Code:** ~100% (all service methods tested)

### What Happens:
```
1. Build: ✅ Compiles successfully
2. Tests: ✅ All 84 tests pass
3. Coverage: ✅ 100% >> 3.3% threshold
4. Status: ✅ Build Passed - Ready for Review
5. Human Review: Reviewer approves
6. Result: ✅ PR Merged
```

**Your tests will easily pass** the 3.3% requirement! 🎉

---

## Best Practices for PRs

### For Developers

1. **Write tests for new code** - Aim for high coverage
2. **Run tests locally** before pushing - `dotnet test`
3. **Check coverage locally** - Use coverlet or similar tools
4. **Fix failing builds quickly** - Don't let PRs go stale
5. **Respond to review comments** - Address feedback promptly

### For Reviewers

1. **Check test quality** - Not just quantity
2. **Verify coverage is meaningful** - Edge cases covered?
3. **Test the changes locally** - If needed
4. **Provide constructive feedback** - Help improve code
5. **Approve only when confident** - Quality over speed

---

## Configuration Files

### GitHub Actions Workflow
**File:** `.github/workflows/build.yml`

```yaml
name: Build and Test

on:
  pull_request:
    branches: [ main, master ]

jobs:
  build:
    runs-on: windows-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v2
      
    - name: Setup .NET
      uses: actions/setup-dotnet@v1
      with:
        dotnet-version: 8.0.x
        
    - name: Restore dependencies
      run: dotnet restore
      
    - name: Build
      run: dotnet build --no-restore --configuration Release
      
    - name: Test with Coverage
      run: dotnet test --no-build --configuration Release --collect:"XPlat Code Coverage"
      
    - name: Coverage Check
      run: |
        # Calculate coverage for changed files
        $threshold = 3.3
        $coverage = Calculate-Delta-Coverage
        if ($coverage -lt $threshold) {
          Write-Error "Coverage $coverage% is below $threshold%"
          exit 1
        }
```

### Coverage Threshold
**Location:** `.github/workflows/build.yml` (line 10)

```yaml
env:
  TestCoverageThreshold: 3.3
```

**To change threshold:**
1. Edit `.github/workflows/build.yml`
2. Update `TestCoverageThreshold` value
3. Commit and push
4. New PRs will use new threshold

---

## Summary

### Original Understanding vs Actual Flow

**Original (Mostly Correct):**
```
Tests Run → Pass? → Coverage Check → Pass? → Approve
```

**Actual (Refined):**
```
Build → Tests + Coverage (parallel) → Human Review → Merge
```

### Key Differences:
1. ✅ Tests and coverage run together
2. ✅ 3.3% applies to new code only (delta)
3. ✅ Build failure blocks merge, doesn't reject
4. ✅ Human approval required after checks pass
5. ✅ Coverage calculated on changed lines

---

## Recommendations

### Short Term (Current PR)
- ✅ Your 84 tests will easily pass 3.3%
- Focus on test quality over quantity
- Ensure all edge cases covered
- Document service issues found

### Medium Term (Team)
- Monitor average PR coverage
- Track coverage trends over time
- Identify low-coverage areas
- Plan refactoring sprints

### Long Term (Project)
- Increase threshold quarterly
- Target 70-80% overall coverage
- Refactor legacy untested code
- Establish coverage standards

---

## Related Documentation

- **Workflow File:** `.github/workflows/build.yml`
- **Coverage Reports:** Generated in PR checks
- **Test Results:** Displayed in GitHub Actions
- **Coverlet Docs:** https://github.com/coverlet-coverage/coverlet

---

**Document Version:** 1.0  
**Last Updated:** December 15, 2025  
**Status:** Complete

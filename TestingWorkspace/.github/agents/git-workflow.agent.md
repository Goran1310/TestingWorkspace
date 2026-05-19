---
name: git-workflow
description: "Use for branch naming (story/task/bugfix), commit conventions (JIRA-ID prefix), PR lifecycle, and git worktree management."
---

# Git Workflow Agent

Specialized assistant for git operations aligned with Perigon and Hansen standards.

## Branch Naming

**Format:** `{type}/{module}/{jira-id}` (all lowercase)

### Issue Types
- `story` — New feature or user story
- `bugfix` — Bug fix
- `task` — Tech task, chore, refactoring

### Module Shortnames
- `mp` — MeteringPoint
- `ccm` — CustomerCare
- `ca` — CampaignAdmin
- `ma` — MarketAutomation
- `mm` — MarketMessages
- `admin` — Admin
- `per` — Perigon (cross-module / shared infrastructure)
- `cl` — Component.Library

### Examples
```
story/mp/tcc-12345
bugfix/ccm/tcc-10234
task/per/tb-1000
```

## Commit Messages

**Format:** `{JIRA-ID} {description}`

- Jira ID in **UPPERCASE**: `GRID-1234`, `TB-1000`, `VAT-99`
- Use imperative mood: "Add", "Fix", "Remove", "Refactor", "Update"
- First line ≤ 72 characters

### Examples
```
GRID-1234 Add user widget configuration tests
TB-1000 Fix decimal rounding in invoice calculation
VAT-99 Remove deprecated Oracle API wrapper
```

## Pre-Push Safety Checks

Before `git push`, verify:
1. ✅ Branch name: `{type}/{module}/{jira-id}` (lowercase)
2. ✅ Commits prefixed with UPPERCASE Jira ID
3. ✅ Tests pass locally (`dotnet test` / `npm test`)
4. ✅ No debug code or console logs
5. ✅ Protected branch rules met

## Branch Sync Strategies

Both acceptable — `master` uses squash-merge only.

### Rebase (cleaner local history)
```powershell
git fetch origin
git rebase origin/master
```

### Merge (simpler)
```powershell
git fetch origin
git merge origin/master
```

## Pull Request Workflow

- **Title**: Same as first commit: `{JIRA-ID} {description}`
- **Description**: Summarize changes and rationale
- **Breaking Changes**: Clearly document if migration steps needed
- **Related Issues**: Link Jira tickets

## Worktree Management

Create parallel feature branches without full checkouts:

```powershell
git worktree add -b story/mp/grid-1234 ../feature-1234
# ... work, commit, push ...
git worktree remove ../feature-1234
```

---

*Reference: Perigon Git Conventions*

---
name: AGENT_USAGE_GUIDE
description: "Use when choosing which TestingWorkspace agent to run for customization, tests, git workflow, docs, lint, API, or deployment tasks."
---

# Agent Usage Guide (TestingWorkspace)

## Primary Routing
1. For customization files (`*.agent.md`, `*.instructions.md`, `SKILL.md`, `copilot-instructions.md`): use `agent-customization` skill first.
2. For test plans and unit test implementation: use `test-planner`.
3. For branch/commit/PR operations: use `git-workflow`.
4. For rewriting documentation quality: use `docs_agent`.
5. For style/format cleanup: use `lint-agent`.
6. For API implementation behavior: use `api-agent`.
7. For local build/deploy workflows: use `dev-deploy-agent`.

## Workspace Paths
- Agents: `c:/Users/goran.lovincic/source/repos/TestingWorkspace/.github/agents`
- Skills: `c:/Users/goran.lovincic/source/repos/TestingWorkspace/.github/skills`

## Notes
- If `TestingWorkspace.github/agents` appears, treat it as a typo.
- Keep handoffs minimal and task-focused.

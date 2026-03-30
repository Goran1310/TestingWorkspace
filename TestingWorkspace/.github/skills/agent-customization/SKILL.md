---
name: agent-customization
description: "Use when creating or updating customization files and when you need to wire skills with workspace agents under .github/agents in TestingWorkspace."
---

# Agent Customization (TestingWorkspace)

## Scope
This workspace uses custom agents from:
- `c:/Users/goran.lovincic/source/repos/TestingWorkspace/.github/agents`

If a user provides `TestingWorkspace.github/agents`, treat it as a typo and use `.github/agents`.

## Agent Connection Map
When working on customization files, delegate as follows:

1. `test-planner`
- Use for unit-test planning patterns, NUnit + NSubstitute guidance, and lessons learned updates.

2. `git-workflow`
- Use for branch naming, commit message conventions, push/PR lifecycle.

3. `docs_agent`
- Use for rewriting/customizing agent docs, improving structure, and clarifying instructions.

4. `lint-agent`
- Use for style/format pass on markdown customization files when needed.

5. `api-agent`
- Use when customization work includes API agent behavior/examples.

6. `dev-deploy-agent`
- Use when customization guidance depends on local build/run/deploy workflows.

## Keep It Simple Rules
- Update only the minimum file(s) required.
- Prefer one concise section over large rewrites.
- Reuse existing agent style in `.github/agents/*.agent.md`.
- Add explicit paths and trigger phrases in `description` for discoverability.

## Validation Checklist
- Path exists: `.github/agents`
- Frontmatter is valid YAML (`name`, `description`)
- Instructions are short and action-oriented
- If delegating, name the exact agent as listed in the workspace

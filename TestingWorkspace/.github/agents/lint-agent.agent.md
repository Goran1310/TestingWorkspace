---
name: lint-agent
description: "Use for markdown formatting, code block validation, YAML frontmatter checks, and link integrity passes."
---

# Lint Agent

Specialized assistant for style, format, and validation cleanup of documentation and agent files.

## Validation Scope

- Markdown formatting consistency
- YAML frontmatter validation (`name` and `description` required)
- Code block language tags (all blocks must specify language)
- Internal link verification (relative paths only)
- Line length, spacing, and whitespace cleanup
- Heading outline integrity

## YAML Frontmatter Requirements

All agent and instruction files must include:

```yaml
---
name: <agent-or-instruction-name>
description: "<concise description of purpose and when to use>"
---
```

Valid example:
```yaml
---
name: git-workflow
description: "Use for branch naming, commits, PRs, and worktree management."
---
```

## Markdown Formatting Standards

| Standard | Rule |
|---|---|
| **Headers** | H1 for document title only; use H2-H4 for sections |
| **Code Blocks** | Always include language tag: ` ```csharp `, ` ```powershell `, ` ```json ` |
| **Links** | Relative markdown format: `[text](../path/file.md)` |
| **Whitespace** | No trailing spaces; blank line before/after code blocks |
| **Line Length** | Keep lines ≤ 100 characters when practical |

## Link Validation

- All links use relative paths (no `file://` or absolute paths)
- Links target files that exist in workspace
- Markdown format: `[display text](path/file.md)`
- For headings: `[Heading](file.md#section-heading)` (lowercase, hyphens)

## Validation Checklist

- [ ] Frontmatter YAML is valid and has `name` + `description`
- [ ] All code blocks have language tags
- [ ] No broken relative links
- [ ] No trailing whitespace
- [ ] Consistent indentation (spaces, not tabs)
- [ ] Headings don't skip levels (no H1→H3 jump)
- [ ] Tables are properly formatted (pipes aligned)
- [ ] Lists use consistent bullet style (- or *)

## Common Fixes

| Issue | Fix |
|---|---|
| Missing language tag | Add ` ```csharp` before code block content |
| Invalid frontmatter | Add `---` delimiters; ensure `name` and `description` present |
| Trailing whitespace | Remove spaces at end of lines |
| Broken link | Verify path exists, use relative path format |
| H1→H3 skip | Change H3 to H2, or add missing H2 |

---

*Reference: Agent Customization Skill*

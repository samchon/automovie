---
name: scaffold-prompting
description: Designs the skills, contracts and routers a production receives.
---

# Scaffold prompting

Apply [prompting](../prompting/SKILL.md) and the [writing rules](../documentation/writing.md) to shipped instructions.

| Read | To |
| --- | --- |
| [Task design](task-design.md) | Change production tasks or handoffs |
| [Contract design](contract-design.md) | Change production contracts or their selectors |
| [Research routes](research-routes.md) | Find primary sources for production criteria |
| [Verification](verification.md) | Check distribution or production behavior |

## Distribution

Ship [shared rules](../prompting/SKILL.md#shared-skills) through empty `$` placeholders. Keep scaffold-owned text for production-specific rules.

Use production-relative paths and local skill links within `.agents`. Limit routes to three links from `AGENTS.md` and one nested router level. Use a sub-skill for three or more distinct triggers, a listing router for smaller groups and a family router for contracts and statements.

Keep scaffold lint independent of folders. Keep engineering checks enabled when productions opt into narrative Evidence.

Read the production's own `AGENTS.md`, README and relevant source before working on it.

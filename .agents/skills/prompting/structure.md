# Skill structure

## Rule ownership

Give each section one purpose and each rule one owner. Resolve overlap and conflicts at the owner.

Fix the application when an existing rule covers the failure. Fix the owner and its inbound links when a rule is missing or conflicts.

## Entry files

Keep `AGENTS.md` under 200 lines. Give each top-level skill a verb-led trigger. Include only the rules a reader needs across sessions or to start. Keep only `@AGENTS.md` in `CLAUDE.md`.

`AGENTS.md` alone may briefly restate essential rules that readers need before following the task links. Link to the rule owner for the full guidance.

## Skill files

Give each distinct skill a top-level `.agents/skills/<name>/SKILL.md`. Match `name` to its directory using at most 64 lowercase letters, digits and hyphens. Give the skill a short, specific third-person description.

## Headings

Use short, distinct sentence-case headings. Group related topics under an H2 and use H3s for its subsections.

Use heading slugs as link targets. Add an explicit anchor only when a link must survive a rename and the renderer supports it.

## Portals and resources

Start at `AGENTS.md` and follow the relevant `SKILL.md` and task links. Open only the resources the current task needs.

When a skill covers several substantial topics that can be read independently, make `SKILL.md` a portal. Keep the scope, shared rules and task-specific links there. Put each topic in a separate document in the skill folder. Use nested folders and portals when they help a reader reach the right topic.

Give each resource one task and a name that describes it. Name a child router for its parent and folder.

## Link direction

Link from a portal to its children and from a consumer to the rule it uses. A child never links to an ancestor. A referenced page never links back to a page that references it.

## Shared skills

Share only rules valid for every receiving project. Name tools, owners and records by role. Leave project decisions and paths to project skills and model-specific settings to the task.

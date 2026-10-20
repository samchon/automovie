# AGENTS.md

This is an AutoMovie production: its assets and their performance are authored in TypeScript under `src` and rendered by AutoMovie's deterministic engine. [README](README.md) lists the commands and file ownership.

## Attitude

- Do the literal request, widening it only when the user hands that over.
- The user's instruction outranks any skill.
- Answer a question from the user before continuing any work.
- Write everything the user sees in the user's language.
- Verify a defect against the current source and output before repairing it, and repair the consumers it reaches.
- Report what you verified, not what you built.

## Finishing Work

A message without a tool call ends the turn. While work remains, do not end it with:

- a summary that announces the next step;
- an offer to continue;
- a list of decisions that do not block the work;
- a report because a stage finished;
- a wait on background work.

Stop only when nothing can move without the user or a destructive or outward-facing action needs confirmation.

## Skills

Read the skill whose trigger applies. Installed package READMEs, public types, and JSDoc document the APIs.

- [3d-modeling](.agents/skills/3d-modeling/SKILL.md): changing geometry, rigs, assets, viewer behavior, materials, lighting, or motion, and before claiming a visual change works.
- [contracts](.agents/skills/contracts/SKILL.md): writing or reviewing source under `src` or tests under `test`, for their `@evidence` checklists.
- [development](.agents/skills/development/SKILL.md): changing existing behavior or repairing a defect under `src` or `test`, and before finishing a source change.
- [documentation](.agents/skills/documentation/SKILL.md): writing any document or doc comment.
- [testing](.agents/skills/testing/SKILL.md): authoring or changing models, motion, or shots under `src`, or when the user or a production document fixes a number the source must meet; never for script-only work.

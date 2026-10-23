# AGENTS.md

This is an AutoMovie production. It can deliver a standalone asset, a short video, or a long film or series. [README](README.md) lists commands and the [production guide](docs/guides/production.md) explains file ownership and customization.

## Attitude

- Do the literal request, widening it only when the user hands that over.
- The user's instruction outranks any skill.
- Answer a question from the user before continuing any work.
- Write everything the user sees in the user's language.
- Finish each inspection round, group all findings by cause, then repair their owners and affected consumers together before the next full round.
- Keep external generation outside deterministic playback; retain the actual media used.
- Use installed package READMEs, public types, and JSDoc for APIs; do not copy them into instructions.
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

Read the skill whose trigger applies.

- [production](.agents/skills/production/SKILL.md): starting, resuming, restructuring, or delivering a production, including choosing its scope and working files.
- [storytelling](.agents/skills/storytelling/SKILL.md): researching, planning, writing, or revising narrative, screenplays, or scene and shot breakdowns.
- [3d-modeling](.agents/skills/3d-modeling/SKILL.md): creating, importing, recovering, staging, or changing assets and motion, and judging their visible results.
- [audio](.agents/skills/audio/SKILL.md): choosing or acquiring speech, music, or effects, aligning sound, and checking the final mix.
- [contracts](.agents/skills/contracts/SKILL.md): selecting or changing evidence scope, and writing or reviewing source, tests, or adopted production contracts.
- [development](.agents/skills/development/SKILL.md): writing or changing production source, tests, dependencies, or commands.
- [documentation](.agents/skills/documentation/SKILL.md): writing any document or doc comment.
- [testing](.agents/skills/testing/SKILL.md): choosing or writing behavioral checks for a production's measurable promises.
- [review](.agents/skills/review/SKILL.md): reviewing any production work or claiming it ready for delivery.

# AGENTS.md

This is an AutoMovie production. It primarily turns an LLM-authored screenplay into a deterministic whole motion-video hint, and can also deliver a separately commissioned screenplay, standalone asset, or requested direct 3D or post-diffusion film. [README](README.md) lists commands and the [production skill](.agents/skills/production/SKILL.md) routes the commissioned output and its working files.

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

Read [PROJECT.md](PROJECT.md) for the adopted scope, then enter the requested task directly. Screenwriting selects only the current writing task; review, graph configuration and media production have their own entry points.

- [production](.agents/skills/production/SKILL.md): starting, resuming, restructuring, or delivering a production, including recording its scope and operating choices in PROJECT.md and choosing working files.
- [screenwriting](.agents/skills/screenwriting/SKILL.md): planning, writing, continuing or revising a brief, settings, treatments, scripts, final screenplay, expression pass, narrative evidence or cause-based repair. Its task table selects the needed documents.
- [evidence-configuration](.agents/skills/evidence-configuration/SKILL.md): configuring evidence graphs, narrative mode, stages, or selectors.
- [3d-modeling](.agents/skills/3d-modeling/SKILL.md): creating, importing, recovering, or inspecting asset representations, geometry, rigs, and authored controls.
- [motion](.agents/skills/motion/SKILL.md): programming scene performance, staging, constraints, scene time, and engine feedback, or assembling the whole motion video at useful low detail.
- [audio](.agents/skills/audio/SKILL.md): choosing or acquiring speech, music, or effects, aligning sound, and checking the final mix.
- [contracts](.agents/skills/contracts/SKILL.md): adopting semantic requirements, assigning honest respondents, or writing and reviewing source and tests against their selected questions.
- [development](.agents/skills/development/SKILL.md): writing or changing production source, tests, dependencies, or commands.
- [documentation](.agents/skills/documentation/SKILL.md): writing technical documents, instructions, evidence explanations, and doc comments.
- [testing](.agents/skills/testing/SKILL.md): choosing or writing behavioral checks for a production's measurable promises.
- [review](.agents/skills/review/SKILL.md): reviewing source or tests, independently reviewing a narrative pass, or checking the truth of its evidence.
- [delivery-review](.agents/skills/delivery-review/SKILL.md): inspecting the commissioned screenplay, generation hint, finished video, or asset at its actual output.
- [estimation](.agents/skills/estimation/SKILL.md): a requested read-only audience-experience assessment or edition comparison, separate from evidence and approval.

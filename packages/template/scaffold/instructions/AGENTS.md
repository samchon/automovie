# AGENTS.md

This repository holds AutoMovie productions. A production primarily turns an LLM-authored screenplay into a deterministic whole motion hint, the coarse film whose staging and motion guide video diffusion. A screenplay, a standalone asset, a direct 3D film or a generated film can also be commissioned on its own.

The [production skill](.agents/skills/production/SKILL.md) routes the commissioned output and its working files.

## Layout

A production is the directory holding its `PROJECT.md`: this repository root for a single production, or each `movies/shorts/<name>` and `movies/series/<name>` of an AutoMovie workspace. Every project path a skill names, such as `PROJECT.md`, `README.md`, `src`, `test`, `docs`, `references`, `media`, `package.json` and its configurations, is that production's, and its commands run in its directory.

The skills and bundled contracts under `.agents/skills` serve every production; a production's own work and language contracts live in its `docs/contracts`.

In a workspace the production's folder fixes its [story route](.agents/skills/story/workflow.md#route-and-parents). `packages/<name>` holds the workspace's [shared modules](.agents/skills/development/source-layout.md#shared-modules). The workspace README lists its commands, including the one that adds a production.

## Attitude

- Do the literal request, widening it only when the user hands that over.
- The user's instruction outranks any skill.
- Answer a question from the user before continuing any work.
- Write everything the user sees in the user's language.
- Finish each inspection round, then repair all its findings together by cause, with their owners and affected consumers.
- Do not copy a package's API into instructions.
- Keep external generation outside deterministic playback, and retain the actual media used.
- Save each expensive stage's result and resume from it under [stage caches](.agents/skills/production/stage-caches.md).

### Principles

| Principle | Owner |
| --- | --- |
| Models stay coarse and motion is authored in detail | [Entity work](.agents/skills/development/entities.md#coarse-first) |
| The screenplay decides every exchange, outcome and reaction, and code never chooses one | [Screenplay layer](.agents/skills/story/layers/screenplay.md) |
| A film only composes accepted modules | [Composition contract](.agents/skills/contracts/development/composition.md#composition-only), [catalog cases](.agents/skills/motion/catalog-cases.md) |
| Search the installed packages before writing, and vary a module instead of copying it | [Reuse](.agents/skills/development/reuse.md) |
| Divide programming by responsibility and test each module | [Development](.agents/skills/development/SKILL.md) |

### What you can observe

You see pictures only as still images and cannot hear. Judge motion from stills dense enough to show it, on consecutive frames at every contact and cut, as [delivery review](.agents/skills/review/delivery-review.md#measure-and-compare) samples them. Ask the user to watch playback where continuous motion is the claim, and to listen to any sound.

Keep the Viewer and the frame capture working, and restore a broken one before other work, because every judgment of the film passes through them.

### Before reporting

Review your own screenplay, code, modules and film unprompted, as a demanding viewer of the depicted practice. Fix what falls short at its cause, then report what you verified, not what you built.

## Finishing work

A message without a tool call ends the turn. While work remains, do not end it with:

- a summary that announces the next step;
- an offer to continue;
- a list of decisions that do not block the work;
- a report because a stage finished;
- a wait on background work.

Put status notes in the same message as the next tool call. Stop only when nothing can move without the user or a destructive or outward-facing action needs confirmation.

## Skills

Read the production's `PROJECT.md` for the adopted scope, then enter the requested task directly.

### Creation

| Skill | Use for |
| --- | --- |
| [production](.agents/skills/production/SKILL.md) | Starting, resuming, restructuring or handing off a production: project context, sustained runs, stage caches, media records, instruction sync and final assembly |
| [story](.agents/skills/story/SKILL.md) | Research, and planning, writing, continuing or revising a brief, settings, treatments, scripts, final screenplay, expression pass, narrative evidence or cause-based repair |
| [3d-modeling](.agents/skills/3d-modeling/SKILL.md) | A subject's form: the coarse form of a few primitives by default, and a detailed representation, geometry, rig or authored control when [entity work](.agents/skills/development/entities.md#detail) says a commission needs one |
| [motion](.agents/skills/motion/SKILL.md) | Programmed performance by end-effector goals, catalog cases, staging, camera, physical responses, frame evaluation, the motion hint's control channels and motion verification |
| [image](.agents/skills/image/SKILL.md) | Canon reference images, shot frames, style frames or turnaround views |
| [video](.agents/skills/video/SKILL.md) | Choosing the video model, planning requests, writing video prompts, and generating and adopting takes |
| [audio](.agents/skills/audio/SKILL.md) | A shot's sound for the video model's prompt, a voice preview, or a commissioned soundtrack the user accepts by ear |

### Implementation and evidence

| Skill | Use for |
| --- | --- |
| [development](.agents/skills/development/SKILL.md) | Production implementation, integrations and behavioral tests |
| [evidence](.agents/skills/evidence/SKILL.md) | Adopting requirements, configuring the evidence graph and answering source and test contracts |
| [contracts](.agents/skills/contracts/SKILL.md) | The checklists each respondent answers; read before selecting, answering or citing an item |

### Writing

| Skill | Use for |
| --- | --- |
| [documentation](.agents/skills/documentation/SKILL.md) | A README, technical document, evidence prose or doc comment; creative bodies follow story |
| [prompting](.agents/skills/prompting/SKILL.md) | Changing `AGENTS.md`, `CLAUDE.md` or a skill |

### Assessment

| Skill | Use for |
| --- | --- |
| [review](.agents/skills/review/SKILL.md) | Source and narrative review, delivery acceptance, or a requested read-only experience estimation |

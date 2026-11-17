# AGENTS.md

AutoMovie lets an LLM write a screenplay and program its action, camera and timing as a reproducible 3D animation. This motion hint uses simple people and objects so contacts are easy to inspect and frames are quick to draw.

The hint can guide a video model to create finished footage, or be rendered directly with the commissioned [detail options](.agents/skills/development/entities.md#detail). A commission can also stop at the screenplay, motion hint or a standalone asset.

## Starting work

Read the production's `PROJECT.md` for its adopted scope and choices. [Project context](.agents/skills/production/project-context.md) owns that record; [production workflow](.agents/skills/production/workflow.md) owns the stages and handoffs.

A production is the directory holding its `PROJECT.md`. Its location determines the [story route](.agents/skills/story/workflow/routes.md#choosing-the-route) inside a workspace:

| Installation | Production directory | Story route |
| --- | --- | --- |
| Single production | This root | Chosen for the work |
| Workspace short | `movies/shorts/<name>` | Short |
| Workspace long work | `movies/series/<name>` | Long |

Every project path a skill names, such as `src`, `docs` or `media`, is relative to that production. Run commands from the directory whose README documents them.

Shared skills and bundled contracts live in the installation root's `.agents/skills`; production contracts live in `docs/contracts`. Workspace code follows [shared modules](.agents/skills/development/source-layout.md#shared-modules).

## Attitude

Work by these rules:

- Do the literal request, widening it only when the user hands that over.
- Follow the user's instruction over any skill.
- Answer a question from the user before continuing any work.
- Write everything the user sees in the user's language.
- Finish each inspection round, then repair all findings together by cause, with their owners and affected consumers.
- Keep external generation outside deterministic playback. Retain the actual media used.
- Save each expensive stage's result and resume from it under [stage caches](.agents/skills/production/stage-caches.md).
- Review unprompted as a demanding viewer of the depicted practice. Report what you verified.

## Principles

Keep 3D models simple and motion detailed.

### People

Use the polygon man from `@automovie/human`. [Entity work](.agents/skills/development/entities.md#people) owns preparation and commissioned detail.

### Objects

Use `@automovie/archetypes` for objects it provides. A needed object it lacks takes a coarse form with the connections its use needs, under [entity work](.agents/skills/development/entities.md#objects).

### Motion

Use `@automovie/motions` for behavior its actions and operators express. [Programmed motion](.agents/skills/motion/SKILL.md) owns detailed performance and extensions for genuinely missing actions.

Performance is kinematic. [Physical feedback](.agents/skills/motion/physical-feedback.md#when-to-simulate) owns the rare simulated response.

### Screenplay

The [screenplay](.agents/skills/story/layers/screenplay.md) decides every exchange, outcome and reaction. Code realizes those decisions.

### Modules

Divide code by responsibility and test what each module owns under [development](.agents/skills/development/SKILL.md). Films compose modules accepted in their [catalog cases](.agents/skills/motion/catalog-cases.md).

## What you can observe

Inspect pictures through the [inspector and capture](.agents/skills/visual-debugging/capture.md#restoring-the-instrument). Judge motion through [dense stills](.agents/skills/visual-debugging/capture.md#times), including consecutive frames at contacts and cuts.

Check the current model and tools before claiming auditory access. Without it, use decoded measurements and disclose that the file remains unheard under [listening](.agents/skills/audio/acquisition.md#listening).

Ask the user for continuous-playback and listening judgments that your tools cannot establish.

## Finishing work

Continue until the commissioned work is complete. A progress report, proposed next step or wait on background work does not finish the task.

Stop only when nothing can move without the user or a destructive or outward-facing action needs confirmation.

## Skills

Open a skill when the work reaches its task, in the order the [production workflow](.agents/skills/production/workflow.md) gives. Open only the pages its router names for that task, and read no page ahead of its stage.

| Skill | Use when |
| --- | --- |
| [3d-modeling](.agents/skills/3d-modeling/SKILL.md) | Preparing a subject's form, attachment or commissioned detail |
| [audio](.agents/skills/audio/SKILL.md) | Planning, generating or finishing sound |
| [automovie](.agents/skills/automovie/SKILL.md) | Choosing or reading an installed package |
| [contracts](.agents/skills/contracts/SKILL.md) | Selecting, answering or citing a contract item |
| [development](.agents/skills/development/SKILL.md) | Writing code, integrations, dependencies, commands or tests |
| [documentation](.agents/skills/documentation/SKILL.md) | Writing a document, README, evidence answer or doc comment |
| [evidence](.agents/skills/evidence/SKILL.md) | Adding requirements, configuring checks, writing or auditing evidence |
| [image](.agents/skills/image/SKILL.md) | Choosing a generator or creating and finishing images |
| [motion](.agents/skills/motion/SKILL.md) | Composing, extending or verifying motion, staging, camera and channels |
| [production](.agents/skills/production/SKILL.md) | Managing scope, workflow, caches, assembly or handoff |
| [prompting](.agents/skills/prompting/SKILL.md) | Changing `AGENTS.md`, `CLAUDE.md` or a skill |
| [review](.agents/skills/review/SKILL.md) | Reviewing work, accepting deliveries or estimating requested quality |
| [story](.agents/skills/story/SKILL.md) | Researching, planning, writing or repairing narrative |
| [video](.agents/skills/video/SKILL.md) | Choosing a video model, finishing a film or working on takes |
| [visual-debugging](.agents/skills/visual-debugging/SKILL.md) | Judging pictures or checking the viewer and capture |

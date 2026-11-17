# AGENTS.md

AutoMovie lets an LLM write a screenplay and program its action, camera and timing as a reproducible 3D animation. This motion hint uses simple people and objects so contacts are easy to inspect and frames are quick to draw.

The hint can guide a video model to create finished footage, or be rendered directly with the commissioned [detail options](.agents/skills/development/entities.md#detail). A commission can also stop at the screenplay, motion hint or a standalone asset.

## Starting work

Read the production's `PROJECT.md`, kept under [project context](.agents/skills/production/project-context.md), for its adopted scope and choices.

A production is the directory holding its `PROJECT.md`. Every project path a skill names, such as `src`, `docs` or `media`, is relative to that production. Run commands from the directory whose README documents them.

## Principles

Keep 3D models simple and motion detailed:

- People are the polygon man from `@automovie/human`.
- Objects come from `@automovie/archetypes`, or take a coarse form where it has none.
- Motion is composed from the actions of `@automovie/motions`.
- The screenplay decides every outcome, and code realizes it.

Performance is composed, not simulated. Physics is computed as films and games compute it: only at the moment, on the part and to the degree a scene needs.

## Attitude

Work by these rules:

- Do the literal request, widening it only when the user hands that over.
- Follow the user's instruction over any skill.
- Answer a question from the user before continuing any work.
- Write everything the user sees in the user's language.
- Finish each inspection round, then repair all its findings together by cause.
- Review unprompted as a demanding viewer of the depicted practice. Report what you verified.
- Judge pictures on captured stills, and ask the user for what only playback or listening shows.
- Work until the commission is complete; stop only for the user or to confirm a destructive or outward-facing action.

## Skills

Open a skill when the work reaches its task, in the order the [production workflow](.agents/skills/production/workflow.md) gives. Open only the pages its router names for that task, and read no page ahead of its stage.

| Skill | Use when |
| --- | --- |
| [3d-modeling](.agents/skills/3d-modeling/SKILL.md) | Preparing a subject's form, attachment or commissioned detail |
| [audio](.agents/skills/audio/SKILL.md) | Making commissioned sound, a voice preview or a generated film's sound |
| [automovie](.agents/skills/automovie/SKILL.md) | Choosing or reading an installed package |
| [contracts](.agents/skills/contracts/SKILL.md) | Selecting, answering or citing a contract item |
| [development](.agents/skills/development/SKILL.md) | Writing code, integrations, dependencies, commands or tests |
| [documentation](.agents/skills/documentation/SKILL.md) | Writing a document, README, evidence answer or doc comment |
| [evidence](.agents/skills/evidence/SKILL.md) | Adding requirements, configuring checks, writing or auditing evidence |
| [image](.agents/skills/image/SKILL.md) | Making appearance references, shot frames or views for generation |
| [motion](.agents/skills/motion/SKILL.md) | Composing, extending or verifying motion, staging, camera and channels |
| [production](.agents/skills/production/SKILL.md) | Managing scope, workflow, caches, assembly or handoff |
| [prompting](.agents/skills/prompting/SKILL.md) | Changing `AGENTS.md`, `CLAUDE.md` or a skill |
| [review](.agents/skills/review/SKILL.md) | Reviewing work, accepting deliveries or estimating requested quality |
| [story](.agents/skills/story/SKILL.md) | Researching, planning, writing or repairing narrative |
| [video](.agents/skills/video/SKILL.md) | Finishing the hint as a direct 3D film or a generated film |
| [visual-debugging](.agents/skills/visual-debugging/SKILL.md) | Judging pictures or checking the viewer and capture |

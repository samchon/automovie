# AGENTS.md

AutoMovie lets an LLM write a screenplay and turn it into a reproducible 3D motion hint.

The motion hint can guide video diffusion or be rendered with commissioned [detail](.agents/skills/development/entities.md#detail). A commission can also end at the screenplay, hint or a standalone asset.

## Starting work

Read the production's `PROJECT.md` for its [scope and choices](.agents/skills/production/project-context.md).

Resolve project paths from the directory containing `PROJECT.md`. Run commands from the directory whose README documents them.

## Principles

Keep subjects simple and motion detailed.

- Use the polygon man from `@automovie/human`.
- Use `@automovie/archetypes` for objects, or build a coarse form.
- Compose actions from `@automovie/motions`.

Realize the screenplay in code.

- Take every outcome from the screenplay.
- Compute physics only for the response, parts and moments the scene needs.

Work from evidence and verify the result.

- Research uncertain details the task depends on. Ask the user if the answer remains unclear or sources still conflict.
- Finish each inspection round, then repair all its findings together by cause.
- Judge pictures on captured stills. Ask the user for observations that require playback or listening.
- Review unprompted as a critical viewer of the depicted practice. Report what you verified.

Finish the commission. Pause only for a user decision or approval for a destructive or outward-facing action.

## Attitude

Work with the user.

- Do the literal request, widening it only when the user hands that over.
- Follow the user's instruction over any skill.
- Answer a question from the user before continuing any work.
- Write everything the user sees in the user's language.

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

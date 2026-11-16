# AGENTS.md

AutoMovie lets an LLM write a screenplay and program its action, camera and timing as a reproducible 3D animation. This motion hint uses simple people and objects so contacts are easy to inspect and frames are quick to draw.

The hint can guide a video model to create finished footage, or be rendered directly with the commissioned [detail options](.agents/skills/development/entities.md#detail). A commission can also stop at the screenplay, motion hint or a standalone asset.

## Starting work

Read the production's `PROJECT.md` for its adopted scope and choices under [project context](.agents/skills/production/project-context.md). The [production workflow](.agents/skills/production/workflow.md) explains the stages, their handoffs and each delivery path.

A production is the directory holding its `PROJECT.md`. Its location determines the [story route](.agents/skills/story/workflow/routes.md#choosing-the-route) inside a workspace:

| Installation | Production directory | Story route |
| --- | --- | --- |
| Single production | This root | Chosen for the work |
| Workspace short | `movies/shorts/<name>` | Short |
| Workspace long work | `movies/series/<name>` | Long |

Every project path a skill names, such as `src`, `docs` or `media`, is relative to that production. Run commands from the directory whose README documents them.

The installation root's `.agents/skills` holds the shared skills and bundled contracts. Each production keeps its own contracts in `docs/contracts`; workspace code shared between productions follows [shared modules](.agents/skills/development/source-layout.md#shared-modules).

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

| Principle | Owner |
| --- | --- |
| Keep geometry coarse and author motion in detail | [Entity work](.agents/skills/development/entities.md#coarse-first) |
| The screenplay decides every exchange, outcome and reaction, and code never chooses one | [Screenplay layer](.agents/skills/story/layers/screenplay.md) |
| Compose films only from accepted modules | [Composition contract](.agents/skills/contracts/development/composition.md#composition-only), [catalog cases](.agents/skills/motion/catalog-cases.md) |
| Search installed packages first; vary modules instead of copying them | [Reuse](.agents/skills/development/reuse.md) |
| Divide code by responsibility and test each module | [Development](.agents/skills/development/SKILL.md) |

## What you can observe

You see still images and cannot hear. Judge motion through [dense sampling](.agents/skills/visual-debugging/capture.md#times), including consecutive frames at every contact and cut.

Ask the user to watch playback for claims about continuous motion, and to listen to sound.

Judge films through the inspector page and capture command. Keep both working under [restoring the instrument](.agents/skills/visual-debugging/capture.md#restoring-the-instrument).

## Finishing work

A message without a tool call ends the turn. While work remains, do not end it with:

- a summary that announces the next step;
- an offer to continue;
- a list of decisions that do not block the work;
- a report because a stage finished;
- a wait on background work.

Put status notes in the same message as the next tool call.

Stop only when nothing can move without the user or a destructive or outward-facing action needs confirmation.

## Skills

Read every skill whose trigger fits the task:

| Skill | Use when |
| --- | --- |
| [production](.agents/skills/production/SKILL.md) | Learning the workflow, managing a production, or assembling and handing off its output |
| [story](.agents/skills/story/SKILL.md) | Researching, planning, writing or repairing narrative, or answering story contracts |
| [3d-modeling](.agents/skills/3d-modeling/SKILL.md) | Building or changing a subject's form |
| [motion](.agents/skills/motion/SKILL.md) | Authoring or verifying performance, staging, camera, physics, motion modules or control channels |
| [image](.agents/skills/image/SKILL.md) | Choosing an image generator, or generating, editing or finishing images |
| [video](.agents/skills/video/SKILL.md) | Finishing a direct 3D or generated film, choosing a video model, or working on takes |
| [audio](.agents/skills/audio/SKILL.md) | Planning, generating or finishing sound |
| [development](.agents/skills/development/SKILL.md) | Implementing source, integrations, commands or behavioral tests |
| [evidence](.agents/skills/evidence/SKILL.md) | Adopting requirements, configuring evidence, or answering source and test contracts |
| [contracts](.agents/skills/contracts/SKILL.md) | Selecting, answering or citing a contract item |
| [documentation](.agents/skills/documentation/SKILL.md) | Writing technical prose, evidence answers, READMEs or doc comments |
| [prompting](.agents/skills/prompting/SKILL.md) | Changing `AGENTS.md`, `CLAUDE.md` or a skill |
| [visual-debugging](.agents/skills/visual-debugging/SKILL.md) | Judging pictures, verifying visual changes, or restoring the inspector or capture command |
| [review](.agents/skills/review/SKILL.md) | Reviewing source or narrative, accepting deliveries, or estimating quality on request |

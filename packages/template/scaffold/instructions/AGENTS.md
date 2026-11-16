# AGENTS.md

This repository holds AutoMovie productions. A production turns an LLM-authored screenplay into a deterministic whole motion hint, the coarse film whose staging and motion guide video diffusion; a screenplay, a standalone asset, a direct 3D film or a generated film can also be commissioned alone. It is built with the installed AutoMovie packages, which [installed packages](.agents/skills/development/reuse.md#installed-packages) introduces.

A production is the directory holding its `PROJECT.md`: this root for a single production, or each `movies/shorts/<name>` and `movies/series/<name>` of a workspace, where the folder also fixes the [story route](.agents/skills/story/workflow/routes.md#choosing-the-route). Every project path a skill names, such as `src`, `docs` or `media`, is that production's, and its `README.md` lists the commands, which run in its directory. The skills and bundled contracts under `.agents/skills` serve every production; a production's own contracts live in its `docs/contracts`, and a workspace keeps its [shared modules](.agents/skills/development/source-layout.md#shared-modules) in `packages/<name>` and lists its own commands in its README.

## Attitude

Work by these rules:

- Do the literal request, widening it only when the user hands that over.
- Follow the user's instruction over any skill.
- Answer a question from the user before continuing any work.
- Write everything the user sees in the user's language.
- Finish each inspection round, then repair its findings together by cause, with their owners and affected consumers.
- Keep external generation outside deterministic playback, and retain the actual media used.
- Save each expensive stage's result and resume from it under [stage caches](.agents/skills/production/stage-caches.md).
- Review your own work unprompted as a demanding viewer of the depicted practice, and report what you verified, not what you built.

## Principles

| Principle | Owner |
| --- | --- |
| Models stay coarse and motion is authored in detail | [Entity work](.agents/skills/development/entities.md#coarse-first) |
| The screenplay decides every exchange, outcome and reaction, and code never chooses one | [Screenplay layer](.agents/skills/story/layers/screenplay.md) |
| A film only composes accepted modules | [Composition contract](.agents/skills/contracts/development/composition.md#composition-only), [catalog cases](.agents/skills/motion/catalog-cases.md) |
| Search the installed packages before writing, and vary a module instead of copying it | [Reuse](.agents/skills/development/reuse.md) |
| Divide programming by responsibility and test each module | [Development](.agents/skills/development/SKILL.md) |

## What you can observe

You see pictures only as still images and cannot hear. Judge motion from stills dense enough to show it, with consecutive frames at every contact and cut, as [visual debugging](.agents/skills/visual-debugging/capture.md#times) samples them. Ask the user to watch playback where continuous motion is the claim, and to listen to any sound.

Every judgment of the film passes through the inspector page and the capture command, so keep both working under [restoring the instrument](.agents/skills/visual-debugging/capture.md#restoring-the-instrument).

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

Read the production's `PROJECT.md` first, because it records the adopted scope and choices under [project context](.agents/skills/production/project-context.md). Then read every skill whose trigger fits the task:

| Skill | Use when |
| --- | --- |
| [production](.agents/skills/production/SKILL.md) | Starting, resuming, reorganizing or handing off a production, keeping its caches and media records, or assembling its film |
| [story](.agents/skills/story/SKILL.md) | Researching, planning, writing or revising a brief, settings, treatments, scripts or the screenplay, answering story contracts, or repairing a narrative |
| [3d-modeling](.agents/skills/3d-modeling/SKILL.md) | Building or changing a subject's form, coarse or at a commissioned [detail](.agents/skills/development/entities.md#detail) |
| [motion](.agents/skills/motion/SKILL.md) | Composing a performance, staging or camera, accepting catalog cases, extending the motion vocabulary, choosing a physical mode, retargeting, generating or tracing motion, or preparing control channels |
| [image](.agents/skills/image/SKILL.md) | Generating canon references, shot frames or turnaround views, or choosing an image generator, editing or finishing an image |
| [video](.agents/skills/video/SKILL.md) | Choosing the video model, planning or writing video requests, or generating, adopting and finishing takes |
| [direct-film](.agents/skills/direct-film/SKILL.md) | Finishing a programmed film as a direct 3D film, or judging its rendered picture |
| [audio](.agents/skills/audio/SKILL.md) | Writing a shot's sound into a video prompt, finishing a generated film's sound, making a voice preview, or building a commissioned soundtrack |
| [development](.agents/skills/development/SKILL.md) | Implementing production code, integrations, commands or behavioral tests |
| [evidence](.agents/skills/evidence/SKILL.md) | Adopting a requirement, configuring the evidence graph, or answering source and test contracts |
| [contracts](.agents/skills/contracts/SKILL.md) | Selecting, answering or citing a contract item |
| [documentation](.agents/skills/documentation/SKILL.md) | Writing a README, technical document, evidence prose or doc comment, not a creative body |
| [prompting](.agents/skills/prompting/SKILL.md) | Changing `AGENTS.md`, `CLAUDE.md` or a skill |
| [visual-debugging](.agents/skills/visual-debugging/SKILL.md) | Judging any picture, claiming a visual change works, or restoring the inspector page or the capture command |
| [review](.agents/skills/review/SKILL.md) | Reviewing source or a narrative independently, accepting a delivery, or estimating quality on request |

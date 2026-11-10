# AGENTS.md

This repository holds AutoMovie productions. A production primarily turns an LLM-authored screenplay into a deterministic whole motion-video hint, and can also deliver a separately commissioned screenplay, standalone asset, or requested direct 3D or post-diffusion film. A hint guides video-to-video diffusion, so its figures and objects need only be identifiable and its accuracy goes to performance and camera, as [entity work](.agents/skills/development/entities.md#coarse-first) sets. The [production skill](.agents/skills/production/SKILL.md) routes the commissioned output and its working files.

## Layout

A production is the directory holding its `PROJECT.md`: this repository root for a single production, or each `movies/shorts/<name>` and `movies/series/<name>` of an AutoMovie workspace. Every project path a skill names, such as `PROJECT.md`, `README.md`, `src`, `test`, `docs`, `references`, `media`, `package.json` and its configurations, is that production's, and its commands run in its directory. The skills and bundled contracts under `.agents/skills` serve every production; a production's own work and language contracts live in its `docs/contracts`.

In a workspace, `shorts` productions run settings → screenplay and `series` productions run the whole long route of the [story workflow](.agents/skills/story/workflow.md#route-and-parents). `packages/<name>` holds the workspace's own libraries that several productions import; code serving one production stays in that production. The workspace README lists its commands, and `pnpm automovie add shorts/<name>` or `series/<name>` adds a production.

## Attitude

- Do the literal request, widening it only when the user hands that over.
- The user's instruction outranks any skill.
- Answer a question from the user before continuing any work.
- Write everything the user sees in the user's language.
- Divide programming by responsibility, give each module meaningful unit tests, and assemble verified parts through their actual consumers under [development](.agents/skills/development/SKILL.md).
- Finish each inspection round, group all findings by cause, then repair their owners and affected consumers together before the next full round.
- Perfect each entity and motion module on screen in its isolated [catalog cases](.agents/skills/motion/SKILL.md) first; a film only composes the accepted modules through their APIs along the screenplay, so a film defect is repaired in its module.
- You see pictures only as still images and cannot hear, so judge motion from consecutive frames dense enough to show it, as [delivery review](.agents/skills/review/delivery.md#measure-and-compare) samples them, and ask the user to listen to any sound.
- Keep external generation outside deterministic playback; retain the actual media used.
- Save each expensive stage's result and resume from it under [stage caches](.agents/skills/production/stages.md).
- Use installed package READMEs, public types, and JSDoc for APIs; do not copy them into instructions.
- Before reporting, review your own screenplay, code, modules and film unprompted, as a demanding viewer of the depicted practice; fix what falls short at its cause, then report what you verified, not what you built.
- Keep video and 3D viewers operational. Restore a broken viewer first, repair missing capabilities at their owner and reconnect the actual consumer before continuing.

## Finishing Work

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

- [production](.agents/skills/production/SKILL.md): starting, resuming, restructuring, or delivering a production, including project context, media, conditioning, video generation, editing, encoding and handoff.
- [story](.agents/skills/story/SKILL.md): researching what the film shows before writing it, and planning, writing, continuing or revising a brief, settings, treatments, scripts, final screenplay, expression pass, narrative evidence or cause-based repair. Its parts route to the needed documents.
- [3d-modeling](.agents/skills/3d-modeling/SKILL.md): creating, importing, recovering, or inspecting asset representations, geometry, rigs, and authored controls; [entity work](.agents/skills/development/entities.md) sets what the commission needs from them.
- [motion](.agents/skills/motion/SKILL.md): programmed performance by effector goals, composed from the installed human motion vocabulary and researched laws, with staging, camera, physical responses, frame-time evaluation and motion verification.
- [image](.agents/skills/image/SKILL.md): generating canon reference images, shot frames, style frames or turnaround views.
- [video](.agents/skills/video/SKILL.md): choosing the video model, planning requests within its limits and writing video prompts.
- [audio](.agents/skills/audio/SKILL.md): deciding a shot's sound for the video model's prompt, or a voice preview the user asks to hear before video generation.

### Implementation and evidence

- [development](.agents/skills/development/SKILL.md): production implementation, integrations and behavioral tests.
- [evidence](.agents/skills/evidence/SKILL.md): adopting requirements, configuring the evidence graph and answering source and test contracts.
- [contracts](.agents/skills/contracts/SKILL.md): the checklists each respondent answers; read before selecting, answering or citing a contract item.

### Writing

- [documentation](.agents/skills/documentation/SKILL.md): writing a README, technical document, evidence prose or doc comment; creative bodies follow story.
- [prompting](.agents/skills/prompting/SKILL.md): changing `AGENTS.md`, `CLAUDE.md`, or a skill.

### Assessment

- [review](.agents/skills/review/SKILL.md): source and narrative review, actual delivery acceptance, or explicitly requested read-only experience estimation.

# AGENTS.md

This is an AutoMovie production. It primarily turns an LLM-authored screenplay into a deterministic whole motion-video hint, and can also deliver a separately commissioned screenplay, standalone asset, or requested direct 3D or post-diffusion film. A hint guides video-to-video diffusion, so its figures and objects need only be identifiable and its accuracy goes to performance and camera, as [entity work](.agents/skills/development/entities.md#coarse-first) sets. [README](README.md) lists commands and the [production skill](.agents/skills/production/SKILL.md) routes the commissioned output and its working files.

## Attitude

- Do the literal request, widening it only when the user hands that over.
- The user's instruction outranks any skill.
- Answer a question from the user before continuing any work.
- Write everything the user sees in the user's language.
- Divide programming by responsibility, give each module meaningful unit tests, and assemble verified parts through their actual consumers under [development](.agents/skills/development/SKILL.md).
- Finish each inspection round, group all findings by cause, then repair their owners and affected consumers together before the next full round.
- Perfect each entity and motion module on screen in its isolated [catalog cases](.agents/skills/motion/SKILL.md) first; a film only composes the accepted modules through their APIs along the screenplay, so a film defect is repaired in its module.
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

Read [PROJECT.md](PROJECT.md) for the adopted scope, then enter the requested task directly.

### Creation

- [production](.agents/skills/production/SKILL.md): starting, resuming, restructuring, or delivering a production, including project context, media, conditioning, video generation, editing, encoding and handoff.
- [story](.agents/skills/story/SKILL.md): researching what the film shows before writing it, and planning, writing, continuing or revising a brief, settings, treatments, scripts, final screenplay, expression pass, narrative evidence or cause-based repair. Its parts route to the needed documents.
- [3d-modeling](.agents/skills/3d-modeling/SKILL.md): creating, importing, recovering, or inspecting asset representations, geometry, rigs, and authored controls; [entity work](.agents/skills/development/entities.md) sets what the commission needs from them.
- [motion](.agents/skills/motion/SKILL.md): programmed performance from researched laws, staging, camera, physical responses, frame-time evaluation and motion verification.
- [audio](.agents/skills/audio/SKILL.md): describing a shot's sound for the video-diffusion prompt, or a voice preview the user asks for while reviewing the hint film.

### Implementation and evidence

- [development](.agents/skills/development/SKILL.md): production implementation, integrations and behavioral tests.
- [evidence](.agents/skills/evidence/SKILL.md): adopting requirements, configuring the evidence graph and answering source and test contracts.
- [contracts](.agents/skills/contracts/SKILL.md): the checklists each respondent answers; read before selecting, answering or citing a contract item.

### Writing

- [documentation](.agents/skills/documentation/SKILL.md): writing a README, technical document, evidence prose or doc comment; creative bodies follow story.
- [prompting](.agents/skills/prompting/SKILL.md): changing `AGENTS.md`, `CLAUDE.md`, or a skill.

### Assessment

- [review](.agents/skills/review/SKILL.md): source and narrative review, actual delivery acceptance, or explicitly requested read-only experience estimation.

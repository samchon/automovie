# AGENTS.md

AutoMovie lets an LLM write a screenplay and build its reproducible 3D motion hint for diffusion or rendering with commissioned [detail](.agents/skills/development/entities.md#detail). A commission may end at the screenplay, hint or standalone asset.

## Starting work

The main agent [directs](.agents/skills/production/director.md) every commission. Workers follow their roles and report to the director.

At [intake](.agents/skills/production/project-context.md#intake), confirm deliverables and reserved or delegated choices. For a screenplay, ask for the [writing route](.agents/skills/story/workflow/routes.md#who-writes-the-screenplay) unless chosen. Record it in `PROJECT.md` before assigning the writer.

Assign narrative drafts and revisions, including direct writing, to a writer subagent. Where required, assign Evidence and independent review to separate subagents at their stages.

Inspect each handoff against the commission and stage skill. Show the responsible worker any defects and check the revision before advancing.

Resolve paths from `PROJECT.md`'s directory. Run commands from their README's directory.

## Principles

Keep subjects simple and motion detailed.

- Use the polygon man from `@automovie/human`.
- Use `@automovie/archetypes` for objects, or build a coarse form.
- Compose actions from `@automovie/motions`.
  - Read JSDoc for what each input and default performs.

Realize the screenplay in code.

- Take every outcome from the screenplay.
- [Comment each value](.agents/skills/development/modules.md#documenting-source) with what it realizes and where that comes from.
- Compute physics only for the response, parts and time the scene needs.

Work from evidence and verify the result.

- [Study skilled performance](.agents/skills/story/planning/research.md#performance-study) even when using installed motions.
  - Research other uncertainties and refer unresolved choices to the user.
- Finish each inspection round before repairing its findings together by cause.
- Inspect spatial detail on frames. Judge pace in continuous playback.
  - [Record the observers](.agents/skills/review/delivery-review.md#acceptance-record).
- [Return story defects from faithful staging](.agents/skills/review/delivery-review.md#repairs) to the story owner.
  - Inspect the revised cut.

Continue independent work while a required decision or viewing is pending. Keep delivery open until required checks finish. Get approval for destructive or outward-facing actions.

## Attitude

Work with the user.

- Follow the request as given. Expand it only with user delegation.
- Follow user instructions over skills.
- Answer user questions before resuming work.
- Write all user-facing material in the user's language.

Directors, writers, reviewers and Evidence answerers pursue perfection. Each inspects the work firsthand and rejects every defect or unnatural detail, however small.

## Skills

[Choose or finish a route](.agents/skills/production/workflow.md#commissioned-outputs). For scoped work, open its skill below and follow relevant links.

| Skill | Use when |
| --- | --- |
| [3d-modeling](.agents/skills/3d-modeling/SKILL.md) | Build, rig or detail a 3D subject |
| [audio](.agents/skills/audio/SKILL.md) | Make sound or preview a voice |
| [contracts](.agents/skills/contracts/SKILL.md) | Find the checklist and its respondent |
| [development](.agents/skills/development/SKILL.md) | Change code, doc comments, dependencies, commands or tests |
| [documentation](.agents/skills/documentation/SKILL.md) | Write a project document |
| [evidence](.agents/skills/evidence/SKILL.md) | Adopt requirements, configure checks or answer them |
| [image](.agents/skills/image/SKILL.md) | Make appearance references, shot frames or set views |
| [motion](.agents/skills/motion/SKILL.md) | Author or verify motion, staging, camera or channels |
| [multi-agent](.agents/skills/multi-agent/SKILL.md) | Resume an interrupted worker |
| [production](.agents/skills/production/SKILL.md) | Choose a delivery route, assemble or hand off |
| [prompting](.agents/skills/prompting/SKILL.md) | Change agent instructions or skills |
| [review](.agents/skills/review/SKILL.md) | Review work, decide acceptance or estimate quality on request |
| [story](.agents/skills/story/SKILL.md) | Research, plan, write or repair narrative |
| [video](.agents/skills/video/SKILL.md) | Finish a direct 3D or generated film |
| [visual-debugging](.agents/skills/visual-debugging/SKILL.md) | Inspect or capture pictures, or repair the instrument |

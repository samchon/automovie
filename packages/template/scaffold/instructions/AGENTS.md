# AGENTS.md

AutoMovie lets an LLM write a screenplay and turn it into a reproducible 3D motion hint.

The motion hint can guide video diffusion or be rendered with commissioned [detail](.agents/skills/development/entities.md#detail). A commission can also end at the screenplay, hint or a standalone asset.

## Starting work

The main agent is the [director](.agents/skills/production/director.md) for every commission. A worker follows its assigned role and reports to the director.

At [project intake](.agents/skills/production/project-context.md#intake), confirm the deliverables and which decisions the user wants to make or delegate. For a screenplay, ask which [writing route](.agents/skills/story/workflow/routes.md#who-writes-the-screenplay) they want unless they have already chosen one. Record their answer in `PROJECT.md` before assigning the writer.

Assign narrative drafting and revision to a writer subagent, including direct writing. When the route calls for Evidence and independent review, assign each to a separate subagent at its stage.

Inspect each handoff against the commission and the stage's skill. If it falls short, show the responsible worker what needs repair and check the revision before advancing.

Resolve project paths from the directory containing `PROJECT.md`. Run commands from the directory whose README documents them.

## Principles

Keep subjects simple and motion detailed.

- Use the polygon man from `@automovie/human`.
- Use `@automovie/archetypes` for objects, or build a coarse form.
- Compose actions from the family namespaces of `@automovie/motions`, `AutoMovieMotionHuman<Family>`, reading in their JSDoc and the family interface what each value, preset and default performs.

Realize the screenplay in code.

- Take every outcome from the screenplay.
- [Comment each value](.agents/skills/development/modules.md#documenting-source) with its source and how it realizes it.
- Compute physics only for the response, parts and moments the scene needs.

Work from evidence and verify the result.

- [Study a skilled performance](.agents/skills/story/planning/research.md#performance-study) even when installed motions supply its actions. Research other uncertain details and refer unresolved choices to the user.
- Finish each inspection round, then repair all its findings together by cause.
- Inspect spatial detail on captured frames. Judge a film's pace in continuous playback and record who watched or listened under [delivery review](.agents/skills/review/delivery-review.md#video).
- If faithful staging exposes a story defect, [return it to its story owner](.agents/skills/review/delivery-review.md#repairs) and inspect the revised cut.

Continue independent work while awaiting a required decision or viewing. Keep the delivery open until its required checks are complete. Get approval for destructive or outward-facing actions.

## Attitude

Work with the user.

- Do the literal request, widening it only when the user hands that over.
- Follow the user's instruction over any skill.
- Answer a question from the user before continuing any work.
- Write everything the user sees in the user's language.

## Skills

Use the [production workflow](.agents/skills/production/workflow.md#commissioned-outputs) to choose or finish a commissioned route. For work already scoped, start at its skill below. Follow links when the current decision needs their rules or prerequisites.

| Skill | Use when |
| --- | --- |
| [3d-modeling](.agents/skills/3d-modeling/SKILL.md) | Preparing a subject's form, attachment or commissioned detail |
| [audio](.agents/skills/audio/SKILL.md) | Making commissioned sound, a voice preview or a generated film's sound |
| [contracts](.agents/skills/contracts/SKILL.md) | Finding what an item asks and which work answers it |
| [development](.agents/skills/development/SKILL.md) | Writing code, integrations, dependencies, commands or tests |
| [documentation](.agents/skills/documentation/SKILL.md) | Writing a document, README, evidence answer or doc comment |
| [evidence](.agents/skills/evidence/SKILL.md) | Adopting a requirement, configuring checks or recording answers |
| [image](.agents/skills/image/SKILL.md) | Making appearance references, shot frames or views for generation |
| [motion](.agents/skills/motion/SKILL.md) | Composing, extending or verifying motion, staging, camera and channels |
| [production](.agents/skills/production/SKILL.md) | Choosing a commissioned route or managing scope, assembly or handoff |
| [prompting](.agents/skills/prompting/SKILL.md) | Changing `AGENTS.md`, `CLAUDE.md` or a skill |
| [review](.agents/skills/review/SKILL.md) | Reviewing work, accepting deliveries or estimating requested quality |
| [story](.agents/skills/story/SKILL.md) | Researching, planning, writing or repairing narrative |
| [video](.agents/skills/video/SKILL.md) | Finishing the hint as a direct 3D film or a generated film |
| [visual-debugging](.agents/skills/visual-debugging/SKILL.md) | Judging pictures or checking the inspector and capture |

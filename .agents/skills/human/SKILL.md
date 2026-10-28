---
name: human
description: Supervises worker subagents that model Human figures from recovered curves through a survey, a plan, one-pass implementation and full inspection rounds fixed by cause. Use with 3d-modeling for Human geometry, the Human viewer or its renders.
---

# Human

An explicit stop overrides every modeling, capture and audit instruction. Terminate a live server only on an explicit user instruction. The [Human campaign](https://github.com/samchon/automovie/issues/2999) owns the tasks.

## Supervision

- Never work as a single agent; as the main agent, only supervise, and do no survey, plan, code or fit yourself.
- Set each subagent's task, scope and memory cap, and how many run at once.
- Read every output yourself; a subagent's report is not evidence.
- Check every join between parts: C2 at shared keys, G2 across strips, and trims.
- Check every running subagent directly every 15 minutes.
- Stop a subagent at once on any violation and warn it strongly.
- Tell the user only what you checked.
- Make every commit yourself.

| Subagent | Owns | Starts after |
| --- | --- | --- |
| Method | the fitting code every part shares | nothing |
| Trunk | trunk base, breast and buttock reliefs, the neck ring | Method |
| Head | head base and cap, face reliefs, eye openings | Trunk |
| Hand | palm, digits, digit strips, the wrist key | Method |
| Arm | arm, arm strip on the trunk | Trunk, Hand |
| Foot | foot, toes, toe strips, the ankle key | Method |
| Leg | leg, leg strip on the trunk | Trunk, Foot |
| Integration | export and render of every part; the viewer code, the shared viewer server, the compiler and GPU resources | every part; the viewer and its server at any time |

- Have one subagent fit both sides of its part.
- Run independent subagents in parallel.
- Give each shared key the one owner named above; the other side copies it.
- Let each subagent write only its own part's files, and change shared fitting code only through the Method subagent.
- Allow subagents no git, issue or pull request operation.
- Have every subagent view its own work in the shared [viewer](screenshot.md) at every stage, from the survey to each fit, not only at the end: close-ups, isolated curves, the lofting curves alone or over the skin, `material=clay`, raking lights and curve diagrams. A capture is an HTTP request to the local server.

## Work Order

1. Survey the code, data and every open defect with its traced cause into [survey.md](../../../packages/human/docs/survey.md).
2. Write the campaign's plan file under `packages/human/docs/`, mapping every defect to the change that removes its cause, and self-review it until a full round finds nothing.
3. Implement the whole plan in one pass and generate all four people.
4. Run a full [inspection round](verification.md#inspection-round), editing nothing.
5. Fix all findings by cause in one pass and return to step 4.

Edit `packages/human/src`, a calibration module or a fitter only in steps 3 and 5, and only for a change the plan names. Never change a constant and render to see its effect.

## Rules

- Make skin smooth through its generating mathematics; add no smoothing pass, clamp, threshold or exclusion after a fit.
- Build each anatomical part as its own module in its own frame, joined to its neighbors by a rule stated in [Surface composition](../../../packages/human/docs/techniques/surface-composition.md).
- Use no specimen copy, person-indexed table, source mesh or normal fallback, or arbitrary coordinate correction.
- Leave genitals and nipples out of the modelled skin.
- Take geometry from the saved Recovery/Hermite curves and judge appearance against the original [photographs](screenshot.md#references).
- Never treat a ruled reverse-render artifact as an anatomical target.
- Claim no common law or prediction for other people from f1 reproduction alone.
- Write and run no Human or Human-viewer test.
- Acquire further references, without asking, by the [reference-experiments README](../../../test/src/executable/reference-experiments/README.md).

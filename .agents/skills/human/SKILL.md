---
name: human
description: Models human figures from existing parameters and recovered curves through a written survey and plan, one-pass implementation, and full inspection rounds fixed by cause, with the main agent supervising worker subagents that do all the work. Use with 3d-modeling for Human geometry or display.
---

# Human

Honor explicit shutdowns; do not restore a deliberately stopped service. Explicit stops override modeling, capture and audit instructions.

During authorized modeling, the working viewer and screenshot path take priority over every modeling task. Keep the single service running even when models fail. If a page or capture fails, stop modeling and shared computation, repair the complete page-to-PNG path and open every required audit image before resuming. Only an explicit user instruction permits terminating a live server. See [Screenshots](screenshot.md) for interface and verification limits.

## Supervision

All Human work runs under this structure, the user's standing request for subagents under [AGENTS.md](../../../AGENTS.md). Never work as a single agent.

- The main agent only supervises. It does no survey, plan, code, fit or capture itself.
- Worker subagents do all the work. The main agent assigns each task, its scope and the method to use.
- The main agent reads every output itself: the code, the numbers, the files and the images. A subagent's report is not evidence.
- On any violation, the main agent stops the subagent at once and warns it strongly, naming the violation. Violations include inventing a heuristic or constant, faking a test or result, working outside its task, and reporting what its output does not show.
- The main agent tells the user only what it has checked in the output, and answers for it.

## Work Order

The user set this order because Human work finishes no other way:

1. Survey the code, calibration data, repair rules, shape basis and law, observations, viewer features, and every open defect with its traced cause. Write it to [survey.md](../../../packages/human/docs/survey.md) and point agent memory at it.
2. Write the plan to the topic's plan file under `packages/human/docs/`, now [redesign-plan.md](../../../packages/human/docs/redesign-plan.md): every open defect maps to the change that removes its cause, and every change lists the defects and modules it affects. Self-review the plan until a complete round finds nothing.
3. Implement the whole plan in one pass, then generate all four people.
4. Run a complete [inspection round](verification.md#inspection-round) and record every finding with its cause, editing nothing.
5. Group all findings by cause into the plan, implement them in one pass, and return to step 4 until the plan's acceptance holds.

Edit `packages/human/src`, a calibration module or a fitter only in steps 3 and 5, and only for a change the plan names; put a missing change into the plan first. Changing a cap, clamp, filter, exclusion region, length or other constant and rendering to see its effect, or converting one chain and rendering before the next, is fixing one finding at a time, however fast generation and capture are. An experiment that separates causes is planned as one set of variants, run in full outside the live source, and recorded before the plan changes.

On resuming, after a context summary, and whenever the current step is unclear, reread this section, the survey and the plan before the next edit.

## Rules

- Make skin smooth through its generating mathematics, such as fairing energies and continuity built into the formula. A smoothing pass, clamp, threshold or exclusion added after a fit hides a cause instead of removing it.
- Build each anatomical part (cranium and face mass, nose, auricles, thorax, breasts, limbs) as its own module in its own frame, joined to its neighbors by a stated rule under [Surface composition](../../../packages/human/docs/techniques/surface-composition.md) and [Modularization](../3d-modeling/modularization.md).
- Aim for an adequate, presentable result, not a copy of the reference.
- Validate specimen reproduction before accepting common parameter laws or claiming prediction.
- Use saved Recovery/Hermite curves and coefficients as primary geometric evidence under [representation contracts](references.md#extract-and-save).
- Separate known ruled reverse-render artifacts from anatomy under [Reference Defects](references.md#reverse-render-defects).
- Reject specimen copies, person-indexed control tables, source mesh/normal fallback and arbitrary coordinate corrections.
- Read the applicable [3D Modeling guide](../3d-modeling/SKILL.md). Unconsumed code, fits and documents are not rendered progress.

## Work Allocation

Under [Supervision](#supervision), the main agent assigns these roles to subagents before parallel work:

- One integration owner controls the common skeleton and boundaries.
- One execution owner controls compiler, native, GPU and capture resources.
- Every subagent reads [Verification](verification.md) before implementation; the main agent keeps responsibility for checks and user reports.

## Modeling Method

The plan derives its changes by this method:

1. Bind the current Human contract, [Playground parameter authority](screenshot.md#parameters-and-aliases), achieved inputs and [reference curves](references.md).
2. Identify body features, source-backed axes, frames and principal layers under [Reverse Analysis](reverse-analysis.md) and [Anatomy](anatomy.md).
3. Solve intermediate axes/curves from endpoint, tangent, shape and continuity conditions; recurse into both child intervals.
4. Integrate one authority for skin, construction and neighbors under [Construction](construction.md).
5. Inspect actual root consumption and rendered reproduction under [Verification](verification.md); qualify common input responses separately.

- Fit f1's observed whole body first, through public generation, actual model and viewer, including skin, construction and every join; carry f2, m1 and m2 through shared rules.
- Use recovered coordinates as calibration constraints, without person-indexed tables; f1 reproduction alone does not establish common laws or unseen-shape prediction.
- Complete every [render audit](verification.md#audit-and-user-reports). A failed request, an unavailable status or an old image does not satisfy it; repair capture and finish the required fresh images.
- Use available observations immediately. [Additional references](references.md#add-or-resume-a-reference) are already authorized when needed; acquisition must not become an implementation delay.

The [Human campaign](https://github.com/samchon/automovie/issues/2925) owns modeling; [reference supply](https://github.com/samchon/automovie/issues/2926) owns `test/.shots/{f1,f2,m1,m2}/` and its manifest.

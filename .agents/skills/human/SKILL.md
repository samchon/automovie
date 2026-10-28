---
name: human
description: Supervises worker subagents that preserve and improve complete Human figures from recovered curves, observing development in the viewer and fixing full inspection rounds by cause. Use with 3d-modeling for Human geometry, the Human viewer or its renders.
---

# Human

Start from the existing working human figure and remove overfitting while preserving normal proportions, silhouettes and connected anatomy. Judge both existing code and its replacement from their actual construction and viewer output; the baseline is a comparison, not proof of generality. Follow the user's task order before the campaign's order. An explicit stop overrides every modeling, capture and audit instruction. Terminate a live server only on an explicit user instruction.

## Supervision

- Never work as a single agent; as the main agent, only supervise, and do no survey, plan, code, fit or capture yourself.
- Set each subagent's task, scope, high reasoning effort and memory cap, and how many run at once.
- Read every output yourself; a subagent's report is not evidence.
- Check every running subagent directly every 15 minutes.
- Stop a subagent at once on any violation and warn it strongly.
- Tell the user only what you checked.
- Make every commit yourself.

| Subagent | Owns | Starts after |
| --- | --- | --- |
| Method | the formulas and construction every part shares | nothing |
| Trunk | trunk base, breast and buttock reliefs, the neck ring | Method |
| Head | head base and cap, face reliefs, eye openings | Trunk |
| Hand | palm, digits, digit strips, the wrist key | Method |
| Arm | arm, arm strip on the trunk | Trunk, Hand |
| Foot | foot, toes, toe strips, the ankle key | Method |
| Leg | leg, leg strip on the trunk | Trunk, Foot |
| Integration | export and render of every part; the viewer, the capture path and compiler and GPU resources | every part; the viewer and capture path at any time |

- Have one subagent model both sides of its part.
- Run independent subagents in parallel.
- Give each shared key the one owner named above; the other side copies it.
- Let each subagent write only its own part's files, and change shared formulas and construction only through the Method subagent.
- Allow subagents no git, issue or pull request operation.
- Let only the Integration subagent touch a server.

## Work Order

1. Inspect the existing working figure in the actual viewer, then survey its code and observations. Record all relevant defects and overfitting dependencies with their traced causes and contributing factors in [survey.md](../../../packages/human/docs/survey.md).
2. Write the campaign's plan file under `packages/human/docs/`, mapping every cause to its replacement and the existing connections and consumers it must preserve, and self-review it until a full round finds nothing.
3. Replace the planned causes in one batch, observing each part during development as [Verification](verification.md) requires. Retire a replaced path only after its replacement preserves the affected shape, joins and ordinary input behavior.
4. Run a full [inspection round](verification.md#inspection-round) for the affected person and parts, editing nothing.
5. Fix all findings by cause in one pass and return to step 4.

Edit `packages/human/src`, a calibration module or a fitter only in steps 3 and 5, and only for a change the plan names. Never change a constant and render to see its effect.

## Rules

- Make skin smooth through its generating mathematics; add no smoothing pass, clamp, threshold or exclusion after a fit.
- Build each anatomical part as an independently deformable module in its own frame under a common body frame, joined to its neighbors by a rule stated in [Surface composition](../../../packages/human/docs/techniques/surface-composition.md).
- Preserve reusable topology, assembly, rigs, export and working consumers while removing person-specific or observation-layer-specific corrections.
- Treat existing shared skin connections as reusable; concentrate on replacing fitted shape authority rather than restarting their construction or generality proof.
- Keep common mathematics in the shared math modules under Method ownership. Use one common construction and a declared reflection for symmetric sides, including the boundary maps, derivatives and orientation.
- Keep working full skin and the normal generation path available; replacing them with empty or unavailable output is a regression.
- Use numerical geometry, needed derivatives, and sampling and rendering of the generated surface mesh. Require only the accuracy, reproducibility and invariants the task needs; completed proofs are not prerequisites for previews.
- Use reference meshes and normals as observations, not as the generated anatomy; use no person-indexed table or arbitrary coordinate correction.
- Treat observation error as a diagnostic, never a target for person-specific constants or a reason to accept missing or malformed anatomy.
- Leave genitals and nipples out of the modelled skin.
- Use the saved Recovery/Hermite curves as observations for common formulas and judge appearance against the original [photographs](screenshot.md#references).
- Never treat a ruled reverse-render artifact as an anatomical target.
- Claim no common law or prediction for other people from f1 reproduction alone.
- Write and run no Human or Human-viewer test.
- Acquire further references, without asking, by the [reference-experiments README](../../../test/src/executable/reference-experiments/README.md).

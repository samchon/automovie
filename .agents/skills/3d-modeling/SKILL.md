---
name: 3d-modeling
description: Defines what automovie models and what it refuses to model, and the verification discipline every geometry, parameter, and derived-data change is held to. Use before any model, geometry, rig, morph, or asset-pipeline work, and before proposing anything that would raise a figure's fidelity.
---

# 3D Modeling

This skill governs everything the product models: procedural geometry, spaces and boundaries, rigs and skeletons, morph and expression channels, gait and motion tables, ingested assets, and every value derived from them.

A figure carries readable structure. Joints obey range-of-motion limits, feet plant on the actual ground function, and gait comes from a declared table. The project skill's [Out of Scope](../project/SKILL.md#out-of-scope) section routes the appearance boundary.

## Measure, then conclude

Measure, evaluate, decide, in that order. Assert no cause, verdict or fix before you have measured the geometry and looked at a render, because reasoning from one number or an assumption produces confident wrong fixes.

Measure numerically (landmark distances, bounds, angles, byte digests) and look at the result. To attribute a change to a cause, render an A/B with and without it instead of guessing which edit helped.

Judge with a directional key light that casts the planes. A soft even wash makes a broken shape look passable and a good one dull. Flat shading and normal display isolate geometry from material when the question is whether the shape is right.

## Verify, then report

Change, render, review the render yourself, critique it honestly and change again, until the result is correct or you reach a real, named ceiling. Report only then, evidence first, stating what is still wrong.

Claiming a fix before showing the verified render is forbidden. Let the render carry the claim and describe the remaining flaws yourself, because "less bad than before" is not "correct". The [viewer-verification skill](../viewer-verification/SKILL.md) defines how to drive the render.

## Rebuild a broken foundation

When a base representation is fundamentally wrong, rebuild it. Each corrective undoes part of the previous one, and the result is a patched version of the original error. A corrective is legitimate only when the base is sound and the change is small, measured and verified against a render.

Compute one quantity in one function. A hand copy is a second answer that eventually disagrees with the first, so the code that draws is the code that measures.

## Derived data embeds its basis

A residual, a fitted preset or a baked artifact is defined against a base (`subject - base`). Regenerate every derivative whenever the base changes, or the correction applies twice. State the basis in the artifact, which makes a stale derivative detectable instead of merely wrong.

## Parameters and rigs

- Nest types by anatomy or domain and document each channel in its field JSDoc. The form a channel takes is answered under the contracts skill's [Parameter Channels](../contracts/modeling.md#parameter-channels) chapter.
- Enforce ranges in `engine` validators and never with `typia` tags in `interface`; the development skill's rough-types rule owns that boundary.
- Record the study behind a numeric range in `.wiki/04-domain-research/`, and read that directory before deriving a range again.

## Every angle, every scale

A model is not its most flattering view. Verify front, three-quarter and side, and verify at the distance the shot uses: a proxy that reads at fifty metres can be nonsense in a close framing, and a shape tuned in close-up can vanish in a crowd. Silhouette survives distance, so judge it there.

## Pipeline discipline

Keep scratch in gitignored directories and promote only stabilized logic into packages. The render harness drives the deployed viewer headless and multi-angle with form-revealing lighting.

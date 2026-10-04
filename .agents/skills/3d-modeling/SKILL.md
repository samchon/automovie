---
name: 3d-modeling
description: Defines what automovie models and what it refuses to model, and the verification discipline every geometry, parameter, and derived-data change is held to. Use before any model, geometry, rig, morph, or asset-pipeline work, and before proposing anything that would raise a figure's fidelity.
---

# 3D Modeling

This skill governs everything the product models: procedural geometry, spaces and boundaries, rigs and skeletons, morph and expression channels, gait and motion tables, ingested assets, and every value derived from them.

A figure carries readable structure. Joints obey range-of-motion limits, feet plant on the actual ground function, and gait comes from a declared table. The project skill's [Out of Scope](../project/SKILL.md#out-of-scope) section routes the appearance boundary.

## Measure and look before concluding

Assert no cause, verdict or fix before you have measured the geometry (landmark distances, bounds, angles, byte digests) and looked at the current render, because reasoning from one number or an assumption produces confident wrong fixes. To attribute a change to a cause, compare renders with and without it instead of guessing which edit helped.

Iterate change, render and your own critique until the result is correct or reaches a named ceiling, then report with the render as evidence and the remaining flaws stated, because "less bad than before" is not "correct". Claiming a fix before showing the verified render is forbidden. The [viewer-verification skill](../viewer-verification/SKILL.md) owns how to capture and read the render, and the contracts skill's [Rendered Observation](../contracts/modeling.md#rendered-observation) chapter owns which views, states and scales a part, joint or assembly owes.

## Rebuild a broken foundation

When a base representation is fundamentally wrong, rebuild it. Each corrective undoes part of the previous one, and the result is a patched version of the original error. A corrective is legitimate only when the base is sound and the change is small, measured and verified against a render.

Compute one quantity in one function. A hand copy is a second answer that eventually disagrees with the first, so the code that draws is the code that measures.

## Derived data embeds its basis

A residual, a fitted preset or a baked artifact is defined against a base (`subject - base`). Regenerate every derivative whenever the base changes, or the correction applies twice. State the basis in the artifact, which makes a stale derivative detectable instead of merely wrong.

## Parameters and rigs

- Nest types by anatomy or domain and document each channel in its field JSDoc. The form a channel takes is answered under the contracts skill's [Parameter Channels](../contracts/modeling.md#parameter-channels) chapter.
- Enforce ranges in `engine` validators and never with `typia` tags in `interface`; the development skill's rough-types rule owns that boundary.
- Record the study behind a numeric range in `.wiki/04-domain-research/` and consult the relevant existing study before deriving it again. When local records are absent, start from the public task and primary source; their absence is no prerequisite for diagnosis.

## Pipeline discipline

Keep scratch in gitignored directories and promote only stabilized logic into packages.

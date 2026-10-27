# Human research

These notes hold literature, mathematical derivations and bounded reference observations for `packages/human`. They are research inputs and do not show that the generator implements or visually satisfies a method. `AutoMovieHuman.generate(params)` takes `IAutoMovieHumanParameters` and returns `IAutoMovieHumanGenerated`, which holds `parameters` and `model`.

## Reading map

| Need | Notes |
| --- | --- |
| Current code, data, observations and open defects | [Survey](survey.md) |
| Measured findings of the fitting and measurement programs | [Experiment findings](experiments.md) |
| Generator design | [Section-chain lofting](techniques/section-chain-lofting.md) |
| Measurement definitions, populations, licences and reading limits | [Literature source index](sources/README.md) |
| Original Hermite widths, degree and interpolation limits | [Parametric curve families](techniques/parametric-curve-family.md) |
| Common supports and coordinate distinctions | [Neutral supports](techniques/neutral-supports.md) |
| Source incidence, branches and geometric phase | [Branch correspondence](techniques/branch-source-correspondence.md) |
| Rational chart derivatives and surface pullback | [Signed-plane charts](techniques/plane-pencil-chart.md) |
| Trunk feature and derivative identification | [Trunk curves](techniques/trunk-curve-identification.md), [intervals](techniques/trunk-interval-identification.md) |
| Limb, joint and shared-boundary methods | [Limbs](techniques/limb-curve-rules.md), [joints](techniques/joint-curve-rules.md), [shared joints](techniques/shared-joint-authority.md) |
| Neck, pelvic and extremity constraints | [Neck](techniques/neck-curve-identification.md), [pelvic seams](techniques/pelvis-common-seams.md), [hands and feet](techniques/extremity-curve-identification.md) |
| Facial correspondence and sheet topology | [Head](techniques/head-curve-identification.md), [nasal sheets](techniques/nasal-sheet-identification.md) |
| Alternative model representations | [Section-based models](references/section-body-models.md), [target-based models](references/makehuman.md) |
| Rest deformation and seam behavior | [Skinning](techniques/skinning.md), [junctions](techniques/junction-and-seams.md), [surface inspection](techniques/surface-interrogation.md) |
| Hair, skin and garment appearance | [Eyes and lids](techniques/eyes.md), [lashes and brows](techniques/eyelashes-and-brows.md), [hair cards](techniques/hair-cards.md), [skin material](techniques/skin-material.md), [procedural fields](techniques/procedural-skin-fields.md), [UV charts](techniques/uv-layout.md), [garments](techniques/garments.md) |
| Measurement and tissue protocols | [Skeleton](anatomy/skeleton.md), [hand](anatomy/hand.md), [foot](anatomy/foot.md), [ear](anatomy/ear.md), [hair](anatomy/hair.md), [skin](anatomy/skin.md) |
| Representation and numerical limits | [Subdivision](techniques/subdivision-and-cage.md), [contour reconstruction](techniques/reference-contour-reconstruction.md), [determinism](techniques/determinism.md) |

## Reference authority

The reference outputs are `test/.shots/{f1,f2,m1,m2}/`, and `test/.shots/manifest.json` selects the exact members. Typed parameters are `packages/playground/src/human-parameters/{f1,f2,m1,m2}.ts`. The [reference-experiments README](../../../test/src/executable/reference-experiments/README.md) owns acquisition and alias relocation.

To read a Recovery capture:

1. Select the manifest's `subjects[]` member by id.
2. Its `ruledCapture.path` selects the Recovery capture index.
3. Resolve `screenshotDirectory` relative to that index and append `frames[].name`.
4. Verify each frame's sha256.

Original photographs use each alias's `captures.json` and stay distinct from Recovery reverse renders. Receipt bytes are immutable; resolve older addresses through `test/reference-inputs/alias-relocation.json`.

Saved Recovery/Hermite coefficients, physical parameter widths, directions and derivatives supply geometric constraints. Original reference photographs judge appearance. Ruled reverse renders are a separate reconstruction view with comb-like striping and some cracks of unverified cause, and those artifacts are not anatomical targets. A fitted Fourier or polynomial family approximates the saved curves rather than reducing them exactly.

Source identities, private paths, class names, fitted numbers and inspection results in the research notes belong to an earlier reference cohort. Rebind the request input, its application and readback, model SHA, Hermite and continuation members and image receipts before using one of them on the current four aliases.

## Ownership

This directory owns durable research knowledge, and [survey.md](survey.md) holds step 1 of the Human skill's [work order](../../../.agents/skills/human/SKILL.md#work-order). The [Human skill](../../../.agents/skills/human/SKILL.md) owns work rules, [verification](../../../.agents/skills/human/verification.md) owns inspection and reporting, and [screenshots](../../../.agents/skills/human/screenshot.md) owns the viewer and PNG interface. [Campaign #2999](https://github.com/samchon/automovie/issues/2999) owns implementation tasks. Research observations do not override those contracts or establish specimen reproduction, parameter response or unseen-shape prediction.

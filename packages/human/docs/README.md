# Human research

These notes retain literature, mathematical derivations and bounded reference observations. They are research inputs, not evidence that the current generator implements or visually satisfies a method. The current public contract accepts `IAutoMovieHumanParameters` and returns `IAutoMovieHumanGenerated`, containing `parameters` and `model`. `AutoMovieHuman.generate(params)` is the public entry; these notes establish no implementation or visual-completion status.

## Reading map

| Need | Notes |
| --- | --- |
| Current generator design and status | [Section-chain lofting](techniques/section-chain-lofting.md) |
| Measurement definitions, populations, licences and reading limits | [Literature source index](sources/README.md) |
| Original Hermite widths, degree and interpolation limits | [Parametric curve families](techniques/parametric-curve-family.md) |
| Common supports and coordinate distinctions | [Neutral supports](techniques/neutral-supports.md) |
| Source incidence, branches and geometric phase | [Branch correspondence](techniques/branch-source-correspondence.md), [guide observations](techniques/branch-guide-observation-audit.md) |
| Rational chart derivatives and surface pullback | [Signed-plane charts](techniques/plane-pencil-chart.md) |
| Trunk feature and derivative identification | [Trunk curves](techniques/trunk-curve-identification.md), [intervals](techniques/trunk-interval-identification.md) |
| Limb, joint and shared-boundary methods | [Limbs](techniques/limb-curve-rules.md), [joints](techniques/joint-curve-rules.md), [shared joints](techniques/shared-joint-authority.md) |
| Neck, pelvic and extremity constraints | [Neck](techniques/neck-curve-identification.md), [pelvic seams](techniques/pelvis-common-seams.md), [hands and feet](techniques/extremity-curve-identification.md) |
| Facial correspondence and sheet topology | [Head](techniques/head-curve-identification.md), [nasal sheets](techniques/nasal-sheet-identification.md) |
| Alternative model representations | [Section-based models](references/section-body-models.md), [target-based models](references/makehuman.md) |
| Rest deformation and seam behavior | [Skinning](techniques/skinning.md), [junctions](techniques/junction-and-seams.md), [surface inspection](techniques/surface-interrogation.md) |
| Hair and skin appearance | [Hair cards](techniques/hair-cards.md), [skin material](techniques/skin-material.md), [procedural fields](techniques/procedural-skin-fields.md), [UV charts](techniques/uv-layout.md) |
| Measurement and tissue protocols | [Skeleton](anatomy/skeleton.md), [hand](anatomy/hand.md), [foot](anatomy/foot.md), [hair](anatomy/hair.md), [skin](anatomy/skin.md) |
| Representation and numerical limits | [Subdivision](techniques/subdivision-and-cage.md), [contour reconstruction](techniques/reference-contour-reconstruction.md), [determinism](techniques/determinism.md) |
| Earlier dataset provenance | [Frozen input ledger](references/frozen-reference-inputs.md) |

## Current reference authority

The current reference outputs are `test/.shots/{f1,f2,m1,m2}/`; `test/.shots/manifest.json` selects the exact members. Typed parameter authority is `packages/playground/src/human-parameters/{f1,f2,m1,m2}.ts`. [References](../../../.agents/skills/human/references.md) owns acquisition and alias relocation. Select the manifest subjects[] member by id; its ruledCapture.path selects the Recovery capture index. Resolve screenshotDirectory relative to that index and append frames[].name, then verify frame sha256. Original photographs use each alias's captures.json and remain distinct from Recovery reverse renders. Preserve immutable receipt bytes; resolve older addresses through test/reference-inputs/alias-relocation.json.

Saved Recovery/Hermite coefficients, physical parameter widths, directions and derivatives supply geometric constraints. Original reference photographs judge appearance. Ruled reverse renders are a separate reconstruction view with reported comb-like striping and some cracks; their causes remain unverified, and those artifacts are not anatomical targets. A fitted Fourier or polynomial family is a separate approximation, not an exact reduction of the saved curves.

Earlier source identities, private paths, class names, fitted numbers and inspection results in research notes retain their original evidential context. They do not select current files, certify the current runtime or authorize shipping source-conditioned tables. The reference cohort was replaced after a parameter-application problem; renaming an older identity does not validate its measurements, phase correspondence, coefficients or acceptance results. Rebind the selected request input, actual application/readback, model SHA, Hermite/continuation members and image receipts before using an observation. This documentation cleanup has not performed that current-cohort revalidation. The frozen ledger describes an earlier dataset and must not be substituted for the current four aliases.

## Ownership

This directory owns durable research knowledge. The [Human skill](../../../.agents/skills/human/SKILL.md) owns work rules, [verification](../../../.agents/skills/human/verification.md) owns inspection and reporting, and [screenshots](../../../.agents/skills/human/screenshot.md) owns the single viewer and PNG interface. [Campaign #2925](https://github.com/samchon/automovie/issues/2925) owns implementation tasks. Research observations do not supersede those contracts or establish specimen reproduction, independent parameter response or unseen-shape prediction.

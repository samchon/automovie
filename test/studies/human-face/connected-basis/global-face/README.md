# Global facial morphology

The connected editor selects this revision, `mpfb-connected-head-2026-09-17-binocular-frame`. It adds four whole-head controls to the [regional basis](../whole-face/README.md), giving 84 shape and 52 expression controls. The previous basis, studies and research remain preserved. Saved documents require their exact basis revision.

## Source and coordinates

The pinned [CC0 source and license record](../README.md#sources-and-license) applies. MPFB's macro target service supplies age structure, sexual dimorphism, adiposity and muscularity endpoints. These are dimensionless authored morphological axes, not estimates of a person's age, sex, body mass or health. The source macro values are recorded in [extraction-receipt.json](extraction-receipt.json); the source population mixture remains unchanged.

Whole-body macro targets also translate the head when stature changes. Each sampled endpoint therefore subtracts the change in the centroid of the complete bilateral eye surface from every attached surface. This preserves relative displacements while keeping a common binocular reference frame. It applies the same translation to skin, eyes, brows, lashes, teeth and tongue; it does not resize individual parts or correct a particular subject.

The neutral positions, materials, UVs, connectivity and all 212 preceding endpoints are exact. All six surfaces recover their neutral coordinates exactly after source extraction. The eight new signed endpoints passed the public builder and Float32 GLB exporter. Direct inspection covered their 72 canonical colour/clay views. Age and dimorphism visibly change the cranium, jaw and surrounding tissues; adiposity and muscularity act mainly on the retained neck in this source asset. They do not supply a measured physiological model or guarantee arbitrary combinations.

## Joint input fitting

The nineteen studies use one bounded robust whole-face objective. Six semantic landmark groups (lips, eyes, brows, outline, nose and the remaining surface) contribute equal mean-square terms instead of letting the largest landmark population dominate the fit. Shape channels use a 0.003 neutral regularizer; expression channels retain the detector's observed performance with a 0.015 regularizer. These weights are numerical fitting choices, not clinical uncertainty estimates.

Signed positive and negative endpoints meet at a derivative discontinuity at zero. Each subject is solved from three complete shape vectors, zero and uniform -0.2/+0.2, retaining the smallest identical robust objective. No subject-specific loss or anatomical parameter is hardcoded. [subject-receipt.json](subject-receipt.json) retains all three costs, convergence results, source identities, per-group residuals and actual exported GLB hashes.

Against the preceding equal-landmark fit, the equal-group root mean changed from 0.019433181 to 0.018298222, a 5.84 percent reduction. Mean residuals decreased for lips, eyes, brows and nose and increased for outline and the remaining points. Equal-landmark RMS increased from 0.013823136 to 0.013964530, showing why neither density convention is a likeness score.

Direct review covered the candidate's 171 canonical views and 38 additional before/after views registered with each fit's rotation, orthographic scale and translation. A rejected trial weakened expression regularity to 0.003: it lowered central-feature residuals further but systematically removed mouth opening and tooth exposure from smiling inputs. Restoring 0.015 retained those performances while preserving the central-feature improvement, so only that result is published. Generic head appearance, weak older tissue, the distorted generated-white-girl smile and absent scalp grooming still limit likeness. Registration uses estimated weak perspective, not recovered physical camera intrinsics. These studies remain editable candidates without whole-person likeness acceptance.

## Research continuity

The [whole-face research inventory](../whole-face/reference-application.md) remains the domain map. This revision applies the global morphology lesson with source-authored targets and a common attachment frame. It does not add proprietary MetaHuman geometry, fabricated corrective targets, hair, dental shape controls or a collision guarantee. The research chronology and reproduction locators are preserved in [#2513](https://github.com/samchon/automovie/issues/2513).

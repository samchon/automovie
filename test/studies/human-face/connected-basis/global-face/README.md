# Global facial morphology

The connected editor selects this revision, `mpfb-connected-head-2026-09-17-binocular-frame`. It adds four whole-head controls to the [regional basis](../whole-face/README.md), giving 84 shape and 52 expression controls. The previous basis, studies and research remain preserved. Saved documents require their exact basis revision.

## Source and coordinates

The pinned [CC0 source and license record](../README.md#sources-and-license) applies. MPFB's macro target service supplies age structure, sexual dimorphism, adiposity and muscularity endpoints. These are dimensionless authored morphological axes, not estimates of a person's age, sex, body mass or health. The source macro values are recorded in [extraction-receipt.json](extraction-receipt.json); the source population mixture remains unchanged.

Whole-body macro targets also translate the head when stature changes. Each sampled endpoint therefore subtracts the change in the centroid of the complete bilateral eye surface from every attached surface. This preserves relative displacements while keeping a common binocular reference frame. It applies the same translation to skin, eyes, brows, lashes, teeth and tongue; it does not resize individual parts or correct a particular subject.

The neutral positions, materials, UVs, connectivity and all 212 preceding endpoints are exact. All six surfaces recover their neutral coordinates exactly after source extraction. The eight new signed endpoints passed the public builder and Float32 GLB exporter. Direct inspection covered their 72 canonical colour/clay views. Age and dimorphism visibly change the cranium, jaw and surrounding tissues; adiposity and muscularity act mainly on the retained neck in this source asset. They do not supply a measured physiological model or guarantee arbitrary combinations.

## Joint input fitting

The nineteen studies use the same bounded whole-face objective and observed performance prior described by the [regional fitting record](../whole-face/README.md#input-studies). Signed positive and negative endpoints meet at a derivative discontinuity at zero. Each subject is therefore solved from three complete shape vectors, zero and uniform -0.2/+0.2, retaining the smallest identical robust objective. No subject-specific loss or anatomical parameter is hardcoded. [subject-receipt.json](subject-receipt.json) retains all three costs, convergence results, source identities and actual exported GLB hashes.

Mean normalized landmark RMS changed from 0.0140670594 to 0.0138231359 across the same nineteen inputs, a 1.73 percent reduction in this projection proxy. Every subject's RMS decreased. This is a small numerical improvement, not a likeness percentage. The frozen original girl remains outside the fitting population.

Direct review covered all 171 canonical views and 38 additional before/after views registered with each fit's rotation, orthographic scale and translation. Registered views confirm small contour changes, while oversized vermilion, narrowed eye apertures, generic head appearance, weak older tissue and absent scalp grooming still limit likeness. Registration uses estimated weak perspective, not recovered physical camera intrinsics. These studies remain editable candidates without whole-person likeness acceptance.

## Research continuity

The [whole-face research inventory](../whole-face/reference-application.md) remains the domain map. This revision applies the global morphology lesson with source-authored targets and a common attachment frame. It does not add proprietary MetaHuman geometry, fabricated corrective targets, hair, dental shape controls or a collision guarantee. The research chronology and reproduction locators are preserved in [#2513](https://github.com/samchon/automovie/issues/2513).

# src/film/intersectsPerspectiveFrustumSphere.ts#intersectsPerspectiveFrustumSphere

## @evidence contracts/development/implementation.md#principled-implementation

The standard sphere-versus-half-space test against each of the six frustum planes, with each side plane `x - t·d = 0` normalized by `hypot(1, t)` so the comparison is a true Euclidean distance; the exact-real method rejects a sphere outside one plane and is conservative at edges and corners. Floating products and boundary rounding retain the stated numerical limits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The crop conversion is the shared `deliveryCropNdc`; this function keeps only the distance comparisons, serving the geometry measurement and the viewer's formation culling with one rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance pads the radius and no camera or subject is special-cased; the invalid-radius refusal applies to every caller alike.

## @evidence contracts/development/common.md#meaningful-documentation

States the plane normalization and why NDC padding is wrong, the conservative edge and corner behaviour and what each caller does with it, the invalid-radius answer, the crop error, and each parameter's frame and units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant local work performs one inverse rotation, at most one crop conversion and six plane comparisons; no performance measurement or frame-time budget is claimed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure predicate over one sphere and one camera that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The camera-local centre and the NDC crop are garbage on return, and the predicate keeps no reference to the camera or sphere.

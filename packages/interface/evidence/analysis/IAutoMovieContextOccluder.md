# src/analysis/IAutoMovieContextOccluder.ts#IAutoMovieContextOccluder

## @evidence contracts/development/design.md#principled-representation

A convex solid as a half-space intersection, which the daylight solver tests analytically with the slab method in `autoMovieSolidBlocks`; `validateSolidPlanes` checks at least four planes, finite normals longer than `1e-12`, and finite offsets.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Id, kind and planes only, the same plane shape a logical space's convex cell uses, so `autoMovieContextSolids` passes the plane array through without conversion.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Empty and unbounded intersections remain unchecked; reserved-id collision checks apply only when the caller supplies those ids. Ray clipping treats slopes within 1e-12 of the normal-relative parallel band as parallel, and raw binary64 intermediates can overflow, so admitted planes are not an exact visibility certificate.

## @evidence contracts/development/common.md#meaningful-documentation

States why the record is only a blocker, the inside convention and normal direction, exactly what validation checks and does not, the id scope, and the minimum plane count.

# src/geometry/IAutoMovieLimitSubdivisionRing.ts#IAutoMovieLimitSubdivisionRing.IResult

## @evidence contracts/development/design.md#principled-representation

Position uses the ring's local metres; normals are unit vectors in the same frame and sectors are zero-based normal indices.

## @evidence contracts/development/design.md#minimal-and-owned-surface

limitSubdivisionRing serves limitSubdivisionLevel and uses subdivisionRingEigenbasis for exceptional tangent masks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller first exhausts semi-sharp edges so sharpness is 0 or 10; undefined tangent planes and vanishing or nonfinite normals refuse, while documented wide crease-sector masks remain approximations.

## @evidence contracts/development/common.md#meaningful-documentation

Limit position, sector normals and face-to-sector mapping of one vertex fan. Position uses the ring's local metres; normals are unit vectors in the same frame and sectors are zero-based normal indices.

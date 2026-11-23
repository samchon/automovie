# src/architecture/IAutoMovieBuiltEnvelopeFace.ts#IAutoMovieBuiltEnvelopeFace

## @evidence contracts/development/design.md#principled-representation

Exposure means a declared face separates exactly one declared space. The normal is authored +Z flipped only when a positive-offset centroid probe passes containment; this heuristic does not certify global outward orientation. The shoelace centroid falls back to the vertex mean below the area threshold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries identity, owner, authored label, aspect and world geometry together, so the census and the corner finder read one record per face instead of re-deriving world vertices and normals.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Authored `kind` never decides aspect or exposure. The same positive-side containment probe applies to every face; an outside probe preserves the authored direction rather than inventing an orientation certificate.

## @evidence contracts/development/common.md#meaningful-documentation

States the exposure rule, the producer and its order, when no record is produced and when the producer throws, how the normal is derived and why, the centroid weighting, the vertex order and the metre units.

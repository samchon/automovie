# src/geometry/IAutoMovieLimitSubdivisionLevel.ts#IAutoMovieLimitSubdivisionLevel.IResult

## @evidence contracts/development/design.md#principled-representation

Positions retain local metres; normal triples are unitless and cornerNormals indexes the normal population rather than vertices.

## @evidence contracts/development/design.md#minimal-and-owned-surface

limitSubdivisionLevel produces the arrays consumed by evaluateSubdivisionLevel when materializing a surface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies admitted or refined topology; semi-sharpness is exhausted before limit masks, and undefined or nonfinite limit normals refuse.

## @evidence contracts/development/common.md#meaningful-documentation

Limit positions and face-varying normal indices for an admitted subdivision level. Positions retain local metres; normal triples are unitless and cornerNormals indexes the normal population rather than vertices.

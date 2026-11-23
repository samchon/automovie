# src/architecture/IAutoMovieBuiltEnvelopeCorner.ts#IAutoMovieBuiltEnvelopeCorner

## @evidence contracts/development/design.md#principled-representation

Pairs non-parallel facades of one building by vertex proximity, averages approximately nearest pair midpoints and classifies the sign of the first normal toward the second centroid. The side is a one-normal convention, not a test that both bodies lie behind each other's planes or that their geometry intersects.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries an id, the building, both facade ids, the kind, a point and an aim direction, which is what a corner observation needs to place a camera, without copying facade geometry the census already holds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The thicker wall plus `AUTOMOVIE_OBSERVATION_EPSILON` is the shared proximity allowance policy, not a proof of construction error bounds. Degenerate pairs are skipped rather than assigned an arbitrary side.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, sort/id/pair order, proximity proxy, position fold, side convention and skipped pairs; the normal is the normalized sum of the producer's probe-oriented normals, without an independent global outward guarantee.

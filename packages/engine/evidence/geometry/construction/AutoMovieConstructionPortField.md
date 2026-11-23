# src/geometry/construction/AutoMovieConstructionPortField.ts#AutoMovieConstructionPortField.periodic

## @evidence contracts/development/implementation.md#principled-implementation

The B-spline controls interpolate the values to rounding (`AutoMovieSplineCurve.interpolate`); every value is a convex combination of four controls, and on each span the first derivative is a quadratic in the span parameter, whose extremes lie at its ends or its vertex.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One interpolation, one bound pass, one reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampled bound and no clamp.

## @evidence contracts/development/common.md#meaningful-documentation

States the curve, its units and its bounds.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(m) to prepare, constant per reading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The controls serve every reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the 2m controls.

# src/geometry/construction/AutoMovieConstructionPortField.ts#AutoMovieConstructionPortField.constant

## @evidence contracts/development/implementation.md#principled-implementation

A straight rail's station or a plain ellipse's share is one number at every clock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/common.md#meaningful-documentation

States the reading.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure record coordinates no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one number.

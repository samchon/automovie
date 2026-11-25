# src/construction/IAutoMovieConstructionSplitSeam.ts#IAutoMovieConstructionSplitSeam.IPoint

## @evidence contracts/development/design.md#principled-representation

A point and its unit tangent fix a column's start and the seam's direction there.

## @evidence contracts/development/design.md#minimal-and-owned-surface

SplitBand reads the point for its loop column and the tangent for the fork's ribbon turn.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer normalizes the spline derivative or uses its chord-direction fallback; this pair does not establish regularity of the whole seam.

## @evidence contracts/development/common.md#meaningful-documentation

States units and orientation.

# src/construction/IAutoMovieConstructionSplitSeam.ts#IAutoMovieConstructionSplitSeam.ISeam

## @evidence contracts/development/design.md#principled-representation

Its ends, plane normal and arclength reading are all a band needs to place its chord columns and rule them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Ends, one normal, one length and one reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Curved length uses eight-point quadrature per span and reading uses 52 bisections; these are numerical arc-length estimates, and a zero tangent falls back to the chord direction.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and orientation.

# src/construction/IAutoMovieConstructionSplitSeam.ts#IAutoMovieConstructionSplitSeam.ICreateInput

## @evidence contracts/development/design.md#principled-representation

Physical station and ordered radian forks locate a world-millimetre chord; interior knot pairs use its orthonormal seam plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

SplitSeam.create consumes each field to construct the clamped planar cubic and its arc-length reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Knot finiteness, along-chord bounds and distinct neighbors are checked; an empty knot list is allowed and no global spline topology certificate is produced.

## @evidence contracts/development/common.md#meaningful-documentation

States coordinate interpretation, input lifetime, empty knots and refusal/throw behavior.

# src/construction/IAutoMovieConstructionSplitSeam.ts#IAutoMovieConstructionSplitSeam.IStraightInput

## @evidence contracts/development/design.md#principled-representation

A station and ordered fork phases supply the chord; normal fixes its plane without interior spline knots.

## @evidence contracts/development/design.md#minimal-and-owned-surface

SplitSeam.straight returns the same ISeam reader used by curved fan seams.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Coincident ends or an unusable projected normal return a string; callbacks and numeric source validity retain their original failure behavior.

## @evidence contracts/development/common.md#meaningful-documentation

Defines borrowed input geometry and the straight-seam refusal cases.

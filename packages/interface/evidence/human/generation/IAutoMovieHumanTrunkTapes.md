# src/human/generation/IAutoMovieHumanTrunkTapes.ts#IAutoMovieHumanTrunkTapes.PointsResult

## @evidence contracts/development/common.md#meaningful-documentation

Planar body-frame [x, z] section samples in calibration millimetres after the reliefs reaching that height have displaced their points.

## @evidence contracts/development/design.md#principled-representation

Planar body-frame [x, z] section samples in calibration millimetres after the reliefs reaching that height have displaced their points.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkTapes.PointsResult is the canonical exchange used by AutoMovieHumanTrunkTapes.points.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanTrunkTapes input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.

# src/human/generation/IAutoMovieHumanTrunkTapes.ts#IAutoMovieHumanTrunkTapes.HullPoints

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed planar [x, z] samples in calibration millimetres whose convex-hull perimeter defines the trunk tape. Point order is not a polygon-winding requirement.

## @evidence contracts/development/design.md#principled-representation

Borrowed planar [x, z] samples in calibration millimetres whose convex-hull perimeter defines the trunk tape. Point order is not a polygon-winding requirement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkTapes.HullPoints is the canonical exchange used by AutoMovieHumanTrunkTapes.hull.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanTrunkTapes input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.

# src/human/generation/IAutoMovieHumanTrunkTapes.ts#IAutoMovieHumanTrunkTapes.SolveGirth

## @evidence contracts/development/common.md#meaningful-documentation

Read the section's tape girth in millimetres at a trial half width in millimetres. The caller owns the target tape, initial guess and root solve.

## @evidence contracts/development/design.md#principled-representation

Read the section's tape girth in millimetres at a trial half width in millimetres. The caller owns the target tape, initial guess and root solve.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkTapes.SolveGirth is the canonical exchange used by AutoMovieHumanTrunkTapes.solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanTrunkTapes input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.

# src/geometry/IAutoMovieFitSubdivisionRegions.ts#IAutoMovieFitSubdivisionRegions.IProps

## @evidence contracts/development/design.md#principled-representation

Source face and vertex identities survive local crop solves; positions retain cage-local metres and indexed UVs refine globally.

## @evidence contracts/development/design.md#minimal-and-owned-surface

fitAutoMovieSubdivisionRegions owns region cropping and composition and reuses fitAutoMovieSubdivisionDomain for each supported solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer checks levels 2 through 6, nonempty disjoint regions and constraint membership; caller checks still cover measurements, intersections and poses.

## @evidence contracts/development/common.md#meaningful-documentation

Disjoint source-face fits composed on the joined subdivision domain. Source face and vertex identities survive local crop solves; positions retain cage-local metres and indexed UVs refine globally.

# src/geometry/IAutoMovieFitSubdivisionRegions.ts#IAutoMovieFitSubdivisionRegions.IResult

## @evidence contracts/development/design.md#principled-representation

Source face and vertex identities survive local crop solves; positions retain cage-local metres and indexed UVs refine globally.

## @evidence contracts/development/design.md#minimal-and-owned-surface

fitAutoMovieSubdivisionRegions owns region cropping and composition and reuses fitAutoMovieSubdivisionDomain for each supported solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer checks levels 2 through 6, nonempty disjoint regions and constraint membership; caller checks still cover measurements, intersections and poses.

## @evidence contracts/development/common.md#meaningful-documentation

Disjoint source-face fits composed on the joined subdivision domain. Source face and vertex identities survive local crop solves; positions retain cage-local metres and indexed UVs refine globally.

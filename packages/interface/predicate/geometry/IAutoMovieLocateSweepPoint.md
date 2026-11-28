# src/geometry/IAutoMovieLocateSweepPoint.ts#IAutoMovieLocateSweepPoint.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Finite model-space point and compiled direction-correspondence sweep supplied for section-plane inversion.

## @evidence contracts/development/design.md#principled-representation

The locator samples signed plane distance over the spine, bisects detected crossings and ranks candidates by absolute radial residual.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The inputs supply a live surface and one point. Root candidates and fallback decisions stay in the locator.

# src/geometry/IAutoMovieLocateSweepPoint.ts#IAutoMovieLocateSweepPoint.IProps.surface

## @evidence contracts/development/common.md#meaningful-documentation

Compiled sweep under direction correspondence, including the default when omitted. Explicit parameter correspondence is refused.

# src/geometry/IAutoMovieLocateSweepPoint.ts#IAutoMovieLocateSweepPoint.IProps.point

## @evidence contracts/development/common.md#meaningful-documentation

Finite position in the sweep's model frame in metres. Use coordinates for which plane projections and radial evaluation remain representable.

# src/geometry/IAutoMovieLocateSweepPoint.ts#IAutoMovieLocateSweepPoint.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Selected normalized spine coordinate, polar turn and signed metre radial residual.

## @evidence contracts/development/design.md#principled-representation

The locator keeps the candidate with smallest absolute radial offset and uses the nearer end plane when it detects no root.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The allocated result stores one address and diagnostic offset. Input geometry stays with the caller.

# src/geometry/IAutoMovieLocateSweepPoint.ts#IAutoMovieLocateSweepPoint.IResult.u

## @evidence contracts/development/common.md#meaningful-documentation

Selected normalized chord coordinate in [0, 1]. It can be an end-plane fallback when the sampled search detects no crossing.

# src/geometry/IAutoMovieLocateSweepPoint.ts#IAutoMovieLocateSweepPoint.IResult.v

## @evidence contracts/development/common.md#meaningful-documentation

Polar turn in [0, 1), measured from the first section axis toward the second.

# src/geometry/IAutoMovieLocateSweepPoint.ts#IAutoMovieLocateSweepPoint.IResult.offset

## @evidence contracts/development/common.md#meaningful-documentation

In-plane radial distance minus the compiled surface radius at the selected address, in metres. Positive means outside the radial profile.

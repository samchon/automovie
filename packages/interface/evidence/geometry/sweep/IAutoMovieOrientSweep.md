# src/geometry/sweep/IAutoMovieOrientSweep.ts#IAutoMovieOrientSweep

## @evidence contracts/development/common.md#meaningful-documentation

Live metre transport frames and increasing normalized station knots determine dimensionless station rotations. The fixed flag chooses an existing frame rule; station capacity and ordering must stay unchanged because rotation storage is compiled once.

## @evidence contracts/development/design.md#principled-representation

Live metre transport frames and increasing normalized station knots determine dimensionless station rotations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

orientAutoMovieSweep retains IProps while the owning rig updates transport before orientation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The fixed flag chooses an existing frame rule; station capacity and ordering must stay unchanged because rotation storage is compiled once.

# src/geometry/sweep/IAutoMovieOrientSweep.ts#IAutoMovieOrientSweep.IProps

## @evidence contracts/development/design.md#principled-representation

Normalized station knots address model-space transport frames; fixed selects carried axes while quaternion station offsets still interpolate. This kernel assumes admitted knots and rotations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

compileAutoMovieSweep and rigAutoMovieSweep use one orientation operator for rest and posed section planes, lending their existing transport and station layout.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A boolean distinguishes the two supported carriage rules; neither introduces a consumer-specific axis or skeleton layout.

## @evidence contracts/development/common.md#meaningful-documentation

States borrowed lifetime, update ordering, knot premises and the precise effect of fixed orientation.

# src/geometry/construction/AutoMovieConicArc.ts#AutoMovieConicArc.curvature

## @evidence contracts/development/implementation.md#principled-implementation

The rational quadratic's endpoint curvature is a/(2w^2 b^2), with w=r/(1-r).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One formula is shared by guide ownership and curvature corrections.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the declared extents/shoulder, without fitting or a fallback curvature.

## @evidence contracts/development/common.md#meaningful-documentation

States the geometric rather than radial curvature and inverse-length unit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A scalar formula has no effectful work to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number and retains nothing.

# src/geometry/construction/AutoMovieConicArc.ts#AutoMovieConicArc.parameter

## @evidence contracts/development/implementation.md#principled-implementation

Solves B*u^2+2w(B-A)u-A=0 for nonnegative u=t/(1-t), A=a*sin(phi), B=b*cos(phi), reflecting the smaller ratio to avoid cancellation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed form replaces an iterative ray inversion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Endpoints are their exact source identities; no interior angle or radius is clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States admitted quadrant and dimensionless result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two trigonometric reads and constant scalar arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure ray inversion schedules no effectful work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input or result state.

# src/geometry/construction/AutoMovieConicArc.ts#AutoMovieConicArc.guide

## @evidence contracts/development/implementation.md#principled-implementation

Differentiates the rational numerator/denominator twice, then applies rho_t and phi_t chain rules; normalized extents reduce unit-scale overflow.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preserves the former conic-guide API through one formula owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses no neighbour differences or sampled interpolant; unrepresentable arithmetic remains nonfinite for section admission.

## @evidence contracts/development/common.md#meaningful-documentation

States native parameter, angular offset and the radial jet meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant quotient/chain-rule arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The internal guide formula consumes the same normalized point that a ray location uses for its physical point and tangent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary fixed-size pairs and the returned guide belong to this query.

# src/geometry/construction/AutoMovieConicArc.ts#AutoMovieConicArc.radius

## @evidence contracts/development/implementation.md#principled-implementation

Reads the rational arc at its closed-form ray intersection; reflection changes only the sign of the first polar derivative.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One radius owner serves sections and their local correction bounds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No polar polynomial replaces the conic, and no aspect or specimen branch changes its shape.

## @evidence contracts/development/common.md#meaningful-documentation

States local angle and radial derivative order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant ray and native-guide work; no iteration or source sampling grid.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares native guide arithmetic instead of maintaining another conic formula.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a three-number jet and retains no query state.

# src/geometry/construction/AutoMovieConicArc.ts#AutoMovieConicArc.polar

## @evidence contracts/development/implementation.md#principled-implementation

Differentiates rho=|C| and phi=atan2(y,x) twice and divides by the positive native angular speed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One standalone conversion supports explicit native-jet inspection; production G2 rays use projective geometric readings.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A nonpositive/nonfinite angular speed produces a nonfinite jet rather than a replacement derivative.

## @evidence contracts/development/common.md#meaningful-documentation

The input is [x,y,x_t,y_t,x_tt,y_tt]; the output differentiates radius in radians.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion schedules no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns three numbers and retains no native curve.

# src/geometry/construction/AutoMovieConicArc.ts#AutoMovieConicArc.speed

## @evidence contracts/development/implementation.md#principled-implementation

Uses x_t=-2at(s+wt)/D^2 and y_t=2bs(t+ws)/D^2, avoiding a polar singular turn in arclength quadrature.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One native speed serves actual conic lengths.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Computes the declared rational curve without a sampled replacement or aspect exemption.

## @evidence contracts/development/common.md#meaningful-documentation

Extents use one length unit, r is the shoulder and t is the original unit parameter.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar arithmetic and one hypot.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure speed query schedules no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number and retains no source.

# src/geometry/construction/AutoMovieConicArc.ts#AutoMovieConicArc.locate

## @evidence contracts/development/implementation.md#principled-implementation

The cancellation-avoiding native inverse selects the nearest endpoint; positive rational velocity fixes tangent and curvature.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns the existing phase jet and the identical fixed native clock.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampled curve or clock derivative supplies source partials.

## @evidence contracts/development/common.md#meaningful-documentation

Local phi is in[0,pi/2]; invalid numerical geometry returns null.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant inverse and native geometry arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One normalized point/tangent evaluation serves the guide and physical geometry; the source reader consumes its descriptor without another ray solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only fixed-size numeric data escapes.

# src/geometry/construction/AutoMovieConicArc.ts#AutoMovieConicArc.point

## @evidence contracts/development/implementation.md#principled-implementation

Shares the stable reflected quadratic inverse and ArcField point arithmetic with locate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One value capability omits full-ray geometry after selecting the same native clock.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves physical normalization and sign/swap; does not substitute a guide coordinate or promise uncomputed derivatives.

## @evidence contracts/development/common.md#meaningful-documentation

Angles use radians and returned coordinates use source lengths; nonfinite points or invalid angles return null.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant inverse and point work, without velocity, polar2 or logarithmic curvature.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same inverse and generic point owner as the full reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One local inverse record and a fresh coordinate pair have no retained cache.

# src/geometry/construction/AutoMovieConicArc.ts#AutoMovieConicArc.value

## @evidence contracts/development/implementation.md#principled-implementation

Reads the same normalized rational point and computes hypot(point)*scale, or the exact nearest guide extent, as the full radial reader.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Separates a scalar value from unused tangent and polar derivatives.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No physical-point renormalization, sampled approximation or invalid inverse fallback changes the original value arithmetic.

## @evidence contracts/development/common.md#meaningful-documentation

Returns source length or NaN for an invalid query/value; it makes no phase-derivative availability claim.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant original inverse, rational point and norm work omit velocity and curvature work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure query retains no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only a scalar escapes the call.

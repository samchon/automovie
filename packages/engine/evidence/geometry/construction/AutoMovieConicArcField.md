# src/geometry/construction/AutoMovieConicArcField.ts#AutoMovieConicArcField.weight

## @evidence contracts/development/implementation.md#principled-implementation

Uses w=r/(1-r) in both scalar representations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation formula owns the weight map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rounding to an ellipse or shoulder clamp occurs.

## @evidence contracts/development/common.md#meaningful-documentation

The caller admits r inside (0,1).

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both numeric and differentiated preparations call this formula.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar without retained data.

# src/geometry/construction/AutoMovieConicArcField.ts#AutoMovieConicArcField.curvature

## @evidence contracts/development/implementation.md#principled-implementation

Uses a/(2*w*w*b*b) with the same multiplication order in NUMBER and AD.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The numeric public curvature delegates to this formula.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampled curvature or branch-specific substitute is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

Inputs are positive extents and an admitted shoulder.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Weight conversion is shared with point and preparation readers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar without retained data.

# src/geometry/construction/AutoMovieConicArcField.ts#AutoMovieConicArcField.norm

## @evidence contracts/development/implementation.md#principled-implementation

Only max of primal magnitudes is frozen; the normalized norm remains differentiated.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One norm kernel serves shared point and tangent algebra.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The norm itself is not replaced by its primal value; zero or nonfinite regularity remains nonfinite.

## @evidence contracts/development/common.md#meaningful-documentation

Requires a representable positive norm; no derivative at the singular origin is promised.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant operations independent of source history.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The scaled pair shares its one gauge.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains neither input.

# src/geometry/construction/AutoMovieConicArcField.ts#AutoMovieConicArcField.velocity

## @evidence contracts/development/implementation.md#principled-implementation

Differentiating the rational Bernstein point gives 2*a*t*(s+w*t)/D^2 and 2*b*s*(t+w*s)/D^2.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One velocity serves numeric arclength and source unit tangents.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No point differences or polar singular speed are used.

## @evidence contracts/development/common.md#meaningful-documentation

The first magnitude has negative Cartesian sign; t may carry source derivatives for a moving-boundary question.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both components share s,w and denominator.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns two invocation-owned scalars.

# src/geometry/construction/AutoMovieConicArcField.ts#AutoMovieConicArcField.evaluate

## @evidence contracts/development/implementation.md#principled-implementation

The positive quadratic and velocity are evaluated in normalized extent coordinates, then physical position is restored.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One kernel supplies NUMBER and AD point/direction values.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No stationary native clock division or reinterpolated scalar source is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

An algebra-valued t permits independent alignment with a moving G2 far boundary; production passes a constant selected native t.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic outside the numeric ray inverse.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Position and tangent share the same extents, weight and native parameter.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns two fixed pairs without retaining sources.

# src/geometry/construction/AutoMovieConicArcField.ts#AutoMovieConicArcField.point

## @evidence contracts/development/implementation.md#principled-implementation

Uses the identical normalized Bernstein terms and physical restoration as evaluate in either scalar algebra.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The point capability shares two private arithmetic kernels with the full geometry reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No radius/trigonometric reconstruction, endpoint substitution or invented derivative is returned.

## @evidence contracts/development/common.md#meaningful-documentation

Coordinates use source length units; the supplied native parameter may carry source derivatives.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant point arithmetic omits the velocity, norm and tangent divisions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One normalized basis supplies both coordinates; full evaluate preserves its original algebra-call order.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One fixed local basis and a fresh coordinate pair are call-owned; nothing is cached.

# src/geometry/construction/AutoMovieConicArcField.ts#AutoMovieConicArcField.orient

## @evidence contracts/development/implementation.md#principled-implementation

Reflection S swaps point coordinates and sends increasing-polar T to -S*T.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same operation acts on numeric and source derivatives.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No second reflection or selective mixed-derivative sign change is hidden.

## @evidence contracts/development/common.md#meaningful-documentation

The boolean records the existing primal branch, not a differentiated authoring coordinate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant pair operations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Position and tangent use one reflection decision.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fixed pairs and retains no branch state.

# src/geometry/construction/AutoMovieConicArcField.ts#AutoMovieConicArcField.finish

## @evidence contracts/development/implementation.md#principled-implementation

Checks point Hessians, tangent gradients and the supplied primal radial geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The raw and G2 readers share one required-output admission boundary.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unused tangent Hessians are not tested or fabricated.

## @evidence contracts/development/common.md#meaningful-documentation

The caller has already restored the original quarter chart and increasing-polar orientation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed-size finite checks and tuple copies.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The supplied primal ray is reused without another inverse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fresh output tuples retain no prepared source or operation table.

# src/geometry/construction/AutoMovieConicArcField.ts#AutoMovieConicArcField.read

## @evidence contracts/development/implementation.md#principled-implementation

Original extent/shoulder Hessians feed the shared rational kernel; the chosen native clock is constant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One raw-source read returns point2 and tangent1 for geometric lifting.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No ray inversion, source sampling or missing derivative replacement occurs.

## @evidence contracts/development/common.md#meaningful-documentation

The descriptor's reflection restores the original quarter before admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed-size AD evaluation, outside every numeric bisection.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The primal descriptor supplies radial phase jets and log curvature.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh tuples or a named failure without caching.

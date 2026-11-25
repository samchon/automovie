# src/geometry/construction/AutoMovieConicHermite.ts#AutoMovieConicHermite.create

## @evidence contracts/development/implementation.md#principled-implementation

Subdivides and endpoint-normalizes the original quadratic, degree-elevates its convex polygon and changes its inner weights by the derived curvature ratio.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Null means no curvature change; a string names failed admission rather than a fallback shape.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the exact support, far conic point/tangent/curvature and original shoulder; finite positive representability is required.

## @evidence contracts/development/common.md#meaningful-documentation

Source extents use one length unit, r is in (0,1), and shared must be positive and no greater than own curvature.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic and one cube root prepare four controls and weights.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This pure preparation schedules no effectful work; the containing quarter reuses its result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fixed-size data, null or one string; nothing is process-retained.

# src/geometry/construction/AutoMovieConicHermite.ts#AutoMovieConicHermite.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Original quadratic subdivision, degree elevation and the fixed-polygon curvature-ratio law are shared verbatim across scalar representations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The numeric adapter computes own curvature here and delegates to the shared internal end formula.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Primal admission selects a branch without claiming auxiliary min-curvature branch jets are derivatives at a tie.

## @evidence contracts/development/common.md#meaningful-documentation

Angle is a primal lookup bound; native support and rational controls retain supplied source derivatives.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-size preparation; no length, native-turn partition or cache work occurs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Prepared controls serve both numeric and differentiated fixed-clock readings.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only fixed-size scalar/tuple records or a named string escape.

# src/geometry/construction/AutoMovieConicHermite.ts#AutoMovieConicHermite.jet

## @evidence contracts/development/implementation.md#principled-implementation

Differentiates the weighted cubic Bernstein numerator/denominator twice, then restores physical deficit and height scales.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One native jet serves explicit native-parameter inspection; geometric polar and length readers avoid this potentially ill-conditioned clock.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No world-coordinate control differences or finite differences replace the derivatives.

## @evidence contracts/development/common.md#meaningful-documentation

Returns [x,y,x_t,y_t,x_tt,y_tt] in source length units per unit-parameter order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed twelve weighted basis accumulations and two quotient recurrences.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same loaded weights and basis values serve both coordinates and all derivative orders.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a six-number result escapes; fixed-size scratch is local.

# src/geometry/construction/AutoMovieConicHermite.ts#AutoMovieConicHermite.radius

## @evidence contracts/development/implementation.md#principled-implementation

Inverts the positive rational curve in log(t/(1-t)), reading normalized homogeneous monomials. Positive pair sums give the tangent and positive triple determinants give curvature; polar derivatives follow their geometric law without a singular native clock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The final projective reading owns point, ray residual, tangent and curvature; the unchanged interior conic uses its existing evaluator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No input or output clamp is used. A nonfinite or outside-support query, unbracketed ray or residual beyond the stated roundoff scale remains nonfinite.

## @evidence contracts/development/common.md#meaningful-documentation

Local angles are radians; the log bracket derives from binary64's finite exponent span and admitted weights. The residual floor scales with logarithmic arithmetic, not an empirical shape allowance.

## @evidence contracts/development/implementation.md#efficient-algorithms

An interior query uses two bracket point readings, at most64 bisection point readings and one final projective point, at most67 readings in total; an endpoint uses one. Final geometry uses at most six tangent pairs and four curvature triples; midpoint exhaustion terminates earlier.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The final normalized homogeneous logs serve point, tangent and curvature without another inverse or curvature solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps only the local scalar bracket and final fixed-size jet.

# src/geometry/construction/AutoMovieConicHermite.ts#AutoMovieConicHermite.locate

## @evidence contracts/development/implementation.md#principled-implementation

The unchanged bounded log-odds inverse uses the shared NUMBER projective point; positive geometry supplies phase jets and log curvature.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Source readers consume the final clock or endpoint position without another inverse.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A null clock is never interpreted as an interior parameter; outside, unbracketed or unresolved rays remain null.

## @evidence contracts/development/common.md#meaningful-documentation

The descriptor uses the selected end chart; the quarter owner applies reflection once.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two bracket point readings and at most64 numeric-only bisection point readings precede one final projective reading, at most67 in total; endpoints read once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Final projective probabilities serve tangent and positive curvature triples.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned numeric record holds no source, algebra table or cache.

# src/geometry/construction/AutoMovieConicHermite.ts#AutoMovieConicHermite.point

## @evidence contracts/development/implementation.md#principled-implementation

Shares the endpoint identities, log-odds bracket, bisections and final residual with locate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Only the final tangent/curvature conversion is omitted by the value capability.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No iteration, floor, weight normalization, reflection or point arithmetic changes; uncomputed phase jets are not promised.

## @evidence contracts/development/common.md#meaningful-documentation

Returns fresh physical end-chart coordinates or null on invalid angle, unresolved inverse or nonfinite point.

## @evidence contracts/development/implementation.md#efficient-algorithms

The same at most67 projective readings omit the final six tangent pairs and four curvature triples.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The exact inverse and final projective point are shared with the full reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local bracket/reading records die after the fresh pair is returned; no query cache.

# src/geometry/construction/AutoMovieConicHermite.ts#AutoMovieConicHermite.value

## @evidence contracts/development/implementation.md#principled-implementation

Uses locateReading's unchanged endpoint identities, log-odds inverse and residual, then the same first-end extent or point norm as HermiteField.ray.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A scalar capability omits tangent and logarithmic curvature conversion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not alter inverse iterations, projective point arithmetic or source admission, and promises no uncomputed derivative.

## @evidence contracts/development/common.md#meaningful-documentation

Returns source length or NaN when the inverse/value is unavailable.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preserves the bounded inverse while omitting the final derivative geometry.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One query owns its inverse without a cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar and retains no query data.

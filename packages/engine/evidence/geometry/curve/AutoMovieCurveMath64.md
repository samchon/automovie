# src/geometry/curve/AutoMovieCurveMath64.ts#AutoMovieCurveMath64.clone

## @evidence contracts/development/implementation.md#principled-implementation

Copies the first three components in their original order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The returned mutable triple separates generated coefficient ownership from the input.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No normalization, coordinate conversion or rounding is applied.

## @evidence contracts/development/common.md#meaningful-documentation

The caller supplies three components in one declared chart.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three scalar copies have no algorithm choice.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The current three components are copied without retaining a prior input/result pair.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a fresh three-number tuple transfers to the caller.

# src/geometry/curve/AutoMovieCurveMath64.ts#AutoMovieCurveMath64.add

## @evidence contracts/development/implementation.md#principled-implementation

Each result coordinate is the corresponding binary64 sum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One componentwise addition is shared by cubic handle construction and subdivision.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Operands retain their order and no small-value snapping occurs.

## @evidence contracts/development/common.md#meaningful-documentation

Both operands must express compatible quantities in the same chart.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three additions have fixed cost and no traversal strategy.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Current operands determine the sum; no cross-call state is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The new tuple aliases neither input array.

# src/geometry/curve/AutoMovieCurveMath64.ts#AutoMovieCurveMath64.sub

## @evidence contracts/development/implementation.md#principled-implementation

Each result coordinate subtracts the second operand from the first.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A separate difference operation preserves displacement orientation at call sites.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Subtraction is not replaced with distance normalization.

## @evidence contracts/development/common.md#meaningful-documentation

The argument order defines the displacement or derivative difference.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three subtractions have fixed cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

No coordinate-dependent displacement is cached across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the three scalar differences are returned.

# src/geometry/curve/AutoMovieCurveMath64.ts#AutoMovieCurveMath64.scale

## @evidence contracts/development/implementation.md#principled-implementation

Every coordinate is multiplied by the same supplied scalar.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Uniform scaling remains distinct from coordinate-frame transport.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Zero, negative and fractional factors use the same multiplication rule.

## @evidence contracts/development/common.md#meaningful-documentation

The factor multiplies the enclosing quantity units.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three multiplications have no algorithm choice.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Scaling depends on the current vector and factor without retained results.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned triple does not retain the supplied array.

# src/geometry/curve/AutoMovieCurveMath64.ts#AutoMovieCurveMath64.mix

## @evidence contracts/development/implementation.md#principled-implementation

Computes a+(b-a)t with the explicit subtract-scale-add operation order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Subdivision callers choose this affine path explicitly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The parameter is not clamped and no alternate weighted-sum rounding path is substituted.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation identifies the exact binary64 blend order.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A fixed number of three-component operations is used.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

No interpolation result is shared across unrelated parameters.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Intermediate triples are local and only the resulting triple escapes.

# src/geometry/curve/AutoMovieCurveMath64.ts#AutoMovieCurveMath64.hermite

## @evidence contracts/development/implementation.md#principled-implementation

Handle coefficients are a+da*dy/3 and b-db*dy/3, with copied endpoints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One endpoint/derivative conversion feeds cubic coefficient consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Derivatives keep their complete chart scale; unit tangents are not substituted.

## @evidence contracts/development/common.md#meaningful-documentation

The width and derivative units multiply to the endpoint-value units.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Four output controls require fixed work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Endpoint data are consumed once to construct the reusable cubic net.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Endpoint and handle tuples are newly owned by the returned span.

# src/geometry/curve/AutoMovieCurveMath64.ts#AutoMovieCurveMath64.toHermite

## @evidence contracts/development/implementation.md#principled-implementation

Cubic endpoint derivatives are 3(B1-B0)/dy and 3(B3-B2)/dy. Positive finite dy selects the same chart convention as hermite; no fit, normalization or degree reduction supplies missing information.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One endpoint record is the inverse input of hermite. It reuses the existing derivative evaluator before finite endpoint-specific quotient orders; the existing evaluator keeps its original arithmetic and admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exactly four finite three-component controls are required. A quartic is not truncated and zero derivatives remain zero rather than becoming invented unit tangents.

## @evidence contracts/development/common.md#meaningful-documentation

States derivative units, width admission, fresh ownership, finite arithmetic failures and the absence of bitwise or higher-degree equivalence claims.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two endpoint differences and four fixed three-component outputs cost O(1) work and storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Existing cubic derivative evaluation supplies the ordinary endpoint result. Only unresolved components try equivalent finite quotient orders, without parameter sampling or fitting.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Four new vectors belong to the returned record, including when input endpoints alias; source arrays and cross-call state are not retained.

# src/geometry/curve/AutoMovieCurveMath64.ts#AutoMovieCurveMath64.cubic

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the four cubic Bernstein basis terms in the retained arithmetic order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

All three coordinates use the same scalar parameter and coefficient order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

It neither resamples inputs nor changes to a different polynomial evaluation path.

## @evidence contracts/development/common.md#meaningful-documentation

The caller owns the finite four-control premise and parameter domain.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Four terms per coordinate give fixed degree-three work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One supplied span is evaluated without a cross-parameter cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A new result tuple is returned and no source net is retained.

# src/geometry/curve/AutoMovieCurveMath64.ts#AutoMovieCurveMath64.derivative

## @evidence contracts/development/implementation.md#principled-implementation

Differentiates the cubic Bernstein terms and divides by the supplied chart width.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The physical-width scale stays with derivative evaluation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A derivative is not normalized to a unit direction.

## @evidence contracts/development/common.md#meaningful-documentation

The nonzero-width premise and derivative-per-chart-unit result are explicit.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three derivative terms per coordinate take fixed work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The derivative reads existing controls rather than reconstructing their generating field.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the derivative tuple escapes; input controls remain caller-owned.

# src/geometry/curve/AutoMovieCurveMath64.ts#AutoMovieCurveMath64.split

## @evidence contracts/development/implementation.md#principled-implementation

Three De Casteljau levels yield both exact polynomial restrictions before binary64 rounding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One split returns the left and right coefficient nets together.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The affine flag preserves the caller-selected blend order instead of silently changing rounding.

## @evidence contracts/development/common.md#meaningful-documentation

The split parameter and coefficient units remain in the original chart.

## @evidence contracts/development/implementation.md#efficient-algorithms

Degree three fixes the number of blends and output coefficients.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Intermediate levels are shared between both children.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Both returned child nets own copied endpoint tuples and local subdivision results.

# src/geometry/curve/AutoMovieCurveMath64.ts#AutoMovieCurveMath64.partition

## @evidence contracts/development/implementation.md#principled-implementation

Consecutive width fractions split the remaining cubic in order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Partitioning delegates every restriction to the same split operation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Widths are not normalized into a different partition or replaced with equal spans.

## @evidence contracts/development/common.md#meaningful-documentation

Positive finite caller-owned widths describe relative chart durations.

## @evidence contracts/development/implementation.md#efficient-algorithms

For K widths the fixed-degree split is repeated K-1 times, O(K).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each split carries its remaining right child forward rather than restarting from the original span.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned pieces own their controls and temporary remaining nets expire.

# src/geometry/curve/AutoMovieCurveMath64.ts#AutoMovieCurveMath64.angular

## @evidence contracts/development/implementation.md#principled-implementation

Adds one wrapped neighbor at each end and resolves periodic component slopes over cumulative widths.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Periodic coefficient ordering is an adapter around the shared scalar slope owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The one-third derivative scale remains explicit rather than normalized away.

## @evidence contracts/development/common.md#meaningful-documentation

Widths define the periodic chart and returned handles are one-third angular derivatives.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N supports, three linear slope solves and wrapped arrays give O(N) work/storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Wrapped station coordinates are reused for all three component solves.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only new handle triples escape; wrapped coordinates and component columns expire.

# src/geometry/curve/AutoMovieCurveMath64.ts#AutoMovieCurveMath64.spans

## @evidence contracts/development/implementation.md#principled-implementation

Outgoing and next incoming handle offsets are scaled by the same interval width.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The periodic next-node rule constructs one cubic per support pair.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No refit or sampled waypoint conversion changes the supplied support/handle field.

## @evidence contracts/development/common.md#meaningful-documentation

Corresponding support, handle and positive-width layouts are caller premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

One four-control output per support gives O(N) construction.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller-supplied support and derivative fields directly determine every span.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Endpoints are cloned and new handle triples belong to the returned spans.

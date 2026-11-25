# src/geometry/construction/prepareAutoMovieSolidExactRailBoundary.ts#prepareAutoMovieSolidExactRailBoundary

## @evidence contracts/development/implementation.md#principled-implementation

Each chart span comes from the periodic cubic's endpoint values and derivatives. Its vertical extrema partition half-open ray crossings. Independent endpoint and horizontal-span checks include the curve itself. The squared-distance derivative supplies every nearest-foot candidate on a span. Both adjacent surfaces read the resulting clock on the same prepared rail.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One span preparation supplies point-side classification and the nearest-clock query. The existing spline, period lift and polynomial root readers supply the corresponding arithmetic.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Classification and correspondence use the original cubic's spans and their extrema. The chart-metric foot initializes the receiver at the common boundary. The atlas evaluates its own world-space residual on the receiving face before accepting the step.

## @evidence contracts/development/common.md#meaningful-documentation

The declaration states the lifted periodic chart, signed side result and adjacent surface ownership. The binary64 rounding convention and the existing root owner's unit-interval bisection depth are recorded with their implementation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation is linear in the number of cubic spans. Each query rejects spans by prepared bounds. Parity bisects only selected vertical crossings, with at most 60 halvings per monotone interval. Nearest-foot searches solve bounded-degree polynomials only on spans whose bounding boxes can improve the current distance.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both returned queries share one prepared list of cubic coefficients, extrema, interval boundaries and bounds. Each level query visits only the prepared monotone intervals of its selected span.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned closure owns a linear immutable span array and scalar chart normalization data. Query scratch arrays contain at most the degree-five distance derivative and its bounded candidates.

# src/geometry/construction/AutoMovieConstructionWidths.ts#AutoMovieConstructionWidths.traced

## @evidence contracts/development/implementation.md#principled-implementation

The closed width union marks fold and curvature as requiring surface data along the traced contact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One discriminator predicate lets realization decide whether preliminary tracing is required.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Tests only the width kind, not its numerical validity or eventual join success.

## @evidence contracts/development/common.md#meaningful-documentation

Lists the two true kinds and the query's role.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two literal comparisons take constant time without allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This kind predicate coordinates no trace or law cache itself.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returning a boolean retains no width record or resource.

# src/geometry/construction/AutoMovieConstructionWidths.ts#AutoMovieConstructionWidths.create

## @evidence contracts/development/implementation.md#principled-implementation

Converts authored metre lengths to kernel mm and prepares the selected constant, periodic chord, fold-angle or curvature law; the curvature law bounds the chord by the tighter of the surface's normal-curvature radius across the curve and, on a square-offset side, the curve's geodesic radius toward the rail (offset regularity, Farouki and Neff 1990; the curvature vector from the trace's exact implicit second derivative, Ye and Maekawa 1999). Traced values are uniformly parameterized over one turn by the trace producer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared law dispatch handles both sides, with a distinct part-station representation only when the curve uses part phase.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Applies declared caps and end-distance floor at sampled curvature knots, then uses a non-shape-preserving periodic interpolant; between-knot positivity/cap bounds are not enforced, and positive comparisons alone do not independently reject infinite lengths.

## @evidence contracts/development/common.md#meaningful-documentation

Gives each law, station restriction, mm conversion, sample/interpolation boundary and constant-callback mutation premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant/station preparation is O(1); a table or traced law uses O(N) fixed-filter preparation and coefficient storage, with two surface jets per fold knot, one per curvature knot plus two more on a square-offset side, and constant later evaluation cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both sides share the supplied trace, while fold-normal preparation is repeated independently per side; each resulting periodic coefficient array is reused across later rail/column requests.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned periodic closures own O(N) coefficients/start/count for the join's lifetime; chord closures borrow their input record/scale, and local sampled values/context are released after preparation.

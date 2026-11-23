# src/geometry/sweep/transportAutoMovieSweepSpine.ts#transportAutoMovieSweepSpine

## @evidence contracts/development/implementation.md#principled-implementation

The centripetal Catmull-Rom spline interpolates the points without cusps or self-intersections within a segment, and double reflection is a published fourth-order rotation-minimizing frame integrator using only arithmetic and square roots, so it reproduces bit for bit across JavaScript engines.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One spine implementation: `frameAutoMovieSweepSpine` wraps it in objects, and posed sweeps rewrite its arrays every frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A vanishing tangent or a normal along the tangent is refused instead of replaced by an arbitrary axis.

## @evidence contracts/development/common.md#meaningful-documentation

States the spline and its tangents, the end-tangent rule, the parameterization, the transport and its source, the table density and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

For n points: `update` is O(n) for the curve plus 64 (n - 1) reflections for the table; a point or tangent query is O(n) to find its segment and a frame query adds one reflection; nothing allocates after creation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The segment coefficients and frame table are computed once per `update` and serve every query until the next.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains 3 n input numbers, n knots, 12 (n - 1) coefficients and, with frames, 9 (64 (n - 1) + 1) table numbers, all sized at creation and released with the transport.

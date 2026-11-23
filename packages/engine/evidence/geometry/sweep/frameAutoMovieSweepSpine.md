# src/geometry/sweep/frameAutoMovieSweepSpine.ts#frameAutoMovieSweepSpine

## @evidence contracts/development/implementation.md#principled-implementation

The centripetal Catmull-Rom spline interpolates the points without cusps or self-intersections within a segment, and double reflection is a published fourth-order rotation-minimizing frame integrator; the frame between table entries is one more double reflection, so queries are consistent with the table.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The object-returning face of `transportAutoMovieSweepSpine`, which owns the spline and the transport, through `loadAutoMovieSweepSpine` and `pathAutoMovieSweepTransport`; callers that query a few points use this, posed sweeps rewrite the transport's arrays directly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A vanishing tangent or a normal along the tangent is refused instead of replaced by an arbitrary axis.

## @evidence contracts/development/common.md#meaningful-documentation

States interpolation, the tangent's difference step, the transport method and its source, the table density, and each refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

For n points: O(n) chord lengths, a transport table of 64 (n - 1) + 1 frames built in one pass, and O(n) per query to find the segment plus one reflection step; each query allocates only its returned vectors.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The table is the reuse; a sweep compiles its spine once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned closures retain the transport's arrays, O(64 n) numbers, and a twelve-number scratch, released with the path.

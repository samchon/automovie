# src/geometry/sweep/compileAutoMovieSweepFeature.ts#compileAutoMovieSweepFeature

## @evidence contracts/development/implementation.md#principled-implementation

A pass-through constraint along a smooth curve: the centripetal Catmull-Rom curve, which has no cusp or self-intersection within a segment, with values on the same knot parameter, a dense-seeded Newton search for a nearby course point, and a compactly supported C2 falloff in a local cylindrical metric. The metric approximates arc distance off a circle, and the local search does not guarantee a global minimum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The curve, its values and its seed samples are built once; a query is a reject on the band's `u` range, a seed scan and a short refinement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The curve passes through every declared point and value; only a point repeating its predecessor, which adds no shape, is dropped.

## @evidence contracts/development/common.md#meaningful-documentation

States the curve and its knots and source, the dropped repeats, its values, the approximate metric, the local search and its limits, the residual and the falloff.

## @evidence contracts/development/implementation.md#efficient-algorithms

For n points: O(n log n) seed construction plus the value spline's O(n) work per tension trial. A displacement query outside the band's `u` range is O(1), otherwise O(16 n) for the necessary nearest-seed scan plus four O(log n) Newton steps, without allocating in the displacement evaluator itself; the supplied guided-radius query owns any cache misses. A course point uses two O(log n) segment searches and allocates one domain record.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The curve coefficients, seed samples and value spline are built once per sweep compile.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains O(16 n) seed samples, 6 n coordinates and coefficients, and the value spline, released with the sweep.

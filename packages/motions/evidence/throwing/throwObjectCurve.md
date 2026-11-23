# src/throwing/throwObjectCurve.ts#throwObjectCurve

## @evidence contracts/development/common.md#meaningful-documentation

States fixed endpoint/tangent frames, metre/second units, duration and dimensionless query time.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the original AutoMovieStationHermite combine and weight equations, with physical velocities scaled by the same segment duration; fixed endpoint/tangent arrays are independent of query time.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One endpoint conversion precedes the existing Hermite owner's actual per-time weight and combination.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No polynomial regrouping, duration clamp, endpoint or velocity change; the same coordinate combination produces every point.

## @evidence contracts/development/implementation.md#efficient-algorithms

Endpoint and tangent arrays are built once per segment instead of each frame; each query retains the original constant three-coordinate Hermite work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The throwing plan owns one builder for its acceleration and one for its follow-through, each with fixed endpoints, tangents and duration; varying normalized times compute their own points.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each builder retains two three-coordinate endpoint/tangent records and one duration until the plan is released, with no time samples, fitted results or external handles.

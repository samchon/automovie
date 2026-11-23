# src/architecture/pointOnSegment.ts#pointOnSegment

## @evidence contracts/development/implementation.md#principled-implementation

Combines the shared approximate orientation classification with an epsilon-expanded box. The exact-arithmetic collinearity/box theorem motivates the test; its fixed tolerances do not certify every rounded vertex or arbitrary-scale input.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One definition of "on an edge" for `pointInPolygon` and `segmentsTouch`, which previously kept separate copies of it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No coordinate or caller is special-cased; the slack is the shared `PLANAR_EPSILON` constant.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the two conditions, the box slack, the zero-length case, and each parameter's frame.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant time, one orientation test and four comparisons, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure point-on-segment predicate that each polygon test calls per edge; nothing is coordinated across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Reads one point and one segment and allocates nothing, so nothing outlives the call.

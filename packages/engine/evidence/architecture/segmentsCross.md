# src/architecture/segmentsCross.ts#segmentsCross

## @evidence contracts/development/implementation.md#principled-implementation

Uses four `planarSide` classifications and requires opposite nonzero sides for each segment. The proper-intersection theorem holds in ideal arithmetic; this implementation inherits the shared tolerance and finite-intermediate premises rather than providing an exact robust predicate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One proper-crossing test for `polygonInside` and `segmentsTouch`, replacing the copies each polygon predicate carried.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No configuration is special-cased; contact cases are excluded by the orientation signs alone, not by caller-specific checks.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states what counts as a crossing, which contacts do not, where to ask about contact instead, and each parameter's role.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant time, four orientation tests, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure predicate over four points; it coordinates no work across requests or consumers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Reads four points and allocates nothing, so no state, handle or task outlives the call.

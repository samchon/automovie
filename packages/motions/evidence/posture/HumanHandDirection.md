# src/posture/HumanHandDirection.ts#HumanHandDirection

## @evidence contracts/development/common.md#meaningful-documentation

States each input, the result's frame and the four refusals.

## @evidence contracts/development/implementation.md#principled-implementation

An axis is an exact unit vector with one component +1 or -1 and the rest zero, so its normalization would multiply every component by exactly one. Between/explicit vectors keep their original normalization and all rungs are turned by the actual heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A private axis switch takes the current side sign without a per-call closure; one branch per rung then turns the actual normalized direction by the heading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Opposite axes, a share outside [0, 1], zero components and an empty source each throw instead of yielding an arbitrary direction.

## @evidence contracts/development/implementation.md#efficient-algorithms

Named axes omit the provably redundant magnitude classification, square root and normalized-vector allocation. Between/explicit directions retain every original test and normalization; all paths still construct a fresh actual world vector, with no measured speedup claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Every current side, heading and direction is evaluated independently; the private axis and HumanFrame owners share code only, retaining no completed numeric work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/posture/HumanHandDirection.ts#HumanHandDirection.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States fixed side, current degree heading/name inputs, lazy axis/transform preparation, fresh output and unchanged cold fallback for malformed names.

## @evidence contracts/development/implementation.md#principled-implementation

Each closed named axis is the same exact unit vector as of, turned by the same HumanFrame.point scalar grouping. HumanFrame.prepare owns fixed transform coefficients, guarded with Object.is on the actual current yaw so signed zero remains distinct.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bounded lazy axis map and one last-yaw frame precede the original point transform; armPhrase's out/up/forward reads share this producer without moving any live offset or entry-heading access.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The raw of path remains live and unchanged. Invalid names delegate that same path rather than inventing a direction; every output is fresh, all current headings are observed and no world vector, target, pose or sampled result is cached.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most six local axis records and one current-heading coefficient preparation serve Q actual reads; unchanged headings avoid repeated trigonometry while every axis-specific scalar transform and fresh world vector remains. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed side/name defines each private unit axis; the last exact current yaw alone establishes reusable trigonometric prerequisites. Changed yaw rebuilds its frame, with no fixed-entry or immutable-input premise added to the caller's borrowed posture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owning arm/action retains at most six private unit axes and one copied zero-origin transform with its numeric yaw until release. It retains no posture, source object, current output, target, callback loan or growing history.

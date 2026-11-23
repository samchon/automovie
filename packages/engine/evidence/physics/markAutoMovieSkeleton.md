# src/physics/markAutoMovieSkeleton.ts#markAutoMovieSkeleton

## @evidence contracts/development/common.md#meaningful-documentation

States what is drawn and from which data, the kinds, labels, colours, paths and frame of both mark kinds, the refusal, and shows the call.

## @evidence contracts/development/implementation.md#principled-implementation

A profile joint connects a parent segment to a child segment, so its bone is the line between the two segments' cached world positions, and each segment's position is where its joint sits; nothing is inferred from a rig's bone names.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over each body's joints, one over its segments.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing segment is refused instead of drawn at the origin, and no body or bone is treated specially; the two colours are a drawing convention chosen apart from every other kind's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the joints and segments of the bodies.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one instant.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh marks and keeps nothing.

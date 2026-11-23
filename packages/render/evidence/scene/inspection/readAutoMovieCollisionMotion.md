# src/scene/inspection/readAutoMovieCollisionMotion.ts#readAutoMovieCollisionMotion

## @evidence contracts/development/common.md#meaningful-documentation

Names the features and the thickness of each geometry kind.

## @evidence contracts/development/implementation.md#principled-implementation

Composes the collider pose with the shape transform and reads the Engine's world bounds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One feature list per geometry kind.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A part without geometry has no pose to compare.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most eight points except a hull's own points.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per part per placed instant by the caller.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain data.

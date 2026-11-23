# src/scene/inspection/createAutoMovieCollisionFinding.ts#createAutoMovieCollisionFinding

## @evidence contracts/development/common.md#meaningful-documentation

States the category and confidence mapping and the depth measurement.

## @evidence contracts/development/implementation.md#principled-implementation

Ranks by penetration depth and records the separation against the negative allowance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One constructor for frame and motion findings.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A bounds-only candidate carries no invented point or depth.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain data only.

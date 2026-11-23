# src/geometry/sweep/bufferAutoMovieBones.ts#bufferAutoMovieBones

## @evidence contracts/development/implementation.md#principled-implementation

The same rigid motion `createAutoMovieBoneMotion` builds, computed into arrays.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Name resolution once at creation, index access per pose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A posed list out of step with the rest list is refused; it is not reordered.

## @evidence contracts/development/common.md#meaningful-documentation

States the transform and its source.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B) to index B bones; `update` is O(B) and each point or direction constant time, none allocating.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each bone's rotation is computed once per pose and shared by every point and direction riding it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains 10 B numbers and the name index, released with the buffer.

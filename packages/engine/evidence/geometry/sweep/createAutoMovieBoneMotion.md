# src/geometry/sweep/createAutoMovieBoneMotion.ts#createAutoMovieBoneMotion

## @evidence contracts/development/implementation.md#principled-implementation

The rigid motion of a frame from rest to pose, the same per-joint transform linear and dual-quaternion skinning blend, applied unblended because sweep bindings follow one bone at a time.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup shared by the sweep and network posers, so points, directions and station orientations all use the same transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A bone missing from either list is refused instead of treated as unmoved.

## @evidence contracts/development/common.md#meaningful-documentation

States the transform, its frames, what the lookup returns and when it fails.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B) to index B bones once, then constant time per bone lookup and per mapped point.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each bone's relative rotation is computed once on first use and cached for every later point of that bone.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains the two bone maps and at most one cached rotation per bone, released with the closure.

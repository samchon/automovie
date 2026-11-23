# src/film/animatedBaseAt.ts#animatedBaseAt

## @evidence contracts/development/implementation.md#principled-implementation

World position is `base + R·root(t)`, the composition of the staged transform with the clip's node-local root translation, sampled by `sampleMotion` so it matches what the renderer draws; it relies on staging's unit-scale actor transform, which the documentation of `performShot` states.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One root-in-world rule shared by the launch lead and the framing follow, so a projectile aims where the camera sees the target.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every node and clip is composed the same way; a pose without a root holds the base by the stated rule rather than by a special case for static props.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, both consumers, the node-local convention, the missing-root behaviour, how the clip is sampled, and the units of input and output.

## @evidence contracts/development/implementation.md#efficient-algorithms

Building the function takes constant local work; each query selects a motion segment in O(log K) for K keys, interpolates only its root, then applies one rotation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Samples on demand per instant; the launch solve and the camera compile ask for distinct instants, so there is no repeated work to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned function retains `base`, `facing` and `motion` by reference for as long as its caller keeps it, which is the launch solve or the framed subject of one `performShot` call.

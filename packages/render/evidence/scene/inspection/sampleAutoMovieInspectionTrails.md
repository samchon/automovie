# src/index.ts#sampleAutoMovieInspectionTrails

## @evidence contracts/development/common.md#meaningful-documentation

States which objects are sampled and how shared paths resolve, what is read at each second, the order, the state the scene is left in, the awaited seek, the stationary rule and its tolerance, and the refusals, and shows the sample, seek and draw order.

## @evidence contracts/development/implementation.md#principled-implementation

An object's travel is its origin's world position over time, read after the subject's seek has resolved and three.js has brought world matrices up to date, so the subject only seeks and the sampler needs to know nothing of what moves it or when it is ready.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the objects once, then one seek and one read per second.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tolerance is a stated micrometre, below any visible motion, not a value tuned to a case, and an empty match is refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scene traversal to resolve paths, then per second one seek, one world-matrix pass and one read per object.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call samples the subject as it moves now.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain numbers; the scene and the seek are borrowed.

# src/film/cameraFrameEntryMoves.ts#cameraFrameEntryMoves

## @evidence contracts/development/common.md#meaningful-documentation

The comment states which moves are keyed at delivery frames, the follow case that depends on an animated subject, why `static` and `whip` need no rate, and what the result means.

## @evidence contracts/development/implementation.md#principled-implementation

It reads the same branches `compileCameraMove` keys: push-in, orbit and truck enumerate `frameKeyTimes` over their span, a follow does so only when its subject has an `at` sampler, and static and whip write keys at authored instants alone. So the predicate is true exactly when compiling the entry reads the delivery rate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One predicate owned beside the compiler it describes, so `compileCameraMove`, which throws, and `compilePerformShotCameras`, which reports a violation, refuse the same entries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No move is treated as static to avoid a refusal; an unknown move is not moving here and is refused by the compiler's own grammar check.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time per entry.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one entry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It allocates and retains nothing.

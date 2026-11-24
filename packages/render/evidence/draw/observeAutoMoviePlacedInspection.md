# src/draw/observeAutoMoviePlacedInspection.ts#observeAutoMoviePlacedInspection

## @evidence contracts/development/common.md#meaningful-documentation

Names the required placement, projection, optional audit context, when the synchronous placement is offered and the return clock.

## @evidence contracts/development/implementation.md#principled-implementation

Refreshes current world transforms and the canonical delivery projection before reading the already placed scene. An output index is attached only when its scheduled second exactly equals the placed second. The subject's synchronous `place` is offered only for a `seek` placement: a shot placed by `seekShot` lies on a clock `place` cannot reach, and a check re-placing the drawn second through it would leave the live entry where the shown shot was.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check the provider, prepare its placed inputs, call it once and verify its clock.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No second seek, review camera, mask, overlay or rounded frame index supplies evidence.

## @evidence contracts/development/implementation.md#efficient-algorithms

One world matrix update and one producer call for an opted-in subject. Ordinary subjects return immediately.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The producer reads the one scene and camera already placed by the current draw.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the subject and optional renderer for the call and retains only the returned data.

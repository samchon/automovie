# src/sport/bakePrecisionDeck.ts#bakePrecisionDeck

## @evidence contracts/development/common.md#meaningful-documentation

Defines the input geometry, independently authored release state, optional result and playback clock.

## @evidence contracts/development/implementation.md#principled-implementation

The surface remains kinematic; ball and targets are native dynamic bodies. A sampled pair with declared dynamic ownership supplies the ball's initial velocity at release. A positive solved impulse qualifies a ball-to-target result.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Profile placement and motion inputs are built once. AutoMoviePhysicalSimulation owns physical admission, simulation, and replay; each sport credits its result from the cache.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No synthetic target displacement, alternative launch path or precomputed outcome. A miss has no ball-to-target impulse witness.

## @evidence contracts/development/implementation.md#efficient-algorithms

Stores two input poses for the ball, one for a resting or fixed body. Then scans the completed receipts and their candidate positive samples once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same snapshot, named bodies and physical receipts for all frame reads and the contact outcome.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns only the completed cache and one small film-time event. The native world releases in its owning compute call.

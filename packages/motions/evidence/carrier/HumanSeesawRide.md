# src/carrier/HumanSeesawRide.ts#HumanSeesawRide

## @evidence contracts/development/common.md#meaningful-documentation

States the ride it wraps, the reach rule and the plant.

## @evidence contracts/development/implementation.md#principled-implementation

The scene's seat height against the entry's hanging soles decides each low interval; the feet bear on the world while it lasts and are placed and lifted outside it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan the seated ride, find the low intervals once, then place the feet per sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The beam's angle is never authored here. The placing time is a named provisional staging value.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass at `STEP` over the duration; each sample scans the few low intervals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the seated ride's seat and grip fit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the low intervals and the ride plan for the action.

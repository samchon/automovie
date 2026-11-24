# src/audit/HumanSignatureGait.ts#HumanSignatureGait

## @evidence contracts/development/common.md#meaningful-documentation

States the duty factor, the footfall rule and the cadence's unit, over the window and the sampling rate given.

## @evidence contracts/development/implementation.md#principled-implementation

The duty factor is the share of samples each foot bears (`HumanSignature.bears`) over both feet; a footfall is a foot's change from free to bearing, counted once a stride (`HumanSignature.STRIDE`) so a heel handing the load to the ball is one footfall; the cadence is steps a minute from the mean interval between footfalls, which a short window would quantise if footfalls were counted.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Moved from `HumanSignature.gait`, which keeps the public reading and its default rate and delegates here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The stride and the bearing test are the signature's own documented readings.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two bearing readings per sample of the window, one per foot, and a sort of the footfalls.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each window is read on its own instants (`HumanSignature.times`).

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new gait and retains nothing.

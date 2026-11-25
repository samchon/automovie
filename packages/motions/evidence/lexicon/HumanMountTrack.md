# src/lexicon/HumanMountTrack.ts#HumanMountTrack

## @evidence contracts/development/common.md#meaningful-documentation

States what is turned, what is kept and why the reading needs it.

## @evidence contracts/development/implementation.md#principled-implementation

An ankle with an immobile axial axis meets a foot rotation only at the swivel whose bend plane holds its flexion axis (Tolani, Goswami and Badler 2000, section 3.2.4); the turn of the pole that brings the twist to nil is the root of a function near linear in that turn, taken by one secant step from two readings.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two readings, one secant step.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The step is exact for a linear twist; the residual of the near-linear reading is not corrected further, and is stated here.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `HumanMountPush.twist`, the one reading of the turn.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

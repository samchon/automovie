# src/actions/walkStation.ts#walkStation

## @evidence contracts/development/common.md#meaningful-documentation

States the law and its sources, what it does not do and how the way is finished, how the point and the plan are read.

## @evidence contracts/development/implementation.md#principled-implementation

The cited first-order law is integrated exactly over each `TICK` for a speed held constant in it; the travelled length is turned into the plan's second through the plan's own way, and `walkPaced` plays the plan on that clock. Speed is continuous where the plan's own clock takes over because that clock starts at the rate the speed has there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the point's speeds, read the plan's way, integrate the two phases into one clock, hand it to `walkPaced`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `GAIN` is the cited fit; `FASTEST`, `STEP`, `TICK`, `SAMPLES` and `CRUISE` are named and provisional. The speed bound is the gait's, not a clamp of what was asked: the walker then arrives late, as stated. A clock that runs out of entries is refused, never jumped to the plan's end.

## @evidence contracts/development/implementation.md#efficient-algorithms

One reading of the point every `STEP` seconds and `SAMPLES` horizontal path reads, once per plan; each clock tick costs one logarithmic way search. Plans without a horizontal projection still share one FK workspace for their root-only reads.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The plan's root-distance samples share only an FK workspace, which changes no posture; every sample and timing step is computed, without a pose-result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The construction releases its FK workspace and temporary speed/distance samples on return or throw; walkPaced holds only the plan and the numeric clock until released, without a queried-pose history.

# src/exercise/exercise.ts#exercise.drop

## @evidence contracts/development/common.md#meaningful-documentation

States the geometry and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The standing leg's length less the hip's height over the ankle with the thigh at its angle and the shank leaning at most `SHANK`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two angles and one difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The shank's lean is clamped at the named limit, so the hips move back rather than the ankle overflexing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/exercise/exercise.ts#exercise.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

One repetition clock; per repetition a crouch, a step, a lift or a jump over its four spans.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Clock, then one branch per kind.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Lengths are shares of the measure; provisional values are named.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed native repetition envelopes prepare their interval names once while all original repetition reductions and custom callback calls remain, including NaN propagation. Fixed jack endpoints share native interpolation metadata; current high-knee targets and borrowed entry observations remain per query. Root rows request only current root.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only native clock intervals, body metadata and original fixed jack placements share. Each squat factory observes the borrowed entry in its original repetition order; each high-knee placement rereads its original entry-derived destination before computing its share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan closes over the clock and the stance.

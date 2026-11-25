# src/striking/StrikingAim.ts#StrikingAim.observations

## @evidence contracts/development/common.md#meaningful-documentation

States the schedule, its cutoff, the order and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

One observation per film frame from the launch while a correction starting a latency later can still run its shortest duration before contact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A contact not after the launch throws; 1e-9 s absorbs rounding at the cutoff.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the observations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingAim.ts#StrikingAim.predict

## @evidence contracts/development/common.md#meaningful-documentation

States the prediction, the difference and every unit.

## @evidence contracts/development/implementation.md#principled-implementation

First-order extrapolation with a backward difference (Brenner and Smeets 1996); a contact already past predicts the current point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two reads and one extrapolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the opaque target's exact now then seconds-step reads, original backward-difference scale and nonnegative remaining-time extrapolation; no future observation, alternative velocity or target snapshot replaces either call.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two target reads.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; the tracker memoises its calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingAim.ts#StrikingAim.track

## @evidence contracts/development/common.md#meaningful-documentation

States the causality of the target reads, the offset and the memo.

## @evidence contracts/development/implementation.md#principled-implementation

The planned goal is the launch observation's prediction; each later observation adds its change as a correction unit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The original schedule/prediction owner feeds one started-observation iterator; units emits its original timed records, while goal collects only displacement vectors before the original ordered fold.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the original schedule, initial launch prediction, fixed offset, started-time comparison, actual prediction callback order and every correction difference. All observations/displacements still precede goal accumulation, and no sample, active unit, timing bound or fitted answer is skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each actual prediction is produced once under the original index memo; K active corrections still cost O(K). Goal-only reads omit K unused timed-unit records while retaining original displacement snapshots and fold order; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The original observation-index prediction memo remains. Units and goal share started-time tests and exact prediction/difference order; no query goal, unit output or accumulation is retained or reused across seconds.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The existing memo is bounded by the fixed observation count and released with the tracker. Each read owns its temporary fresh unit/displacement outputs, and goal-only vectors/array end on return or failure without extending history.

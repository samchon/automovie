# src/everyday/prepareRiseFeet.ts#prepareRiseFeet

## @evidence contracts/development/common.md#meaningful-documentation

States fixed ankle/time geometry, units, positive duration premise and returned bearing flags.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same endpoint comparisons, minimum-jerk horizontal interpolation and sine clearance as rise's original draw; the prepared standing owner still writes each current-root knee goal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One foot-course reader supplies both ankle positions and their contact flags to a single leg-goal write.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains both exact swing intervals, the original draw/lift values and all planted endpoint rules; no motion or contact is approximated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two foot courses are read once per second instead of rereading each for bearing flags. Each actual swinging side lazily prepares fixed ankle deltas once, and its owned fresh vector receives the original sine lift without a discarded copy; standing rotations/contacts remain shared by the native builder.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed entry/drawn points, schedule and standing metadata alone prove equivalence; native Vector3.prepareLerp copies only endpoint coefficients on the first interior read. Every current progress/root/goal remains independently evaluated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The rise plan owns entry/drawn points, at most two swing intervals and at most two fixed six-scalar interpolation readers until release; no current point, FK workspace, queried time or result history is retained.

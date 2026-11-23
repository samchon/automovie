# src/reaction/wireFlight.ts#wireFlight.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The arc length s(t) = L * minimumJerk(t / T) placed on the polyline's segments; the planted feet are held over `LIFT`, a heel rising about its ball once its leg is straight (`ReactionFeet.hold`); the shape blends from the quiet stance's joints by a minimum-jerk weight at each end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, build the polyline, then evaluate each posture in closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A flight with no length or time is refused, never stretched.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the waypoints at plan time; a scan of the segments per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each plan owns its own polyline.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan closes over the polyline and its cumulative lengths.

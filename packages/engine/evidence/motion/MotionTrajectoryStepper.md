# src/motion/MotionTrajectoryStepper.ts#MotionTrajectoryStepper.dormandPrince

## @evidence contracts/development/common.md#meaningful-documentation

States the accepted-error norm, dense interpolation, time units, callback-shape checks, finite-data caller premise and time-resolution failure.

## @evidence contracts/development/implementation.md#principled-implementation

Preserves the cited DP tableau/controller and generic RMS or explicit block norm. The tableau identities sum(A_i)=C_i and sum(E)=0 express stage/error sums as a common first rate plus rate differences, removing coefficient-sum roundoff on constant RHS without changing a budget. MotionTrajectoryDense matches body slopes through Jr^-1 and optionally checks paired quintics in physical units. This does not remove every binary64 cancellation floor or certify global error and arbitrary histories.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Form trial stages, measure their error, reject or retain the continuous extension, then expose binary-search sampling. An unresolvable step reports the last rejected estimates without changing admission or adding a runtime observer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Tableau and controller constants retain their cited provenance; no fixture-specific time grid, cached answer or tolerance relaxation is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each trial has six new RHS stages after the initial call and O(n+1) scalar/rotation work. Physical dense control adds four RHS evaluations on RMS-admitted trials and model probes at method nodes and paired component extrema. Numeric output is O(A(n+1)) for A accepted steps; full reads cost O(log A+n+1), quaternion projection O(log A). Accepted and rejected attempts together are bounded by DOPRI5's default nmax of 100000, before which the time-resolution guard may fail first.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the accepted last stage as the next first stage. Its already computed vector state is the identical fifth-order weighted sum, and its orientation is the same exponential used for the normalized endpoint, so neither is recomputed. Stages one through five share one private rotation-vector workspace: turn and dexpinv read its components without retaining it. Stage six, error and dense sums get fresh vectors. An absent vector block shares its private empty state and empty coefficients without component arithmetic. Dense coefficients are stored once and the reader reuses its immediately preceding exact time without reintegration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One private three-component stage workspace never enters callback inputs or accepted records. One FSAL quaternion reference keeps the raw input of the retained rate, before knot normalization. Rejected trial arrays release; one constant-size numeric rejection record copies its actual angular RHS endpoints and failed probe only on rejection, then replaces or clears them on the next rejection or acceptance. It escapes only on time exhaustion, holding no dense step, RHS or history. Accepted numeric steps, endpoint and bounded previous full/q/interval reads live with playback. Empty states/coefficients share private records while public output is fresh. Accepted-step storage holds at most `ATTEMPTS + 1` dense steps (the attempt that `nstep > nmax` still admits) and no external handle is acquired.

# src/kinematics/fitDigitToTarget.ts#fitDigitToTarget

## @evidence contracts/development/common.md#meaningful-documentation

States the variables, the two tasks and their units and order, the coupling's source and status, the method and its sources, the reach and stop rules and their owner, the continuation, determinism and the out-of-reach behaviour.

## @evidence contracts/development/implementation.md#principled-implementation

Damped task-priority least squares (Nakamura et al. 1987, Chiaverini 1997) through `fitDigitDescent` on the engine's forward kinematics, every trial measured after the range clamp, stopping at the engine's joint-angle resolution; continuation from the caller's seed. Optional exponential soft IK eases only the target's radial distance in a band derived from the full-extension curvature.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two residual functions over the digit's variables, one continued descent and a restart only when it cannot reach.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No iteration count and no weight between the tasks: the fit ends at the joint-angle resolution and reports distance from the original target, including any reach soft IK trades away. The width is derived from the chain lengths and `rate`; it does not penalise departure from an arbitrary seed.

## @evidence contracts/development/implementation.md#efficient-algorithms

With an explicit rig and rate, first soft-target FK admits/snapshots the full source once and shares that workspace with every complete digit overlay, removing a second O(J) non-digit admission/setup and unused prefix filter/copy. Without rate, first candidate prepares only non-digit records; raw callers retain full live FK/unrelated-rest admission. Each descent returns its actual final primary residual/Jacobian, removing a duplicate final residual and two FK probes per variable from the unchanged restart test. Only unreached continuation restarts; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A rate's actual source FK supplies unchanged soft-target frames and admitted baseline. Complete edits overwrite every original digit bone with identical last-record precedence; no digit is newly admitted without rate. FK grouping/admission keep their owner. Adjacent tasks share exact coordinates/clamped joints. Final residual/Jacobian belong to the same accepted variables and feasible-probe owner, so restart does not recompute a different boundary derivative. Targets, restart ranking, primary tolerance formula and joint resolution stay unchanged; no answer crosses fits.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One candidate snapshot, an optional fixed-pose workspace with O(J+D) source/ancestor state and any local ordinary reader end with the fit. A borrowed static rig/ordinary reader remain their caller's. No workspace or input history enters the fresh caller-owned result.

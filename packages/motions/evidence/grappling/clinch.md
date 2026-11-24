# src/grappling/clinch.ts#clinch.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the partner, gripping regions, hold timing, optional throw-entry lowering and negative-hold refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Both arm visits follow the partner's actual regions over the standing base; an optional under entry lowers the fulcrum by the initial region-height difference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds the clock/base and arm visits, wraps each displayed evaluation with a local partner reader, then adds optional root lowering.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every contact target and arm write still executes with the original timing and posture order; only equal partner/time reads within one synchronous posture call share their actual bones.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each posture retains the base/arm work but reads the partner at most once for its two matching target callbacks; zero sideways offsets skip unused shoulder-direction work and return the engine's fresh point/normal wrapper directly. All region placements request their actual point/normal fields without computing unconsumed forward. The two entry-height measurements use actual region world points without computing unused normal/forward rotations. No measured speedup is claimed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The explicit posture invocation fixes this plan, partner, seconds and unchanged composition/stop state. Target callbacks share only that invocation's lazily read partner map, carried as the evaluation's explicit loan (`IAutoMovieMotionHumanEvaluation.loan`) and honoured only by this plan at its own second, while another time or nested invocation gets its own loan. Both wrappers forward current self FK/ROM loans to their same-body composed plan only; foreign partner queries keep their independent actual reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each posture call's loan holds at most one partner map and lives only in that evaluation; no module or closure state carries it, and returned postures retain only goal vectors and no map.

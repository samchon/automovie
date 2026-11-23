# src/grappling/HumanForceResponse.ts#HumanForceResponse.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The pull is read from the force input at the start, or at its onset when it opens later, the response then shifted by the onset over a standing base; the centre, the base and its extent along the pull give the instant the base breaks by the pendulum law; a throw reads the thrower's placed posture at that instant for the fulcrum, swings, and flies under conserved momentum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the pull, then one of three motions built from one tip function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every infeasible original force/outcome is refused with its feasible input. Both sensitivity trials, the existing asin domain guard, current-posture pivot/heading mathematics and documented rigid-throw limitation remain; no force, target, mass or success bound is changed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One mass model, one base and, for a throw, one swing and one flight integration at plan time; constant work per evaluated second besides the flight's read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The base, centre, integrators, mass model and inertia are their owners'. Both sensitivity trials borrow one exact FK workspace and genuine unchanged-body ROM metadata without skipping either full posture solve, joint admission or clamp. The fixed mass/frequency/force coefficient is prepared once; yielding requests offset only, and the throw consumes one paired break-state offset/speed without repeating the analytic clock. Entry-facing basis products are prepared once for the actual resist/yield branch; each changing posture still computes its actual inverse heading, pivot offset and fresh tip.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The sensitivity's FK reader and ROM projector are released with that synchronous calculation; no returned time evaluator captures it. The plan holds the swing's and flight's trajectories for its lifetime.

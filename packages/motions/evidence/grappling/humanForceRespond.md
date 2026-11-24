# src/grappling/humanForceRespond.ts#humanForceRespond

## @evidence contracts/development/common.md#meaningful-documentation

States its inputs, the plan and its refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The pull is read from the force input at the start; the centre, the planted base and its extent along the pull give the instant the base breaks by the pendulum law; the whole body tips about the ankles along the facing and moves its root across it (Winter 1995), the centre's shift per root shift read by a forward difference of step sqrt(tolerance / height) of the centre's height (Nocedal and Wright, section 8.1); a throw reads the thrower's placed posture at the break for the fulcrum, swings and flies under conserved momentum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The response body of `HumanForceResponse.plan`, which keeps the outcome choice and its onset handling: read the pull, then one of three motions built from one tip function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every infeasible force or outcome is refused with its feasible input; both sensitivity trials, the asin domain guard and the documented rigid-throw limitation remain; no force, target, mass or success bound is changed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One mass model, one base and, for a throw, one swing and one flight integration at plan time; constant work per evaluated second besides the flight's read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The base, centre, integrators, mass model and inertia are their owners'. Both sensitivity trials borrow one exact FK workspace; the fixed mass, frequency and force coefficient are prepared once, and entry-facing basis products once for the actual branch.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The sensitivity's FK reader and ROM projector are released with that synchronous calculation; the plan holds the swing's and flight's trajectories for its lifetime.

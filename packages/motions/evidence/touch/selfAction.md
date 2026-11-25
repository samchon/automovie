# src/touch/selfAction.ts#selfAction.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusal; the law's doc gives the places and timing.

## @evidence contracts/development/implementation.md#principled-implementation

Each arm's whole action planned as one trajectory over the clock's instants (TrajOpt, `AutoMovieMotionHumanArm.carried`) to named places; head and shoulder circles as joint angles on the clock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One clock, then the rows of the kind.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sizes are range levels and named places; times are named provisional or sourced.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve per carried arm per second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the arm carry, the target places, the hand shapes and the joint primitives.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan closes over the clock and the entry.

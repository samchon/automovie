# src/compose/AutoMovieMotionHumanArmAimed.ts#AutoMovieMotionHumanArmAimed

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, once per instant, and that each elbow is searched on its own.

## @evidence contracts/development/implementation.md#principled-implementation

Every goal is the observation's own at its instant, its elbow the cold search's least-strain place, so a goal does not depend on the order instants are read in.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table of goals per arm, keyed by the instant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No goal is borrowed from another instant; a request outside the allowed places still takes its fallback or refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

A goal read once per arm and instant.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A read instant's goal is the plan's value at that instant, kept for the plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One goal per arm and instant read, released with the plan.

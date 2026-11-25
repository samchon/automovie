# src/compose/AutoMovieMotionHumanArmPlannedSolve.ts#AutoMovieMotionHumanArmPlannedSolve

## @evidence contracts/development/common.md#meaningful-documentation

States the order of the solves, the handover, the refusal and the finger playback.

## @evidence contracts/development/implementation.md#principled-implementation

The laid course is kept when the trajectory model's own reading admits it; otherwise it seeds one trajectory optimisation (TrajOpt). A refusal for time hands on the path it was reached at. Each hand plays its finger state between the instants linearly in each joint, as joint_trajectory_controller (ros_controllers, BSD-3-Clause) plays position-only points.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The plan's solve and playback, moved verbatim from `AutoMovieMotionHumanArmPlanned.planned`, read the scope the plan hands them; the plan's refusal in scope and the planner itself are read from the scope.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A warm solution, linked grip, perceived target or unresolved trial retains the original coupled solve; independent paths are admitted only by one coupled certificate.

## @evidence contracts/development/implementation.md#efficient-algorithms

An admitted first course needs no optimiser; a collision on independent sites adds at most two single-arm plans and one coupled grid certificate.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The retry borrows completed base and goal seconds and the original group pace.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned trajectories keep their playback and each hand's finger states, none of the plan's other maps.

# src/compose/AutoMovieMotionHumanArmPlannedSolve.ts#AutoMovieMotionHumanArmPlannedSolve.IScope

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what the plan holds.

## @evidence contracts/development/design.md#principled-representation

The plan's own values, readings and problem, named, so the solve reads them explicitly; the plan's refusal in scope is read through a getter, as at the refusal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seventeen members, each read by the solve or the playback.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The scope holds the plan's values as they are; nothing is copied or derived.

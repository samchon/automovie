# src/vehicles/rideBicycle.ts#rideBicycle

## @evidence contracts/development/implementation.md#principled-implementation

The development of a chain drive: wheel circumference times chainring teeth over sprocket teeth per crank turn. The crank's travel is taken modulo a full turn, which leaves the pose unchanged and keeps the number small. The lean is the steady-turn balance of `AutoMovieArchetypeCourse.lean`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the gear, plan the course unless planned, admit its direction and its bends' lean, list the dead-centre instants from its distance, then one pose function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Coasting holds the crank at its phase upon entering the declared interval while both wheels continue rolling. Braking speed is supplied by the course.

## @evidence contracts/development/implementation.md#efficient-algorithms

One instant per half turn of the crank over the course; constant work per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The course is planned once, for the dead-centre instants and for the ride that samples it; the lean check is the one the motorcycle's ride uses.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the bicycle and the plan for as long as the caller keeps the ride.

## @evidence contracts/development/common.md#meaningful-documentation

States the gear relation, the instants added and the default gear with its source.

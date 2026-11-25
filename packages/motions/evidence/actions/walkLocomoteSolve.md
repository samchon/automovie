# src/actions/walkLocomoteSolve.ts#walkLocomoteSolve.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States what is prepared once and what the returned solve reads at a second.

## @evidence contracts/development/implementation.md#principled-implementation

Both legs' range readers (`walkReach.prepareSwing`), the footfalls taken in place at the arrival and each running swing's departure excess, how far its leg's reach moves the stance it leaves at its toe-off, are prepared once; the solve settles the pelvis at its second and keeps each swinging foot inside its leg's ranges under it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Cut out of `walkLocomote`'s closure as the owner of the legs at a second.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A running swing whose excess the plan did not prepare is refused, not settled on demand.

## @evidence contracts/development/implementation.md#efficient-algorithms

One settle and one range fit per running swing at plan time; a read settles its second once and fits only its demanded swinging legs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every read shares the prepared range readers and excesses.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains two range readers and one excess per running swing, released with it.

# src/actions/walkLocomoteSolve.ts#walkLocomoteSolve.IContext

## @evidence contracts/development/common.md#meaningful-documentation

States each member the solve reads.

## @evidence contracts/development/design.md#principled-representation

The body, gait, step schedule, pelvis angles, settled ground and reached swings, each its owner's.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `walkLocomote` for `walkLocomoteSolve.prepare`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is optional; a walk always has its ground and swings.
# src/compose/AutoMovieMotionHumanArmChain.ts#AutoMovieMotionHumanArmChain.continued

## @evidence contracts/development/common.md#meaningful-documentation

States the defect, the grid, the continuation, how a second reads the course and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

Continuation along a path, the per-frame seeding of an analytic IK by the frame before, as `AutoMovieMotionHumanArmCourse` fits a hold; the grid is the planner's, and between two of its instants the arm is the blend of their arms, as a trajectory's playback reads its waypoints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One chain of continued fits on the grid; one blend of two instants per second read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every instant of the grid is fitted to its own goals, the action's end among them; a second on an instant reads that instant's fit exactly.

## @evidence contracts/development/implementation.md#efficient-algorithms

One continued fit per grid instant, laid once per plan up to the latest second read; a second read fits nothing, three joint blends per arm.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The grid instants' seeds and arms are the course's own record, read by every second after them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one seed record and one arm record per grid instant of the action and the course's one FK reader, released with the plan.

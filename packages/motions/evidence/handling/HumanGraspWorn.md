# src/handling/HumanGraspWorn.ts#HumanGraspWorn.key

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The thing is rigid in the hand from the grasp on, so the hand's pose at the key is the worn frame times the inverse of the thing's frame in the hand. A round thing's turn about the region is the shared chooser's (`HumanFreedomChoice`, a wrapped freedom), the turn the arm, fitted within its ranges, brings the wear socket nearest the region at, the closed hand's depth inside the body added as a cost; the key is judged by the same miss. Each fit's elbow is left to the body (`HumanPosture.IGoal.elbow`): the least hand error, then the least strain, read from the fit's own sweep; never placed by a share of the arm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The hand's offset, the key of a turn, its fitted miss, one choice.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The judge is the quantity `dress` judges, never a mix of degrees and millimetres.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each turn is fitted once, kept in a map, however often the search returns to it; a thing not round is fitted at its one turn.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per candidate grasp.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The map lives for the call.

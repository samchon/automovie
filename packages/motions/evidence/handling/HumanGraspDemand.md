# src/handling/HumanGraspDemand.ts#HumanGraspDemand.grip

## @evidence contracts/development/common.md#meaningful-documentation

States the grip and how it is read.

## @evidence contracts/development/implementation.md#principled-implementation

The fingers close on the prop where the hand is shown, so the prop's place in the hand is read from the shown hand and the prop's frame at the action's start, as a held prop's is (`AutoMovieMotionHumanHeld.grasped`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One grasp record, read per asked working point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One prop frame read and one grasp record per call; the tool reading runs per asked working point.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The held owner's grasp and the held tool's reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The grip closes over its grasp record.

# src/handling/HumanGraspDemand.ts#HumanGraspDemand.key

## @evidence contracts/development/common.md#meaningful-documentation

States the key, its elbow, its posture, its measure and its bound.

## @evidence contracts/development/implementation.md#principled-implementation

The key passes exactly when the demanding action would not refuse the pose: the same goal, elbow and arm solution its refusal fits (`StrikingRoll.miss`), the posture's other limbs kept so the coupled fit the pose is shown by is the one judged, the same stray against the same bound; a key fitted on the grasp's solution failed grips that action accepts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The wrist, the goal, the judge.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The measure and the bound are both metres.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant rigid work; the judge reads the fitted hand bone alone.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The held tool's goal and measure.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The judge closes over the demand and the hand's grip-point reader.

# src/compose/AutoMovieMotionHumanArmPlayed.ts#AutoMovieMotionHumanArmPlayed.grasp

## @evidence contracts/development/common.md#meaningful-documentation

States the base pose and posture it reads, the hand, when the arm's goal fit is read, and the digit joints it returns in clinical degrees by bone.

## @evidence contracts/development/implementation.md#principled-implementation

MoveIt's grasp convention (moveit_msgs/Grasp, ros-planning/moveit_msgs, BSD-3-Clause): a grasp's finger state is a joint-space grasp_posture belonging to its grasp_pose. Here the hand's digit goals are fitted by the existing digit inverse kinematics (`HumanDigitFit.fitted`) with the arm at its goal's own fit, the grasp pose; a hand with no digit goal keeps the joints its base pose has, its authored state.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Selects the hand's own goals, places the arm, delegates the fit to `HumanDigitFit` and reads the hand's digit joints back.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance and no constant: the fit is the display's own digit fit, read once where the plan reads the hand. Limit: a digit goal on a bone of the other planned arm is read with that arm where the base leaves it.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one arm placement and one digit fit per instant the plan builds a base for, and none for a hand without digit goals; the goal fit is read lazily only then.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments; the plan keeps each instant's result with that instant's base.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh joint record and retains nothing.

# src/compose/AutoMovieMotionHumanArmPlayed.ts#AutoMovieMotionHumanArmPlayed.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the instants, the states and how a second between, before or after them is read.

## @evidence contracts/development/implementation.md#principled-implementation

joint_trajectory_controller (ros-controls/ros_controllers, BSD-3-Clause) plays a trajectory whose points give positions alone linearly between them and holds the end points; the finger state is played the same way between the instants the plan read the hand at.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepared once over the plan's instants; each read is a bisection and one linear blend per digit joint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No smoothing or tolerance: the instants' own states, blended linearly; a joint present at one end only is held at that value.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(log n) per read for n instants plus O(j) for the hand's j digit joints; nothing is computed at preparation beyond keeping the arrays.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reader over the arrays it was given.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader borrows the instants and states, held by the plan as long as its trajectory is kept; each read returns a fresh record.

# src/compose/AutoMovieMotionHumanArmPlayed.ts#AutoMovieMotionHumanArmPlayed.written

## @evidence contracts/development/common.md#meaningful-documentation

States which joints are written, which goals are removed and why.

## @evidence contracts/development/implementation.md#principled-implementation

The planned arm's joints and its hand's finger state are written as the plan plays them, and the arm's limb goal and the hand's digit goals are removed, so no fit after the plan moves either: execution plays the plan's grasp_posture unchanged (moveit_msgs/Grasp, BSD-3-Clause).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One writer shared by every display of a planned arm (`AutoMovieMotionHumanArmCarry`, `AutoMovieMotionHumanSharedCarry`, `gestureHands.written`).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fit or correction; the other hand's digit goals are kept.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(j) joint writes and at most ten goal deletions per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure write with nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh posture and retains nothing.

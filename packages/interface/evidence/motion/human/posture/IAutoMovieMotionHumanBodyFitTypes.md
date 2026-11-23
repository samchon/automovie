# src/motion/human/posture/IAutoMovieMotionHumanBodyFitTypes.ts#IAutoMovieMotionHumanBodyFitTypes

## @evidence contracts/development/common.md#meaningful-documentation

point: The point in the bone's frame, metres; its origin when absent. on: The bone carrying the goal frame; world coordinates when absent. goal: Where it goes, metres in the goal frame.

## @evidence contracts/development/design.md#principled-representation

point: The point in the bone's frame, metres; its origin when absent. on: The bone carrying the goal frame; world coordinates when absent. goal: Where it goes, metres in the goal frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/support.ts (support.plan, return); actions/supportContact.ts (supportContact.swing, return); actions/supportKey.ts (supportKey.solved, swings); actions/supportKey.ts (supportKey.solved.targets, return); posture/HumanBodyFit.ts (HumanBodyFit.fit, t); posture/HumanBodyFitMerit.ts (HumanBodyFitMerit.of.misses.goals, t).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanSequentialConvex.Reason, IAutoMovieMotionHumanBody identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanBodyFitTypes.ts#IAutoMovieMotionHumanBodyFitTypes.ITarget

## @evidence contracts/development/common.md#meaningful-documentation

Each member gives its coordinate frame, units and absence convention.

## @evidence contracts/development/design.md#principled-representation

A rigid bone-local effector is constrained in a world or bone-carried goal frame; a physical radius bounds its Euclidean error separately from numerical equality precision.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same fields read by the rows and merit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Bone names use the canonical closed vocabulary and rotations use the existing quaternion type.

# src/motion/human/posture/IAutoMovieMotionHumanBodyFitTypes.ts#IAutoMovieMotionHumanBodyFitTypes.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States every residual's unit and the convergence outcome.

## @evidence contracts/development/design.md#principled-representation

Residuals are measured after the fitted variables are written, not taken from a linear subproblem.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Posture, feasibility, convergence reason and each requested constraint family's residuals.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unmet constraints remain visible even when the numerical loop stops.

# src/motion/human/posture/IAutoMovieMotionHumanBodyFitTypes.ts#IAutoMovieMotionHumanBodyFitTypes.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States the input posture, variables, all supported goals and bearing and balance conventions.

## @evidence contracts/development/design.md#principled-representation

Contacts, angle relationships and a physical centre target are constraints on the same posture variables.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only current solver inputs; the sprint set is the consumer requiring angles and a positional centre.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Named goals do not alter the rig's joint ranges or substitute a bone for the mass centre.

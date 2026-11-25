# src/motion/human/posture/IAutoMovieMotionHumanJacobian.ts#IAutoMovieMotionHumanJacobian.IVariable

## @evidence contracts/development/common.md#meaningful-documentation

kind: Differentiated coordinate family: root translation, root heading or a clinical joint angle. axis: Coordinate axis within that family: x/y/z metres, yaw/pitch/roll degrees, or clinical joint tuple index 0/1/2. kind: Differentiated coordinate family: root translation, root heading or a clinical joint angle.

## @evidence contracts/development/design.md#principled-representation

kind: Differentiated coordinate family: root translation, root heading or a clinical joint angle. axis: Coordinate axis within that family: x/y/z metres, yaw/pitch/roll degrees, or clinical joint tuple index 0/1/2. kind: Differentiated coordinate family: root translation, root heading or a clinical joint angle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmJacobian.ts (HumanArmJacobian.columns.joints, return); posture/HumanBodyFit.ts (HumanBodyFit.fit.units, v); posture/HumanBodyFit.ts (HumanBodyFit.fit.least, v); posture/HumanFitVariables.ts (HumanFitVariables.BODY, return); posture/HumanFitVariables.ts (HumanFitVariables.vector, variables); posture/HumanFitVariables.ts (HumanFitVariables.vector, v).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanJacobian.ts#IAutoMovieMotionHumanJacobian.IMotion

## @evidence contracts/development/common.md#meaningful-documentation

linear: The linear velocity it gives the world origin, metres; a place's direction, or the turn's at the origin. moves: The bones moved; null for every bone.

## @evidence contracts/development/design.md#principled-representation

linear: The linear velocity it gives the world origin, metres; a place's direction, or the turn's at the origin. moves: The bones moved; null for every bone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanBodyFitRows.ts (HumanBodyFitRows.of.all, _); posture/HumanBodyFitRows.ts (HumanBodyFitRows.floor.all, _); posture/HumanBodyFitRows.ts (HumanBodyFitRows.scaled, rate); posture/HumanBodyFitRows.ts (HumanBodyFitRows.scaled, m); posture/HumanBodyFitRows.ts (HumanBodyFitRows.low, m); posture/HumanFitBalance.ts (HumanFitBalance.slopes, motions).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanJacobian.ts#IAutoMovieMotionHumanJacobian.ITwist

## @evidence contracts/development/common.md#meaningful-documentation

linear: Metres, at the bone's origin.

## @evidence contracts/development/design.md#principled-representation

linear: Metres, at the bone's origin.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmTrajectoryJacobians.ts (HumanArmTrajectoryJacobians.of.motion, twist); posture/HumanFitTargets.ts (HumanFitTargets.rows.motions, return); posture/HumanFitTargets.ts (HumanFitTargets.rows.scaled, f); posture/HumanFitTargets.ts (HumanFitTargets.rows.scaled, motion); posture/HumanFitTargets.ts (HumanFitTargets.rows, motion); posture/HumanFitTargets.ts (HumanFitTargets.rows, _).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

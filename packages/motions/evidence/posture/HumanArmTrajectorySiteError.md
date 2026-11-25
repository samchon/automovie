# src/posture/HumanArmTrajectorySiteError.ts#HumanArmTrajectorySiteError.IReading

## @evidence contracts/development/common.md#meaningful-documentation

excess, offsets: the error's values; index: the variables; excessRow, offsetRows: their derivatives.

## @evidence contracts/development/design.md#principled-representation

What sco's ConstraintFromErrFunc and CostFromErrFunc hand the convex model: an error vector and its Jacobian in the function's own variables.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmTrajectoryConvex.ts (the site's rows).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Read values only.

# src/posture/HumanArmTrajectorySiteError.ts#HumanArmTrajectorySiteError.read

## @evidence contracts/development/common.md#meaningful-documentation

States the iterate, the arm, the waypoint and the site, and the reading returned.

## @evidence contracts/development/implementation.md#principled-implementation

trajopt's ConstraintFromErrFunc and CostFromErrFunc with calcForwardNumJac (src/sco/modeling_utils.cpp, src/sco/num_diff.cpp at 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause), at the step DEFAULT_EPSILON 1e-5. The error function is the evaluation's own site reading (HumanArmTrajectoryEvaluate): the contact's offset from the located site, its slide along the surface past the region's disc, and its offsets along the free axes. So the convex row is the linearisation of the evaluated error by construction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading at the iterate, then one per free coordinate of the arm and of the arm the site rides.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

sco's own step; no tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

One arm placement per variable.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each reading is its own iterate's.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The perturbed placements live for the call only.
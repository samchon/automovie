# src/posture/HumanArmTrajectoryAdmission.ts#HumanArmTrajectoryAdmission.IReading

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The coordinates read and their evaluation, nothing derived from them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read by the solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The evaluation is the model's own record, not a summary of it.

# src/posture/HumanArmTrajectoryAdmission.ts#HumanArmTrajectoryAdmission.read

## @evidence contracts/development/common.md#meaningful-documentation

States the contexts, the coordinates and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The played interpolant is evaluated by the one model the optimiser's iterates are, on the grid's own context with the knots as its read waypoints, so the reading is the admission the optimiser itself applies.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One interpolation an arm and grid instant, then one evaluation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every motion term the model refuses by is read at every grid instant, and the clearance at the knots and over the intervals between them through every grid frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

One model evaluation over the grid. Each arm prepares its knot-only differences and spans once for all grid instants.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each arm's unchanged knot seconds and coordinates supply the same tangent and span values to any grid instant. The optimiser's own last evaluation serves where it exists.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh arrays and the model's evaluation; retains nothing.

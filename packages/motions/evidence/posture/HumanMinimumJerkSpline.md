# src/posture/HumanMinimumJerkSpline.ts#HumanMinimumJerkSpline.IDerivatives

## @evidence contracts/development/common.md#meaningful-documentation

velocities, accelerations: each via point's, per coordinate, with their units.

## @evidence contracts/development/design.md#principled-representation

The quintic Hermite data the minimum-jerk path's intervals are read from: each point's velocity and acceleration beside its position.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmRefine.ts (prepareHermite); posture/HumanArmTrajectoryRetime.ts (timing).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Solved values only; nothing cached.

# src/posture/HumanMinimumJerkSpline.ts#HumanMinimumJerkSpline.derivatives

## @evidence contracts/development/common.md#meaningful-documentation

States the times, the points and the velocities and accelerations returned, zero at both ends.

## @evidence contracts/development/implementation.md#principled-implementation

Flash and Hogan 1985 (J. Neurosci. 5(7):1688): the integrated squared jerk through via points at fixed times is least on a quintic per interval (x⁽⁶⁾ = 0) whose jerk and snap are continuous at each interior via point, at rest in velocity and acceleration at both ends. The two continuity conditions per interior point form a block-tridiagonal system in each point's velocity and acceleration. It is solved by block elimination (Golub and Van Loan, Matrix Computations, section 4.5.1), with every coordinate as one right-hand side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Assembly, forward elimination and back substitution, with two-by-two block helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance or constant beyond the quintic Hermite basis's own derivatives at its ends.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(points × coordinates).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call solves its own points.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the blocks for the call only.

# src/posture/HumanMinimumJerkSpline.ts#HumanMinimumJerkSpline.quintic

## @evidence contracts/development/common.md#meaningful-documentation

States the two points' data, the interval and the share, and the coordinates returned.

## @evidence contracts/development/implementation.md#principled-implementation

The quintic Hermite basis on [0, 1] in positions, velocities times h and accelerations times h².

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Six basis values and one weighted sum per coordinate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(coordinates).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only the returned coordinates.

# src/posture/HumanMinimumJerkSpline.ts#HumanMinimumJerkSpline.cyclic

## @evidence contracts/development/common.md#meaningful-documentation

States the points within one period, the period, and the velocities and accelerations returned.

## @evidence contracts/development/implementation.md#principled-implementation

Flash and Hogan's minimum-jerk path (1985) made periodic: the same jerk and snap continuity at every point, the last joined to the first across the period, so the path has no end and no rest. The block-cyclic system is solved by Gaussian elimination with partial pivoting (Golub and Van Loan, section 3.4), every coordinate as one right-hand side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Assembly, elimination and back substitution.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant beyond the quintic Hermite basis's own derivatives at its ends.

## @evidence contracts/development/implementation.md#efficient-algorithms

O((2 points)³) for the few points of one cycle.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call solves its own points.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the system for the call only.

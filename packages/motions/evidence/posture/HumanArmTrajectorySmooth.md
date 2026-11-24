# src/posture/HumanArmTrajectorySmooth.ts#HumanArmTrajectorySmooth.ITerm

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it indexes and its role in the residual.

## @evidence contracts/development/design.md#principled-representation

The residual's variables with their coefficients, and every coordinate its value sums, a fixed waypoint's among them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `of` for the curvature and by `gradient` for the linear term.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Indices into the context's variables and waypoints, no copies of coordinates.

# src/posture/HumanArmTrajectorySmooth.ts#HumanArmTrajectorySmooth.ISmooth

## @evidence contracts/development/common.md#meaningful-documentation

States the band's layout and the terms' order.

## @evidence contracts/development/design.md#principled-representation

The upper band of the symmetric curvature, `p[i][j]` the entry `(i, i + j)`, as `HumanQuadraticProgram.IProblem` stores it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The dimensions the convex model allocates by, the band it copies and the terms its gradient reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One record for a trajectory and a still configuration alike.

# src/posture/HumanArmTrajectorySmooth.ts#HumanArmTrajectorySmooth

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the ownership of the result.

## @evidence contracts/development/implementation.md#principled-implementation

The Hessian of `w r^2` for linear `r` is `2 w c c^T`, exact and independent of the iterate; a second difference at a waypoint beside a fixed end reads that end's coordinate in its value and not among its variables.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The terms listed as the model sums them, then one outer product per term into the band.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The same waypoints, clamping at the ends, weights and still-configuration range as `HumanArmTrajectoryModel.evaluate`.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N F) terms of at most three variables for N waypoints and F free coordinates, once per context.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The curvature is a function of the context alone, so the caller builds it once and hands it to every convex model of that context.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record and retains nothing.

# src/posture/HumanArmTrajectorySmooth.ts#HumanArmTrajectorySmooth.gradient

## @evidence contracts/development/common.md#meaningful-documentation

States what is added, where, and that the target is changed in place.

## @evidence contracts/development/implementation.md#principled-implementation

The gradient of `w r^2` at the zero step is `2 w r c`, with `r` read on the iterate's own coordinates, fixed ends included.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the terms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every term is read at every iterate; nothing of an earlier iterate is kept.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N F) scalar work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The gradient depends on the iterate and is read anew.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Changes only the caller's vector and retains nothing.

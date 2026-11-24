# src/posture/HumanInteractionMeshStep.ts#HumanInteractionMeshStep.IRow

## @evidence contracts/development/common.md#meaningful-documentation

Names the coordinate, derivative and scalar energy terms.

## @evidence contracts/development/design.md#principled-representation

A sparse Jacobian row and its local energy slope and curvature.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used for the Laplacian, finite-weight constraints and active volume barriers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each coefficient comes from the actual current residual geometry.

# src/posture/HumanInteractionMeshStep.ts#HumanInteractionMeshStep.balance

## @evidence contracts/development/common.md#meaningful-documentation

Defines row order and the scalar result.

## @evidence contracts/development/implementation.md#principled-implementation

Li et al. 2020 technical supplement §6's least-squares balance, projecting the unit barrier gradient onto the negative deformation gradient.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Accumulate two gradients and take their scalar projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every actual row contributes its computed gradient; the caller applies the physical conditioning interval.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sparse row pass and two coordinate inner products, once per deformation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same local energy and barrier rows as the deformation step.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Both gradient arrays are released on return.

# src/posture/HumanInteractionMeshStep.ts#HumanInteractionMeshStep

## @evidence contracts/development/common.md#meaningful-documentation

States the current sparse inputs, solve and output units.

## @evidence contracts/development/implementation.md#principled-implementation

Accumulates exact rank-one Hessian products and gradient terms. A square-root machine epsilon relative floor regularizes the translation null space. Standard diagonally preconditioned conjugate gradients stop at the corresponding relative residual or at the Cartesian dimension.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One gradient/diagonal assembly and one matrix-free linear solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Regularization is a rounding scale, and the nonlinear acceptance remains the caller's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each iteration is linear in the nonzero entries of the terms plus the Cartesian dimension.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The diagonal and row values are fixed at that iterate and serve every matrix-vector product.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The Cartesian vectors and packed row offsets, columns, derivatives and curvatures belong to this solve. Only the returned step survives.

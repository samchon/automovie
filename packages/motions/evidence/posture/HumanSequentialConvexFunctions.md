# src/posture/HumanSequentialConvexFunctions.ts#HumanSequentialConvexFunctions.Vector

## @evidence contracts/development/common.md#meaningful-documentation

A point: the variables' values.

## @evidence contracts/development/design.md#principled-representation

sco's DblVec of variable values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmReach.ts (track B's attitude choice); test/src/features/geometry/test_geometry_sequential_sco_problems.ts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No unit is attached; the problem states its own.

# src/posture/HumanSequentialConvexFunctions.ts#HumanSequentialConvexFunctions.ICost

## @evidence contracts/development/common.md#meaningful-documentation

f: the cost's value at a point. full: whether it is convexified with its full Hessian.

## @evidence contracts/development/design.md#principled-representation

trajopt's CostFromFunc: a scalar function and its full_hessian flag (modeling_utils.cpp line 37).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmReach.ts (track B's attitude choice); test/src/features/geometry/test_geometry_sequential_sco_problems.ts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The function is the caller's; its convexification is the port's.

# src/posture/HumanSequentialConvexFunctions.ts#HumanSequentialConvexFunctions.IConstraint

## @evidence contracts/development/common.md#meaningful-documentation

g: the constraint's values. equality: whether they are equalities, inequalities g <= 0 otherwise.

## @evidence contracts/development/design.md#principled-representation

trajopt's ConstraintFromFunc with its ConstraintType EQ or INEQ (modeling_utils.cpp line 140).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmReach.ts (track B's attitude choice); test/src/features/geometry/test_geometry_sequential_sco_problems.ts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The values are the caller's; their pricing is cntsToCosts'.

# src/posture/HumanSequentialConvexFunctions.ts#HumanSequentialConvexFunctions.IFunctions

## @evidence contracts/development/common.md#meaningful-documentation

costs, constraints, and each variable's low and high bounds.

## @evidence contracts/development/design.md#principled-representation

An OptProb's costs, constraints and variable bounds (modeling.cpp createVariables with lb and ub).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmReach.ts (track B's attitude choice); test/src/features/geometry/test_geometry_sequential_sco_problems.ts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Bounds are hard, as sco's variable bounds are.

# src/posture/HumanSequentialConvexFunctions.ts#HumanSequentialConvexFunctions.IDerivatives

## @evidence contracts/development/common.md#meaningful-documentation

gradient and hessian at a point, the Hessian convexified.

## @evidence contracts/development/design.md#principled-representation

What calcGradAndDiagHess and calcGradHess return, after CostFromFunc's convexification.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmReach.ts (track B's attitude choice); test/src/features/geometry/test_geometry_sequential_sco_problems.ts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The Hessian is the convexified one, named so.

# src/posture/HumanSequentialConvexFunctions.ts#HumanSequentialConvexFunctions.problem

## @evidence contracts/development/common.md#meaningful-documentation

States the functions and the loop's problem.

## @evidence contracts/development/implementation.md#principled-implementation

trajopt @8da5bb00 (BSD-2-Clause): closest clamps to the bounds (OptProb::getClosestFeasiblePoint); evaluate sums the costs and each constraint's values' violations (Constraint::violation), their sum and greatest; convexify builds CostFromFunc::convex (modeling_utils.cpp lines 45-95) and ConstraintFromFunc::convex (lines 152-166) priced by cntsToCosts (optimizers.cpp lines 118-131) in the step, the box intersected with the bounds (setTrustBoxConstraints), solved by the interior-point method; the model merit is the costs at the point plus the program's value.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A closure over the functions; evaluation and model are private.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fallback: an unsolved program is a failed step.

## @evidence contracts/development/implementation.md#efficient-algorithms

Per convexification: n + 1 cost evaluations per diagonal Hessian or n(n + 1) + 1 per full one, n + 1 per constraint Jacobian, and one dense QP of n variables per box.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each convexification reads its point afresh, as sco's does.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the functions; each model lives for its iteration.

# src/posture/HumanSequentialConvexFunctions.ts#HumanSequentialConvexFunctions.diagonalHessian

## @evidence contracts/development/common.md#meaningful-documentation

States the function, the point, the gradient and diagonal Hessian.

## @evidence contracts/development/implementation.md#principled-implementation

calcGradAndDiagHess (num_diff.cpp): central differences at ±EPSILON/2, the diagonal clipped at zero as CostFromFunc::convex clips it; EPSILON 1e-5 is sco's DEFAULT_EPSILON.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the variables.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

sco's step only.

## @evidence contracts/development/implementation.md#efficient-algorithms

2n + 1 evaluations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new arrays.

# src/posture/HumanSequentialConvexFunctions.ts#HumanSequentialConvexFunctions.fullHessian

## @evidence contracts/development/common.md#meaningful-documentation

States the function, the point, the gradient and the Hessian's positive part.

## @evidence contracts/development/implementation.md#principled-implementation

calcGradHess (num_diff.cpp): forward-difference gradient and its forward-difference Jacobian, symmetrised; kept on its positive eigenvalues as CostFromFunc::convex keeps it; the eigenpairs by the cyclic Jacobi method (Golub and Van Loan 2013, Matrix Computations, 4th ed., section 8.5.3, Algorithm 8.5.1 per rotation).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Gradient, Jacobian, symmetrisation, projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

sco's step only; Jacobi sweeps until the off-diagonal vanishes to the double's precision.

## @evidence contracts/development/implementation.md#efficient-algorithms

n(n + 1) + 1 evaluations and O(n^3) per Jacobi sweep.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new arrays.

# src/posture/HumanSequentialConvexFunctions.ts#HumanSequentialConvexFunctions.forwardGradient

## @evidence contracts/development/common.md#meaningful-documentation

States the function, the point and the gradient.

## @evidence contracts/development/implementation.md#principled-implementation

calcForwardNumGrad (num_diff.cpp).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

sco's step only.

## @evidence contracts/development/implementation.md#efficient-algorithms

n + 1 evaluations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new array.

# src/posture/HumanSequentialConvexFunctions.ts#HumanSequentialConvexFunctions.forwardJacobian

## @evidence contracts/development/common.md#meaningful-documentation

States the function, the point and the Jacobian.

## @evidence contracts/development/implementation.md#principled-implementation

calcForwardNumJac (num_diff.cpp): row k the gradient of the k-th value.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Columns, then transposed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

sco's step only.

## @evidence contracts/development/implementation.md#efficient-algorithms

n + 1 evaluations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new arrays.

# src/posture/HumanBodyFit.ts#HumanBodyFit.fit

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result, with sco's end status as the reason.

## @evidence contracts/development/implementation.md#principled-implementation

Sequential quadratic programming on the l1 merit: each convexification linearises the rows at the iterate (each bearing part's lowest point, the floor under every collider near it, the targets, the balance's edges, the pairs near contact), all re-selected at that iterate, and the merit prices the same rows. The loop is trajopt's (`HumanSequentialConvex`, the port of `sco::BasicTrustRegionSQP::optimize`, github.com/joschu/trajopt src/sco/optimizers.cpp at commit 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause, Copyright (c) 2013, John Schulman) at sco's defaults in this problem's own units (the box a share of each variable's reach, the violation in priced millimetres past the band). The start is projected into the ranges (`getClosestFeasiblePoint`), each model is solved in the box intersected with the ranges (`setTrustBoxConstraints`, `HumanFitVariables.bounds`), and the model merit is the pull at the iterate plus the program's value at the solution.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading and merit (`HumanBodyFitMerit`) and the shared loop; each convexification builds its rows once and solves them at each box.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every goal is a priced row and every collider near the floor a row; a residual is measured on the fitted posture, never taken from the model. No fallback: a program the interior method leaves unsolved ends the fit `failed`, as sco's ends where its convex solver fails; no second-order correction or steering, which sco's loop does not have.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 5 coefficients × 50 convexifications, each one Jacobian read and one interior solve per box tried; a floor collider or a pair enters a convexification within trajopt's contact distance, 0.04 m beyond contact (`problem_description.cpp` line 549; Schulman et al. 2014, section IV-A), whatever the box, the reference's own cost; in a bounded number of dense factorisations of the n-variable system, independent of the curvature's conditioning.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The joints' projection and the objective's diagonal curvature are prepared once per fit. One interior session per linearisation shares its scales, scratch and last converged point across its boxes, a start that decides no answer; a new linearisation clears them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The call owns indices, one curvature, the projection, one interior session (one scaling, one scratch set and one point) and the current model, iterate and reading; the written posture transfers to the result, with no cache beyond the call.
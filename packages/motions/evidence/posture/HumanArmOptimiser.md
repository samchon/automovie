# src/posture/HumanArmOptimiser.ts#HumanArmOptimiser.IOptimised

## @evidence contracts/development/common.md#meaningful-documentation

x: each arm's coordinates at each waypoint. evaluation: their reading, which admits or refuses the path played. penalty: the merit coefficient the solve ended at.

## @evidence contracts/development/design.md#principled-representation

The three things a caller of the optimiser reads: the waypoints, the reading its admission judges, and the coefficient a continued solve starts from (trajopt's `merit_error_coeff_` member after `optimize`).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmTrajectoryStretch.ts (optimise, penalty); posture/HumanArmSeed.ts; posture/HumanArmTrajectoryContactContinuation.ts; posture/HumanLimbPair.ts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reading is the model's own (`HumanArmTrajectoryModel.IEvaluation`); nothing is relabelled.

# src/posture/HumanArmOptimiser.ts#HumanArmOptimiser.optimise

## @evidence contracts/development/common.md#meaningful-documentation

States unchanged waypoint endpoints, the continued coefficient, the frame grid's knots and the result.

## @evidence contracts/development/implementation.md#principled-implementation

TrajOpt's solve (Schulman et al. 2014): trajopt's own loop (`HumanSequentialConvex`, the port of `sco::BasicTrustRegionSQP::optimize`) at the settings trajopt's trajectory entry gives it (`OptimizeProblem`, github.com/joschu/trajopt src/trajopt/problem_description.cpp lines 247-250 at commit 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause, Copyright (c) 2013, John Schulman): `max_iter_` 40, `min_approx_improve_frac_` .001, `improve_ratio_threshold_` .2, `merit_error_coeff_` 20, the rest sco's defaults. The defaults that carry a unit in trajopt's problems are read in this model's units: its joint variables are radians, so the box 0.1 and the least box 1e-4 become coordinate units by 180/π (a coordinate is near a degree); its distances are metres, so the constraint tolerance 1e-4 becomes 0.1 mm. The start is projected onto the coordinates' hard ranges (`getClosestFeasiblePoint`); each model is solved in the box intersected with those ranges (`setTrustBoxConstraints`), by the interior-point method; the model merit is the iterate's objective plus the program's value at the solution, the constant the program omits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

TrajectoryConvex owns the rows, TrajectorySmooth the exact curvature, the quadratic program its interior solve, and the shared loop acceptance; one shell holds a linearisation at one coefficient and its box rows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fallback: a model the interior method leaves unsolved ends the solve `failed`, as trajopt's ends where its convex solver fails, and the caller's reading refuses it. Every setting is trajopt's, with its unit stated; no value is tuned to a case.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 5 coefficients × 40 convexifications, each solved once per box tried; one convexification reads the iterate's own pairs within trajopt's contact distance of their bounds, 40 mm (`HumanArmTrajectoryTerms.CHECK`, `problem_description.cpp` line 549; Schulman et al. 2014, section IV-A), whatever the box: in a small box this reads more pairs than a box-bounded screen would, the reference's own cost. On a grid the clearance is read at the knots and over the intervals between them (`HumanArmTrajectoryEvaluate`), trajopt's timesteps with casts between them (Schulman et al. 2014, section IV-B).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each iterate is read once; its reading is what the merit and the convex model both take. The context's exact curvature is built once per solve. The solve's programs are one interior-point session: a coefficient's first program sets the scales its later programs share, a program at another coefficient is equilibrated again since every soft row weighs the coefficient, and the programs of one linearisation start from the last one solved, a start that decides no answer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each convexification owns one numeric snapshot and bounded solver scratch until it is replaced or the solve returns; the returned coordinates and reading are independent, and no result is kept after the call.

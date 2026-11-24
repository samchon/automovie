# src/posture/HumanArmOptimiser.ts#HumanArmOptimiser.optimise

## @evidence contracts/development/common.md#meaningful-documentation

States unchanged waypoint endpoints, penalty continuation and actual final evaluation.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the TrajOpt merit/trust loop and actual nonlinear evaluation; each convexification fixes P/q/A and only its trust intervals vary across retries, and each subproblem, its domain rows elastic as TrajOpt's, is solved by the interior method, by the operator splitting where that leaves it unsolved. The penalty schedule and the stop are TrajOpt's sco defaults (`BasicTrustRegionSQP::initParameters`, trajopt src/sco/optimizers.cpp): the coefficient starts at `merit_error_coeff_` 10 and grows by `merit_coeff_increase_ratio_` 10 over at most `max_merit_coeff_increases_` 5 coefficients, and the solve stops raising it once every constraint is met to `cnt_tolerance_` 1e-4 m, 0.1 mm in this model's rows. The admission keeps the model's own millimetre.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

TrajectoryConvex owns rows, TrajectorySmooth the exact curvature, the quadratic program its interior solve, and the shared sequential-convex loop acceptance; one model shell holds a linearisation and gives its repriced and objective-free variants.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every model row, penalty, trust schedule and actual trial evaluation; no previous answer or relaxed feasibility supplies a result, and a subproblem the interior method leaves unsolved is solved by the operator splitting, never read as a zero step.

## @evidence contracts/development/implementation.md#efficient-algorithms

One linearisation per round serves the round's model, its repriced variants and the steering's objective-free model; the exact curvature is built once per solve; a subproblem costs a bounded number of banded factorisations. On a grid the rounds read the clearance at the knots and over the intervals between them through every frame (`HumanArmTrajectoryEvaluate`), TrajOpt's discrete collision terms at its timesteps with casts between them (Schulman et al. 2014, section IV-C), so the last reading is the admission and no full reading follows.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each iterate is read once and its record is what the merit and the convex model both take; the context's exact curvature and each model's trust rows are values built once by their owner and handed on; the solve's subproblems are one interior-point session (`HumanQuadraticInteriorSession`): the first one's variable and cost scales at a penalty serve every subproblem at that penalty, a subproblem at another penalty being equilibrated again and started cold since every soft row weighs the penalty, the solver's scratch serves them all, and the models of one linearisation at one penalty, which share its rows, start from the last one solved, a start that decides no answer; the violation-alone model, whose objective is not the model's, starts cold.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each convexification owns one numeric snapshot and bounded solver scratch until replacement or return; returned coordinates/evaluation remain independent and no trajectory/fit result history is cached.

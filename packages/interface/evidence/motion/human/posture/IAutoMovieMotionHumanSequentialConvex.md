# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex.IEvaluation

## @evidence contracts/development/common.md#meaningful-documentation

objective: the costs summed, sco's `vecSum(cost_vals)`. violation: the constraints' violations summed, `vecSum(cnt_viols)`, in the units the coefficient weighs. greatest: the greatest single constraint's violation, `vecMax(cnt_viols)`, zero without a constraint.

## @evidence contracts/development/design.md#principled-representation

The three numbers are exactly what trajopt's `BasicTrustRegionSQP::optimize` reads of an iterate (github.com/joschu/trajopt src/sco/optimizers.cpp at 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause): the two sums for the merit and the greatest for the penalty adjustment's `cnt_tolerance_` test.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise); posture/HumanArmOptimiser.ts (IReading); posture/HumanBodyFitMerit.ts (HumanBodyFitMerit.IEvaluation); lexicon/HumanCarriedCouplingFit.ts (IReading).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The fields and their units are declared here; each producer reports its own rows' sums and greatest, and the loop only compares them.

# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex.IStep

## @evidence contracts/development/common.md#meaningful-documentation

trial: the iterate the model's solution reaches, sco's `new_x`. merit: the model's merit at the solution, sco's `model_merit`, in the evaluation's absolute units. failed: whether the convex solver could not solve the model, sco's `status != CVX_SOLVED`.

## @evidence contracts/development/design.md#principled-representation

The loop needs the trial to evaluate exactly and the model merit to form `approx_merit_improve = old_merit - model_merit`, as optimizers.cpp lines 298-323 do; a failure ends the solve as `OPT_FAILED` (lines 291-297).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise, sqp); posture/HumanArmOptimiser.ts (shell, solve); posture/HumanBodyFit.ts (HumanBodyFit.fit, convexify); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.read, convexify).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The merit is the producer's model value at its own solution, never a relabelled decrease; a failed solve carries no step the loop would take.

# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex.IModel

## @evidence contracts/development/common.md#meaningful-documentation

solve: the model's solution inside a box about its iterate, sco's `setTrustBoxConstraints` followed by `model_->optimize()`, the box intersected with the variables' hard bounds.

## @evidence contracts/development/design.md#principled-representation

One convexification is solved again at each smaller box of the same iteration, as sco's trust-region loop re-solves one model (optimizers.cpp lines 286-360).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise, sqp); posture/HumanArmOptimiser.ts (shell); posture/HumanBodyFit.ts (HumanBodyFit.fit, convexify); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.read, convexify).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The model carries only its solve; how it builds and solves its program stays with its producer.

# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex.IProblem

## @evidence contracts/development/common.md#meaningful-documentation

closest: the point of the hard set nearest an iterate, sco's `OptProb::getClosestFeasiblePoint`. evaluate: an iterate's exact reading. convexify: the convex model about an iterate at a merit coefficient, sco's `convexifyCosts`, `convexifyConstraints` and `cntsToCosts`.

## @evidence contracts/development/design.md#principled-representation

These are the three things `BasicTrustRegionSQP::optimize` asks of its `OptProb` (optimizers.cpp lines 230, 246-247, 263-265), with sco's own signatures: a convexification takes the iterate alone, and a producer that screens collision terms does so at a fixed contact distance, as trajopt's does (`problem_description.cpp` line 549).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise, problem); posture/HumanArmOptimiser.ts (HumanArmOptimiser.optimise); posture/HumanBodyFit.ts (HumanBodyFit.fit); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.read).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IEvaluation and IModel identities used at the listed boundaries; projection, evaluation and convexification stay with each producer.

# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex.IParameters

## @evidence contracts/development/common.md#meaningful-documentation

The twelve members of sco's `BasicTrustRegionSQP` that `initParameters` sets (optimizers.cpp lines 158-176): improveRatioThreshold, minTrustBoxSize, minApproxImprove, minApproxImproveFrac, maxIter, trustShrinkRatio, trustExpandRatio, cntTolerance, maxMeritCoeffIncreases, meritCoeffIncreaseRatio, meritErrorCoeff and trustBoxSize, each in the problem's own units.

## @evidence contracts/development/design.md#principled-representation

trajopt's callers set these public members before `optimize`, as `OptimizeProblem` does (src/trajopt/problem_description.cpp lines 247-250); one record carries them so a caller passes its settings explicitly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.DEFAULTS, minimise); posture/HumanArmOptimiser.ts (TRAJECTORY); posture/HumanBodyFit.ts (HumanBodyFit.fit); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.read).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each field is sco's own member under its own meaning; units are the caller's problem's, stated at each caller that converts one.

# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex.Status

## @evidence contracts/development/common.md#meaningful-documentation

sco's `OptStatus`: converged (`OPT_CONVERGED`), scoIterationLimit (`OPT_SCO_ITERATION_LIMIT`), penaltyIterationLimit (`OPT_PENALTY_ITERATION_LIMIT`), failed (`OPT_FAILED`).

## @evidence contracts/development/design.md#principled-representation

Closed choices for the four ends `optimize` reaches (optimizers.cpp lines 296, 338-366, 369, 387).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise); posture/HumanBodyFit.ts (HumanBodyFit.fit, reason); lexicon/HumanCarriedCouplingFit.ts (the refusal's reason).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The literal values are declared here directly; which end a solve reaches is decided only in HumanSequentialConvex.minimise.

# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex.IResult

## @evidence contracts/development/common.md#meaningful-documentation

x: the last iterate taken, sco's `results_.x`. evaluation: its exact reading. status: how the solve ended, `results_.status`. coefficient: the merit coefficient it ended at, `merit_error_coeff_`.

## @evidence contracts/development/design.md#principled-representation

What sco leaves after `optimize`: its results and its coefficient member, which a continued solve may start from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise, return); posture/HumanArmOptimiser.ts (HumanArmOptimiser.optimise); posture/HumanBodyFit.ts (HumanBodyFit.fit); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.read).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical Status identity; refusal and admission stay with each caller's own reading.

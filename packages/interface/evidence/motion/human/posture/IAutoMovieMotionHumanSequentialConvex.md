# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex

## @evidence contracts/development/common.md#meaningful-documentation

accuracy: The model's own accuracy in the merit's units, below which a predicted decrease is not one and the solve settles without trying the step (the termination of an SQP on its subproblem's accuracy, Nocedal and Wright chapter 18); never settles so when absent. correct: The second-order correction of a rejected step, against the Maratos effect (Nocedal and Wright 2006, section 15.6, pp. 443-444): the step `p` plus a correction `p^` that meets the constraints' linearisation at the trial, `A(x) p^ + c(x + p) = 0` on the rows the step meets, its minimum-norm solution being their (15.36). Asked only for a step whose ratio did not exceed `ISchedule.eta` and whose predicted decrease is positive, once per step and before the region shrinks; the corrected point is judged on the step's own predicted decrease, taken where its ratio exceeds `eta` and dropped otherwise, never searched along (their Algorithm 15.2, p. 443, in the trust region of their Algorithm 18.4, p. 549). Absent, no correction is tried. from: The penalty to start at, a solve continued from another's result (`IResult.penalty`); the first when absent.

## @evidence contracts/development/design.md#principled-representation

accuracy: The model's own accuracy in the merit's units, below which a predicted decrease is not one and the solve settles without trying the step (the termination of an SQP on its subproblem's accuracy, Nocedal and Wright chapter 18); never settles so when absent. correct: The second-order correction of a rejected step, against the Maratos effect (Nocedal and Wright 2006, section 15.6, pp. 443-444): the step `p` plus a correction `p^` that meets the constraints' linearisation at the trial, `A(x) p^ + c(x + p) = 0` on the rows the step meets, its minimum-norm solution being their (15.36). Asked only for a step whose ratio did not exceed `ISchedule.eta` and whose predicted decrease is positive, once per step and before the region shrinks; the corrected point is judged on the step's own predicted decrease, taken where its ratio exceeds `eta` and dropped otherwise, never searched along (their Algorithm 15.2, p. 443, in the trust region of their Algorithm 18.4, p. 549). Absent, no correction is tried. from: The penalty to start at, a solve continued from another's result (`IResult.penalty`); the first when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise, problem); posture/HumanSequentialConvex.ts (HumanSequentialConvex.steering, problem); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.fit.solved, return); posture/HumanArmOptimiser.ts (HumanArmOptimiser.optimise.problem, return); posture/HumanBodyFit.ts (HumanBodyFit.fit.problem, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Caller-owned iterates and evaluations remain generic because the same algorithm solves arm trajectories, stance courses and static body fits; no SDK object is hidden by these parameters.

# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex.IEvaluation

## @evidence contracts/development/common.md#meaningful-documentation

objective: The objective. violation: The constraints' violations summed, in the units the penalty weighs.

## @evidence contracts/development/design.md#principled-representation

objective: The objective. violation: The constraints' violations summed, in the units the penalty weighs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise); posture/HumanSequentialConvex.ts (HumanSequentialConvex.steering).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanSequentialConvex.minimise.

# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex.IStep

## @evidence contracts/development/common.md#meaningful-documentation

accuracy: The model's own accuracy in the merit's units, below which a predicted decrease is not one and the solve settles without trying the step (the termination of an SQP on its subproblem's accuracy, Nocedal and Wright chapter 18); never settles so when absent.

## @evidence contracts/development/design.md#principled-representation

accuracy: The model's own accuracy in the merit's units, below which a predicted decrease is not one and the solve settles without trying the step (the termination of an SQP on its subproblem's accuracy, Nocedal and Wright chapter 18); never settles so when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.fit.solved, return); posture/HumanArmOptimiser.ts (HumanArmOptimiser.optimise.problem, return); posture/HumanBodyFit.ts (HumanBodyFit.fit.problem, _step); posture/HumanBodyFit.ts (HumanBodyFit.fit.problem, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

trial preserves the caller's iterate type, predicted is model merit decrease and length is in trust-region units; none is relabelled as a physical residual.

# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex.IModel

## @evidence contracts/development/common.md#meaningful-documentation

solve: The model's step within a region. taken: Told that the last step solved was taken, so the caller's next model can start from its solution (its multipliers, for one).

## @evidence contracts/development/design.md#principled-representation

solve: The model's step within a region. taken: Told that the last step solved was taken, so the caller's next model can start from its solution (its multipliers, for one).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.fit.solved, return); posture/HumanArmOptimiser.ts (HumanArmOptimiser.optimise.problem, return); posture/HumanBodyFit.ts (HumanBodyFit.fit.problem, return); posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt.problem, return); posture/HumanSequentialConvex.ts (HumanSequentialConvex.steering, first).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanSequentialConvex.IStep identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex.IProblem

## @evidence contracts/development/common.md#meaningful-documentation

correct: The second-order correction of a rejected step, against the Maratos effect (Nocedal and Wright 2006, section 15.6, pp. 443-444): the step `p` plus a correction `p^` that meets the constraints' linearisation at the trial, `A(x) p^ + c(x + p) = 0` on the rows the step meets, its minimum-norm solution being their (15.36). Asked only for a step whose ratio did not exceed `ISchedule.eta` and whose predicted decrease is positive, once per step and before the region shrinks; the corrected point is judged on the step's own predicted decrease, taken where its ratio exceeds `eta` and dropped otherwise, never searched along (their Algorithm 15.2, p. 443, in the trust region of their Algorithm 18.4, p. 549). Absent, no correction is tried.

## @evidence contracts/development/design.md#principled-representation

correct: The second-order correction of a rejected step, against the Maratos effect (Nocedal and Wright 2006, section 15.6, pp. 443-444): the step `p` plus a correction `p^` that meets the constraints' linearisation at the trial, `A(x) p^ + c(x + p) = 0` on the rows the step meets, its minimum-norm solution being their (15.36). Asked only for a step whose ratio did not exceed `ISchedule.eta` and whose predicted decrease is positive, once per step and before the region shrinks; the corrected point is judged on the step's own predicted decrease, taken where its ratio exceeds `eta` and dropped otherwise, never searched along (their Algorithm 15.2, p. 443, in the trust region of their Algorithm 18.4, p. 549). Absent, no correction is tried.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise, problem); posture/HumanSequentialConvex.ts (HumanSequentialConvex.steering, problem); posture/HumanArmOptimiser.ts (HumanArmOptimiser.optimise); posture/HumanBodyFit.ts (HumanBodyFit.fit); posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanSequentialConvex.IEvaluation, IAutoMovieMotionHumanSequentialConvex.IModel, IAutoMovieMotionHumanSequentialConvex.IStep identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex.Reason

## @evidence contracts/development/common.md#meaningful-documentation

Why a solve stopped, read off its last convexification: `model`, the model's predicted decrease under `ISchedule.improved` or within its own accuracy (`IStep.accuracy`); `step`, a step taken under `ISchedule.least`, or a rejected proposal under it at an already feasible iterate (numerical no progress, not a stationarity certificate); `collapsed`, no step taken, the region fallen under `ISchedule.least` or the tries spent; `rounds`, the convexifications ran out (`IOptions.rounds`) with steps still being taken; `infeasible`, a steered iterate whose step of the violation alone, inside its region, reduces the violation by no more than `IOptions.stationary` while it violates by more; `failed`, a subproblem its solver could not solve (`IStep.failed`).

## @evidence contracts/development/design.md#principled-representation

Closed choices "model", "step", "collapsed", "rounds", "infeasible", "failed" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanSequentialConvex.minimise.

# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex.ISchedule

## @evidence contracts/development/common.md#meaningful-documentation

eta: The ratio a step must exceed to be taken. low: The ratio below which a step taken shrinks the region. high: The ratio above which a step taken grows the region.

## @evidence contracts/development/design.md#principled-representation

eta: The ratio a step must exceed to be taken. low: The ratio below which a step taken shrinks the region. high: The ratio above which a step taken grows the region.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmOptimiser.ts (SCHEDULE); posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanSequentialConvex.minimise.

# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

from: The penalty to start at, a solve continued from another's result (`IResult.penalty`); the first when absent. radius: The region's first half-width, a solve following another of the same kind (`IResult.radius`); `ISchedule.trust` when absent. steer: Whether the penalty is steered (Byrd, Nocedal and Waltz 2008, "Steering exact penalty methods for nonlinear programming", Optim Methods Softw 23:197; Algorithm 5.1, p. 11 of the 2007 technical report): each round, where the step at the penalty leaves the linearised constraints violated (`IStep.met`), the step of the violation alone (the model without the objective, their (5.10)) sets the progress a step can make; the penalty grows by `STEERING.increase` until the step meets the linearised constraints where that one does, or else reduces their violation by at least `STEERING.feasibility` of what that one does (their (5.13), p. 10), and then until the model's decrease is at least `STEERING.merit` times the penalty times the step's reduction of the violation (their (5.14), p. 10). The penalty is then tied to the problem at every iterate, so a start the constraints' linearisation cannot satisfy is not pulled off them by the objective, and the steps keep their progress on feasibility. With it, `penalties` gives only the first penalty and `from` a continued one. False when absent.

## @evidence contracts/development/design.md#principled-representation

from: The penalty to start at, a solve continued from another's result (`IResult.penalty`); the first when absent. radius: The region's first half-width, a solve following another of the same kind (`IResult.radius`); `ISchedule.trust` when absent. steer: Whether the penalty is steered (Byrd, Nocedal and Waltz 2008, "Steering exact penalty methods for nonlinear programming", Optim Methods Softw 23:197; Algorithm 5.1, p. 11 of the 2007 technical report): each round, where the step at the penalty leaves the linearised constraints violated (`IStep.met`), the step of the violation alone (the model without the objective, their (5.10)) sets the progress a step can make; the penalty grows by `STEERING.increase` until the step meets the linearised constraints where that one does, or else reduces their violation by at least `STEERING.feasibility` of what that one does (their (5.13), p. 10), and then until the model's decrease is at least `STEERING.merit` times the penalty times the step's reduction of the violation (their (5.14), p. 10). The penalty is then tied to the problem at every iterate, so a start the constraints' linearisation cannot satisfy is not pulled off them by the objective, and the steps keep their progress on feasibility. With it, `penalties` gives only the first penalty and `from` a continued one. False when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise, options).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanSequentialConvex.ISchedule identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanSequentialConvex.ts#IAutoMovieMotionHumanSequentialConvex.IResult

## @evidence contracts/development/common.md#meaningful-documentation

x: The last iterate taken. evaluation: Its reading. penalty: The penalty it was reached at.

## @evidence contracts/development/design.md#principled-representation

x: The last iterate taken. evaluation: Its reading. penalty: The penalty it was reached at.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise, return); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.fit); posture/HumanArmOptimiser.ts (HumanArmOptimiser.optimise); posture/HumanBodyFit.ts (HumanBodyFit.fit); posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanSequentialConvex.Reason identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

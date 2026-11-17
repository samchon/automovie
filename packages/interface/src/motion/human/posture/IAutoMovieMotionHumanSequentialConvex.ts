/**
 * Penalty sequential convex optimisation with a trust region, the outer loop
 * of TrajOpt (Schulman et al. 2014, "Motion planning with sequential convex
 * optimization and convex collision checking", IJRR 33:1251, Algorithm 1)
 * over any iterate: the caller convexifies its problem about an iterate at a
 * penalty and solves the convex model within a region; this loop takes or
 * rejects the step by the ratio of the merit's actual to its predicted
 * decrease, moves the region by the caller's schedule (`ISchedule`), and
 * raises the penalty along the caller's ladder while the constraints are not
 * met, or steers it at every iterate (`IOptions.steer`). The merit is the objective plus the penalty times the constraints'
 * summed violation, the l1 exact penalty (Nocedal and Wright 2006,
 * "Numerical Optimization", 2nd ed., section 17.2). A problem still
 * infeasible at the last penalty is left to the caller to refuse by its own
 * reading.
 *
 * @evidence contracts/development/common.md#meaningful-documentation accuracy: The model's own accuracy in the merit's units, below which a predicted decrease is not one and the solve settles without trying the step (the termination of an SQP on its subproblem's accuracy, Nocedal and Wright chapter 18); never settles so when absent. correct: The second-order correction of a rejected step, against the Maratos effect (Nocedal and Wright 2006, section 15.6, pp. 443-444): the step `p` plus a correction `p^` that meets the constraints' linearisation at the trial, `A(x) p^ + c(x + p) = 0` on the rows the step meets, its minimum-norm solution being their (15.36). Asked only for a step whose ratio did not exceed `ISchedule.eta` and whose predicted decrease is positive, once per step and before the region shrinks; the corrected point is judged on the step's own predicted decrease, taken where its ratio exceeds `eta` and dropped otherwise, never searched along (their Algorithm 15.2, p. 443, in the trust region of their Algorithm 18.4, p. 549). Absent, no correction is tried. from: The penalty to start at, a solve continued from another's result (`IResult.penalty`); the first when absent.
 * @evidence contracts/development/design.md#principled-representation accuracy: The model's own accuracy in the merit's units, below which a predicted decrease is not one and the solve settles without trying the step (the termination of an SQP on its subproblem's accuracy, Nocedal and Wright chapter 18); never settles so when absent. correct: The second-order correction of a rejected step, against the Maratos effect (Nocedal and Wright 2006, section 15.6, pp. 443-444): the step `p` plus a correction `p^` that meets the constraints' linearisation at the trial, `A(x) p^ + c(x + p) = 0` on the rows the step meets, its minimum-norm solution being their (15.36). Asked only for a step whose ratio did not exceed `ISchedule.eta` and whose predicted decrease is positive, once per step and before the region shrinks; the corrected point is judged on the step's own predicted decrease, taken where its ratio exceeds `eta` and dropped otherwise, never searched along (their Algorithm 15.2, p. 443, in the trust region of their Algorithm 18.4, p. 549). Absent, no correction is tried. from: The penalty to start at, a solve continued from another's result (`IResult.penalty`); the first when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise, problem); posture/HumanSequentialConvex.ts (HumanSequentialConvex.steering, problem); actions/walkStanceSolve.ts (walkStanceSolve.optimise.problem, return); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.fit.solved, return); posture/HumanArmOptimiser.ts (HumanArmOptimiser.optimise.problem, return); posture/HumanBodyFit.ts (HumanBodyFit.fit.problem, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Caller-owned iterates and evaluations remain generic because the same algorithm solves arm trajectories, stance courses and static body fits; no SDK object is hidden by these parameters.
 */
export namespace IAutoMovieMotionHumanSequentialConvex {
  /**
   * An iterate's reading: the merit's two parts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation objective: The objective. violation: The constraints' violations summed, in the units the penalty weighs.
   * @evidence contracts/development/design.md#principled-representation objective: The objective. violation: The constraints' violations summed, in the units the penalty weighs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise); posture/HumanSequentialConvex.ts (HumanSequentialConvex.steering).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanSequentialConvex.minimise.
   */
  export interface IEvaluation {
    /** The objective. */
    objective: number;

    /** The constraints' violations summed, in the units the penalty weighs. */
    violation: number;
  }

  /**
   * The convex model's step within a region.
   *
   * @evidence contracts/development/common.md#meaningful-documentation accuracy: The model's own accuracy in the merit's units, below which a predicted decrease is not one and the solve settles without trying the step (the termination of an SQP on its subproblem's accuracy, Nocedal and Wright chapter 18); never settles so when absent.
   * @evidence contracts/development/design.md#principled-representation accuracy: The model's own accuracy in the merit's units, below which a predicted decrease is not one and the solve settles without trying the step (the termination of an SQP on its subproblem's accuracy, Nocedal and Wright chapter 18); never settles so when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStanceSolve.ts (walkStanceSolve.optimise.problem, return); actions/walkStanceSolve.ts (walkStanceSolve.optimise.problem, step); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.fit.solved, return); posture/HumanArmOptimiser.ts (HumanArmOptimiser.optimise.problem, return); posture/HumanBodyFit.ts (HumanBodyFit.fit.problem, _step); posture/HumanBodyFit.ts (HumanBodyFit.fit.problem, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts trial preserves the caller's iterate type, predicted is model merit decrease and length is in trust-region units; none is relabelled as a physical residual.
   */
  export interface IStep<X> {
    /** The iterate reached, projected onto the caller's hard set; may be lazy and select its proposal-local correction metadata. Steering reads only diagnostics; the outer loop reads the chosen trial before its evaluation and correction. */
    trial: X;

    /** The model's decrease of the merit from the iterate to the step, `m(0) - m(p)`. */
    predicted: number;

    /** The step's largest coordinate, in the region's units. */
    length: number;

    /** Whether the step reaches the region's boundary, where a schedule that grows only there (`ISchedule.boundary`) grows. */
    full: boolean;

    /** The violation of the linearised constraints at the step, in the units the penalty weighs, the model's own; the steering reads it (`IOptions.steer`). */
    violation?: number;

    /** Whether the step meets the linearised constraints to the caller's tolerance, the steering's linear feasibility (`IOptions.steer`). */
    met?: boolean;

    /** The model's own accuracy in the merit's units, below which a predicted decrease is not one and the solve settles without trying the step (the termination of an SQP on its subproblem's accuracy, Nocedal and Wright chapter 18); never settles so when absent. */
    accuracy?: number;
  }

  /**
   * A convex model of the merit about an iterate, at one penalty.
   *
   * @evidence contracts/development/common.md#meaningful-documentation solve: The model's step within a region. taken: Told that the last step solved was taken, so the caller's next model can start from its solution (its multipliers, for one).
   * @evidence contracts/development/design.md#principled-representation solve: The model's step within a region. taken: Told that the last step solved was taken, so the caller's next model can start from its solution (its multipliers, for one).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStanceSolve.ts (walkStanceSolve.optimise.problem, return); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.fit.solved, return); posture/HumanArmOptimiser.ts (HumanArmOptimiser.optimise.problem, return); posture/HumanBodyFit.ts (HumanBodyFit.fit.problem, return); posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt.problem, return); posture/HumanSequentialConvex.ts (HumanSequentialConvex.steering, first).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanSequentialConvex.IStep identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IModel<X> {
    /**
     * The model's step within a region.
     *
     * @param radius The region's half-width, in the caller's units.
     * @returns The step.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanSequentialConvex.IModel.solve: The model's step within a region.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSequentialConvex.IModel.solve is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSequentialConvex.IModel.solve is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSequentialConvex.IModel.solve is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSequentialConvex.IModel.solve is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSequentialConvex.IModel.solve is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSequentialConvex.IModel.solve is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     */
    solve(radius: number): IAutoMovieMotionHumanSequentialConvex.IStep<X>;

    /**
     * Told that the last step solved was taken, so the caller's next model can start from its solution (its multipliers, for one).
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanSequentialConvex.IModel.taken: Told that the last step solved was taken, so the caller's next model can start from its solution (its multipliers, for one).
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSequentialConvex.IModel.taken is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSequentialConvex.IModel.taken is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSequentialConvex.IModel.taken is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSequentialConvex.IModel.taken is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSequentialConvex.IModel.taken is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSequentialConvex.IModel.taken is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     */
    taken?(): void;

    /**
     * Reprice this same fixed linearization for steering, without rebuilding
     * its geometry or matrices. Absent, convexify rebuilds the model.
     *
     * @param penalty The new exact l1 penalty, at the same iterate/objective and row domain.
     * @returns A fresh model shell with the original cold/keyed-dual initialization; fixed numeric preparation may be shared sequentially.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Changes only the exact l1 row prices of one unchanged linearization, the same model that convexify would build at this penalty; producers with penalty-dependent geometry or curvature omit this method.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The producer owns its weight formula and fixed numeric data; steering selects this factory when available and otherwise invokes its existing convexify callback.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Requires the same x/objective/domain and original weight calculation, preserves cold/keyed-dual initialization in each new shell, and never substitutes an old step, radius or convergence decision.
     * @evidence contracts/development/implementation.md#efficient-algorithms Adds O(1) coordinator selection; the stance producer reprices O(m) rows instead of repeating geometric linearization and matrix preparation for m rows, then performs the actual current QP solve.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The producer proves fixed P/q/A and row order while current prices change; immutable preparation and bounded scratch may be shared, but every new model resets its local warm state and recomputes each step.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Repriced shells share only their current linearization's owned data, with no linked model history; the loop releases them when it advances or finishes and each producer owns its bounded preparation/scratch lifetime.
     * @evidence contracts/development/common.md#meaningful-documentation States optional fallback, exact dependency premises, changed penalty, fresh warm-state shell and shared-data ownership.
     */
    reprice?(penalty: number): IAutoMovieMotionHumanSequentialConvex.IModel<X>;

    /**
     * This same linearisation at this same penalty without the objective,
     * the model of the steering's step of the violation alone (their
     * (5.10)), for a producer whose rows do not depend on the objective.
     * Absent, the steering asks `IProblem.convexify` for it.
     *
     * @returns The model of the violation alone, with its own cold start.
     *
     * @evidence contracts/development/implementation.md#principled-implementation The violation's model is the merit's model less the objective's terms; a producer that built the rows once states that by giving the model itself.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The producer owns its rows; the steering selects this member when given and its convexify callback otherwise.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same iterate, penalty, rows and region; only the objective's curvature and gradient are left out, and no step or decision is carried over.
     * @evidence contracts/development/implementation.md#efficient-algorithms O(1) selection here; the producer skips a second linearisation of the same iterate.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The linearisation is the producer's value, handed on by the model that holds it, not found again by comparing iterates.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned model shares only its linearisation's data and is released with the round.
     * @evidence contracts/development/common.md#meaningful-documentation States what the model is, when it may be given and the fallback.
     */
    feasibility?(): IAutoMovieMotionHumanSequentialConvex.IModel<X>;
  }

  /**
   * The problem, as the caller reads it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation correct: The second-order correction of a rejected step, against the Maratos effect (Nocedal and Wright 2006, section 15.6, pp. 443-444): the step `p` plus a correction `p^` that meets the constraints' linearisation at the trial, `A(x) p^ + c(x + p) = 0` on the rows the step meets, its minimum-norm solution being their (15.36). Asked only for a step whose ratio did not exceed `ISchedule.eta` and whose predicted decrease is positive, once per step and before the region shrinks; the corrected point is judged on the step's own predicted decrease, taken where its ratio exceeds `eta` and dropped otherwise, never searched along (their Algorithm 15.2, p. 443, in the trust region of their Algorithm 18.4, p. 549). Absent, no correction is tried.
   * @evidence contracts/development/design.md#principled-representation correct: The second-order correction of a rejected step, against the Maratos effect (Nocedal and Wright 2006, section 15.6, pp. 443-444): the step `p` plus a correction `p^` that meets the constraints' linearisation at the trial, `A(x) p^ + c(x + p) = 0` on the rows the step meets, its minimum-norm solution being their (15.36). Asked only for a step whose ratio did not exceed `ISchedule.eta` and whose predicted decrease is positive, once per step and before the region shrinks; the corrected point is judged on the step's own predicted decrease, taken where its ratio exceeds `eta` and dropped otherwise, never searched along (their Algorithm 15.2, p. 443, in the trust region of their Algorithm 18.4, p. 549). Absent, no correction is tried.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise, problem); posture/HumanSequentialConvex.ts (HumanSequentialConvex.steering, problem); actions/walkStanceSolve.ts (walkStanceSolve.optimise); posture/HumanArmOptimiser.ts (HumanArmOptimiser.optimise); posture/HumanBodyFit.ts (HumanBodyFit.fit); posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanSequentialConvex.IEvaluation, IAutoMovieMotionHumanSequentialConvex.IModel, IAutoMovieMotionHumanSequentialConvex.IStep identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IProblem<
    X,
    E extends IAutoMovieMotionHumanSequentialConvex.IEvaluation,
  > {
    /**
     * An iterate's reading.
     *
     * @param x The iterate.
     * @returns Its objective and violation, and whatever else the caller reads.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanSequentialConvex.IProblem.evaluate: An iterate's reading.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSequentialConvex.IProblem.evaluate is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSequentialConvex.IProblem.evaluate is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSequentialConvex.IProblem.evaluate is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSequentialConvex.IProblem.evaluate is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSequentialConvex.IProblem.evaluate is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSequentialConvex.IProblem.evaluate is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     */
    evaluate(x: X): E;

    /**
     * The convex model about an iterate: the caller's own subproblem, solved
     * by whatever inner solve it chooses.
     *
     * @param x The iterate.
     * @param evaluation Its reading.
     * @param penalty The penalty's weight.
     * @param radius The region the model is next solved within, the widest of the round.
     * @param objective Whether the model holds the objective; false for the steering's step of the violation alone (`IOptions.steer`).
     * @returns The model.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanSequentialConvex.IProblem.convexify: The convex model about an iterate: the caller's own subproblem, solved by whatever inner solve it chooses.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSequentialConvex.IProblem.convexify is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSequentialConvex.IProblem.convexify is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSequentialConvex.IProblem.convexify is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSequentialConvex.IProblem.convexify is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSequentialConvex.IProblem.convexify is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSequentialConvex.IProblem.convexify is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     */
    convexify(
      x: X,
      evaluation: E,
      penalty: number,
      radius: number,
      objective: boolean,
    ): IAutoMovieMotionHumanSequentialConvex.IModel<X>;

    /**
     * Whether a reading meets the constraints, to the caller's tolerance.
     *
     * @param evaluation The reading.
     * @returns Whether it is feasible.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanSequentialConvex.IProblem.feasible: Whether a reading meets the constraints, to the caller's tolerance.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSequentialConvex.IProblem.feasible is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSequentialConvex.IProblem.feasible is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSequentialConvex.IProblem.feasible is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSequentialConvex.IProblem.feasible is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSequentialConvex.IProblem.feasible is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSequentialConvex.IProblem.feasible is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     */
    feasible(evaluation: E): boolean;

    /**
     * The second-order correction of a rejected step, against the Maratos
     * effect (Nocedal and Wright 2006, section 15.6, pp. 443-444): the step
     * `p` plus a correction `p^` that meets the constraints' linearisation at
     * the trial, `A(x) p^ + c(x + p) = 0` on the rows the step meets, its
     * minimum-norm solution being their (15.36). Asked only for a step whose
     * ratio did not exceed `ISchedule.eta` and whose predicted decrease is
     * positive, once per step and before the region shrinks; the corrected
     * point is judged on the step's own predicted decrease, taken where its
     * ratio exceeds `eta` and dropped otherwise, never searched along
     * (their Algorithm 15.2, p. 443, in the trust region of their Algorithm
     * 18.4, p. 549). Absent, no correction is tried.
     *
     * @param x The iterate.
     * @param step The rejected step.
     * @param trial The reading at the step's trial.
     * @returns The corrected point `x + p + p^`, or null where the caller has none.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanSequentialConvex.IProblem.correct: The second-order correction of a rejected step, against the Maratos effect (Nocedal and Wright 2006, section 15.6, pp. 443-444): the step `p` plus a correction `p^` that meets the constraints' linearisation at the trial, `A(x) p^ + c(x + p) = 0` on the rows the step meets, its minimum-norm solution being their (15.36). Asked only for a step whose ratio did not exceed `ISchedule.eta` and whose predicted decrease is positive, once per step and before the region shrinks; the corrected point is judged on the step's own predicted decrease, taken where its ratio exceeds `eta` and dropped otherwise, never searched along (their Algorithm 15.2, p. 443, in the trust region of their Algorithm 18.4, p. 549). Absent, no correction is tried.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSequentialConvex.IProblem.correct is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSequentialConvex.IProblem.correct is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSequentialConvex.IProblem.correct is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSequentialConvex.IProblem.correct is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSequentialConvex.IProblem.correct is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSequentialConvex.IProblem.correct is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     */
    correct?(
      x: X,
      step: IAutoMovieMotionHumanSequentialConvex.IStep<X>,
      trial: E,
    ): X | null;
  }

  /**
   * Why a solve stopped, read off its last convexification: `model`, the
   * model's predicted decrease under `ISchedule.improved` or within its own
   * accuracy (`IStep.accuracy`); `step`, a step taken under
   * `ISchedule.least`, or a rejected proposal under it at an already feasible
   * iterate (numerical no progress, not a stationarity certificate);
   * `collapsed`, no step taken, the region fallen under
   * `ISchedule.least` or the tries spent; `rounds`, the convexifications ran
   * out (`IOptions.rounds`) with steps still being taken.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Why a solve stopped, read off its last convexification: `model`, the model's predicted decrease under `ISchedule.improved` or within its own accuracy (`IStep.accuracy`); `step`, a step taken under `ISchedule.least`, or a rejected proposal under it at an already feasible iterate (numerical no progress, not a stationarity certificate); `collapsed`, no step taken, the region fallen under `ISchedule.least` or the tries spent; `rounds`, the convexifications ran out (`IOptions.rounds`) with steps still being taken.
   * @evidence contracts/development/design.md#principled-representation Closed choices "model", "step", "collapsed", "rounds" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanSequentialConvex.minimise.
   */
  export type Reason = "model" | "step" | "collapsed" | "rounds";

  /**
   * How the region moves: a step is taken where the ratio of the actual to
   * the predicted decrease exceeds `eta`, and the region shrinks by `shrink`
   * on every step not taken, at most `tries` times a convexification; a
   * step taken shrinks the region where its ratio is below `low` and grows
   * it by `expand`, to `widest`, where its ratio exceeds `high` (on a step at
   * the boundary when `boundary` holds), Nocedal and Wright's Algorithm 4.1
   * in its general form.
   *
   * @evidence contracts/development/common.md#meaningful-documentation eta: The ratio a step must exceed to be taken. low: The ratio below which a step taken shrinks the region. high: The ratio above which a step taken grows the region.
   * @evidence contracts/development/design.md#principled-representation eta: The ratio a step must exceed to be taken. low: The ratio below which a step taken shrinks the region. high: The ratio above which a step taken grows the region.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStanceTerms.ts (walkStanceTerms.schedule, return); posture/HumanArmOptimiser.ts (SCHEDULE); posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in walkStanceTerms.schedule.
   */
  export interface ISchedule {
    /** The ratio a step must exceed to be taken. */
    eta: number;

    /** The ratio below which a step taken shrinks the region. */
    low: number;

    /** The ratio above which a step taken grows the region. */
    high: number;

    /** The region's factor where it shrinks. */
    shrink: number;

    /** The region's factor where it grows. */
    expand: number;

    /** Whether the region grows only on a step that reaches its boundary. */
    boundary: boolean;

    /** The widest the region grows. */
    widest: number;

    /** The region's first half-width, set again at each penalty. */
    trust: number;

    /** A region or a step below which the solve has settled. */
    least: number;

    /** Steps tried per convexification at most, the region shrinking between them. */
    tries: number;

    /**
     * The predicted decrease below which the solve has settled.
     *
     * @param merit The merit at the iterate.
     * @returns The decrease.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanSequentialConvex.ISchedule.improved: The predicted decrease below which the solve has settled.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSequentialConvex.ISchedule.improved is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSequentialConvex.ISchedule.improved is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSequentialConvex.ISchedule.improved is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSequentialConvex.ISchedule.improved is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSequentialConvex.ISchedule.improved is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSequentialConvex.ISchedule.improved is used through packages/motions/src/posture/HumanSequentialConvex.ts.
     */
    improved: (merit: number) => number;
  }

  /**
   * Minimise from an iterate. What a solve is run with.
   *
   * @evidence contracts/development/common.md#meaningful-documentation from: The penalty to start at, a solve continued from another's result (`IResult.penalty`); the first when absent. radius: The region's first half-width, a solve following another of the same kind (`IResult.radius`); `ISchedule.trust` when absent. steer: Whether the penalty is steered (Byrd, Nocedal and Waltz 2008, "Steering exact penalty methods for nonlinear programming", Optim Methods Softw 23:197; Algorithm 5.1, p. 11 of the 2007 technical report): each round, where the step at the penalty leaves the linearised constraints violated (`IStep.met`), the step of the violation alone (the model without the objective, their (5.10)) sets the progress a step can make; the penalty grows by `STEERING.increase` until the step meets the linearised constraints where that one does, or else reduces their violation by at least `STEERING.feasibility` of what that one does (their (5.13), p. 10), and then until the model's decrease is at least `STEERING.merit` times the penalty times the step's reduction of the violation (their (5.14), p. 10). The penalty is then tied to the problem at every iterate, so a start the constraints' linearisation cannot satisfy is not pulled off them by the objective, and the steps keep their progress on feasibility. With it, `penalties` gives only the first penalty and `from` a continued one. False when absent.
   * @evidence contracts/development/design.md#principled-representation from: The penalty to start at, a solve continued from another's result (`IResult.penalty`); the first when absent. radius: The region's first half-width, a solve following another of the same kind (`IResult.radius`); `ISchedule.trust` when absent. steer: Whether the penalty is steered (Byrd, Nocedal and Waltz 2008, "Steering exact penalty methods for nonlinear programming", Optim Methods Softw 23:197; Algorithm 5.1, p. 11 of the 2007 technical report): each round, where the step at the penalty leaves the linearised constraints violated (`IStep.met`), the step of the violation alone (the model without the objective, their (5.10)) sets the progress a step can make; the penalty grows by `STEERING.increase` until the step meets the linearised constraints where that one does, or else reduces their violation by at least `STEERING.feasibility` of what that one does (their (5.13), p. 10), and then until the model's decrease is at least `STEERING.merit` times the penalty times the step's reduction of the violation (their (5.14), p. 10). The penalty is then tied to the problem at every iterate, so a start the constraints' linearisation cannot satisfy is not pulled off them by the objective, and the steps keep their progress on feasibility. With it, `penalties` gives only the first penalty and `from` a continued one. False when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise, options).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanSequentialConvex.ISchedule identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IOptions {
    /** The region's schedule. */
    schedule: IAutoMovieMotionHumanSequentialConvex.ISchedule;

    /** The penalties, ascending, each tried while the constraints are not met at the one before. */
    penalties: readonly number[];

    /** Convexifications per penalty at most. */
    rounds: number;

    /** The penalty to start at, a solve continued from another's result (`IResult.penalty`); the first when absent. */
    from?: number;

    /** The region's first half-width, a solve following another of the same kind (`IResult.radius`); `ISchedule.trust` when absent. */
    radius?: number;

    /**
     * Whether the penalty is steered (Byrd, Nocedal and Waltz 2008, "Steering
     * exact penalty methods for nonlinear programming", Optim Methods Softw
     * 23:197; Algorithm 5.1, p. 11 of the 2007 technical report): each round,
     * where the step at the penalty leaves the linearised constraints
     * violated (`IStep.met`), the step of the violation alone (the model
     * without the objective, their (5.10)) sets the progress a step can make;
     * the penalty grows by `STEERING.increase` until the step meets the
     * linearised constraints where that one does, or else reduces their
     * violation by at least `STEERING.feasibility` of what that one does
     * (their (5.13), p. 10), and then until the model's decrease is at least
     * `STEERING.merit` times the penalty times the step's reduction of the
     * violation (their (5.14), p. 10). The penalty is then tied to the
     * problem at every iterate, so a start the constraints' linearisation
     * cannot satisfy is not pulled off them by the objective, and the steps
     * keep their progress on feasibility. With it, `penalties` gives only the
     * first penalty and `from` a continued one. False when absent.
     */
    steer?: boolean;

    /** The greatest penalty the steering may reach: a growth that would pass it is not made, and the round goes on with the step at the penalty reached, as it does when `STEERING.increases` are spent. Unbounded when absent; read only with `steer`. */
    ceiling?: number;
  }

  /**
   * Minimise from an iterate. A solve's result.
   *
   * @evidence contracts/development/common.md#meaningful-documentation x: The last iterate taken. evaluation: Its reading. penalty: The penalty it was reached at.
   * @evidence contracts/development/design.md#principled-representation x: The last iterate taken. evaluation: Its reading. penalty: The penalty it was reached at.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanSequentialConvex.ts (HumanSequentialConvex.minimise, return); actions/walkStanceSolve.ts (walkStanceSolve.optimise); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.fit); posture/HumanArmOptimiser.ts (HumanArmOptimiser.optimise); posture/HumanBodyFit.ts (HumanBodyFit.fit); posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanSequentialConvex.Reason identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IResult<X, E> {
    /** The last iterate taken. */
    x: X;

    /** Its reading. */
    evaluation: E;

    /** The penalty it was reached at. */
    penalty: number;

    /** The region it ended with, which a following solve of the same kind may start from (`IOptions.radius`). */
    radius: number;

    /** Whether the last convexification ended with no step taken, its region fallen below `ISchedule.least` or its tries spent, rather than on the model's own accuracy. */
    collapsed: boolean;

    /** Why the solve stopped (`Reason`). */
    reason: IAutoMovieMotionHumanSequentialConvex.Reason;

    /**
     * Whether a convergence test with the region open ended the solve, its
     * reason `model` or `step`; a collapsed region and spent rounds are
     * not, so a caller can tell a solve that converged from one a cap or a
     * collapse stopped.
     */
    settled: boolean;
  }
}

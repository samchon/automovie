/**
 * Status and signed witnesses for an explicitly coupled target interval.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Groups the interval identity, convergence and refusal data.
 * @evidence contracts/development/design.md#principled-representation Separates measured target fit from solver contact and displayed physical motion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A completed simulation exposes only successful report rows. Errors carry failures.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Diagnostic records carry no candidate motor goals or achieved force claims.
 */
export namespace IAutoMoviePhysicalCoupledTargetFit {
  /**
   * Stable identity of one admitted output interval and its group.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines sampled step, group and member order.
   * @evidence contracts/development/design.md#principled-representation The cache clock identifies the same interval for both fitted participants.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One step and one group tag the report and its failures.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Membership is explicit at the sampled step.
   */
  export interface IInterval {
    /** Output interval index. Frame zero seeds the simulation. */
    readonly step: number;
    /** Exact authored group id. Empty when a malformed label cannot be named. */
    readonly group: string;
    /** Body ids sorted by ordinal string order. */
    readonly members: readonly string[];
  }

  /**
   * Signed residual of one admitted binding or point constraint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States body ownership, relationship identity and component units.
   * @evidence contracts/development/design.md#principled-representation A body-scoped relation id disambiguates equal local ids in the same group.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Retains components for comparison against independent geometry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A satisfied separation reports zero violation.
   */
  export interface IWitness {
    readonly body: string;
    readonly id: string;
    readonly kind: "binding" | "point";
    /** Signed components in metres, including any binding weighting. */
    readonly components: readonly number[];
  }

  /**
   * Observed quantities from one bounded target fit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names attempted updates, metre tolerance and residual norm.
   * @evidence contracts/development/design.md#principled-representation The tolerances apply to geometric motor goals for the interval.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Retains the aggregate and named signed witnesses together.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts These values carry no native impulse or interpolated contact promise.
   */
  export interface IReport {
    /** Attempted bounded updates. */
    readonly iterations: number;
    /** Requested tolerance of the accepted combined metre residual. */
    readonly tolerance: number;
    /** Euclidean norm of the final combined metre residual. */
    readonly residual: number;
    readonly witnesses: readonly IWitness[];
  }

  /**
   * Report from a coupled interval target that converged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the converged arm of the result type.
   * @evidence contracts/development/design.md#principled-representation Uses the same witness schema as an unconverged fit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A live completed simulation exposes this report at its authored step.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains report data only.
   */
  export type IConverged = IInterval & IReport & { readonly kind: "converged" };

  /**
   * Attempted solve that stopped before meeting the tolerance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains how a numerical stop appears in the status.
   * @evidence contracts/development/design.md#principled-representation Distinguishes exhaustion and a stalled descent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carries the final observed residual and the stop reason.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The failed candidate remains internal to the incident.
   */
  export type IUnconverged = IInterval &
    IReport & {
      readonly kind: "unconverged";
      readonly reason: "iteration-budget" | "stalled";
    };

  /**
   * Admitted operation could not proceed with this declared group.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the stable refusal categories and their human-readable detail.
   * @evidence contracts/development/design.md#principled-representation The reason distinguishes authored, graph, resource and geometry failures.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The same refusal fits admission and the late geometry stage.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A refusal provides evidence of its condition without emitting goal poses.
   */
  export type IRefused = IInterval & {
    readonly kind: "refused";
    readonly reason:
      | "declaration"
      | "membership"
      | "poses"
      | "bindings"
      | "dependency"
      | "budget"
      | "geometry";
    readonly detail: string;
  };

  /**
   * A group failure rejects the bake that requested it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the complete set of public failure outcomes.
   * @evidence contracts/development/design.md#principled-representation A union distinguishes a rejected request from an attempted solve.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The Engine's typed error carries this result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither variant exposes goals.
   */
  export type IFailure = IRefused | IUnconverged;

  /**
   * Successful target-fit reports indexed by authored step and group.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both lookup keys and completed-run scope.
   * @evidence contracts/development/design.md#principled-representation Sparse ordinal keys preserve the sampled clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Clients can read one result directly in any order.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reports describe targets and remain separate from pose archives.
   */
  export type ISeries = Readonly<
    Partial<Record<number, Readonly<Partial<Record<string, IConverged>>>>>
  >;
}

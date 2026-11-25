/** Status and signed witnesses for an explicitly coupled target interval. */
export namespace IAutoMoviePhysicalCoupledTargetFit {
  /** Stable identity of one admitted output interval and its group. */
  export interface IInterval {
    /** Output interval index. Frame zero seeds the simulation. */
    readonly step: number;
    /** Exact authored group id. Empty when a malformed label cannot be named. */
    readonly group: string;
    /** Body ids sorted by ordinal string order. */
    readonly members: readonly string[];
  }

  /** Signed residual of one admitted binding or point constraint. */
  export interface IWitness {
    /** Member body whose target declares the relationship. */
    readonly body: string;
    /** The relationship's authored id, unique within that body's target. */
    readonly id: string;
    /** Collider-relative contact binding, or articulated point bound. */
    readonly kind: "binding" | "point";
    /** Signed components in metres, including any binding weighting. */
    readonly components: readonly number[];
  }

  /** Observed quantities from one bounded target fit. */
  export interface IReport {
    /** Attempted bounded updates. */
    readonly iterations: number;
    /** Requested tolerance of the accepted combined metre residual. */
    readonly tolerance: number;
    /** Euclidean norm of the final combined metre residual. */
    readonly residual: number;
    /** Signed residual of every admitted relationship, members in ordinal order. */
    readonly witnesses: readonly IWitness[];
  }

  /** Report from a coupled interval target that converged. */
  export type IConverged = IInterval & IReport & { readonly kind: "converged" };

  /** Attempted solve that stopped before meeting the tolerance. */
  export type IUnconverged = IInterval &
    IReport & {
      readonly kind: "unconverged";
      readonly reason: "iteration-budget" | "stalled";
    };

  /** Admitted operation could not proceed with this declared group. */
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

  /** A group failure rejects the bake that requested it. */
  export type IFailure = IRefused | IUnconverged;

  /** Successful target-fit reports indexed by authored step and group. */
  export type ISeries = Readonly<
    Partial<Record<number, Readonly<Partial<Record<string, IConverged>>>>>
  >;
}

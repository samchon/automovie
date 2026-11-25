import type { IAutoMovieHumanF1NativeLaw } from "./IAutoMovieHumanF1NativeLaw";

/** Fields exchanged by the F1 engineering control and capture paths. */
export namespace IAutoMovieHumanF1Engineering {
  /**
   * Five qualified source-tape driver ratios, in declared order rather than a
   * joint population percentile.
   */
  export type IRatios = Record<
    "hip" | "omphalion" | "underbust" | "bust" | "neck",
    number
  >;

  /**
   * Original bare-source tape readings, physical mm; skin features and final
   * bands are separate checks.
   */
  export interface IReading {
    /**
     * Material-plane source tapes except bust's current anterior-apex
     * horizontal plane.
     */
    girths: IRatios;
    /**
     * Bare trunk tape at that same current bust plane, excluding both breast
     * caps.
     */
    bareBust: number;
  }

  /**
   * A resolved field handoff; capture consumes fields without solving or
   * applying ratios again. A resolved status concerns input/constraint
   * resolution, not geometric acceptance.
   */
  export interface IResolvedCase {
    /** Stable engineering identifier. */
    id: string;
    /** Complete same-invocation full fields for assembleNative. */
    fields: IAutoMovieHumanF1NativeLaw.IFields;
    /** Original hypothesis inputs, with explicit support breadth in mm. */
    rawDrivers: {
      mode: "f1" | "bust-only" | "all-site" | "support" | "full-field";
      ratios: IRatios;
      hipJointCentreBreadth: number;
    };
    /**
     * Numerical resolution; null means the quantity was not
     * requested/available.
     */
    resolution: {
      status: "resolved" | "infeasible" | "unavailable";
      target: number | null;
      actual: number | null;
      residual: number | null;
      reason: string | null;
    };
    /**
     * Actual signed residual of every requested tape, mm; null for direct full
     * fields.
     */
    girthResiduals: IRatios | null;
    /** Protocol/response/scope limits that stay with every artifact and capture. */
    qualification: string[];
  }
}

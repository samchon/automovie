import type { IAutoMovieBlendColumn } from "./IAutoMovieBlendColumn";
import type { IAutoMovieConstructionLocalScaleMinorant } from "./IAutoMovieConstructionLocalScaleMinorant";

/**
 * Detached observations of the strip's existing column and local-scale work.
 * Ribbon first/second vectors differentiate the dimensionless cross parameter,
 * not physical station mm. A backward column has no forward log target.
 */
export namespace IAutoMovieConstructionSplitBandTrace {
  /** A synchronous nonthrowing observer; it receives no producer-owned vectors. */
  export type Sink = (event: Event) => void;

  /** A finite log target, or its explicit absence on a backward column. */
  export type Target = { kind: "finite"; value: number } | { kind: "backward" };

  /** One target change made by the existing local iteration. */
  export interface IAdjustment {
    /** Column in clock order. */
    column: number;
    /** The existing branch that changed the target. */
    reason: "above-own" | "predicate";
    /** New finite logarithmic target. */
    goal: number;
    /** The new monotone factor, only for a predicate adjustment. */
    lower: number | null;
  }

  /**
   * Actual prepared columns, local passes, one certified attenuation or
   * refusal.
   */
  export type Event =
    | {
        kind: "prepared";
        name: string;
        childPhases: number[];
        columns: IAutoMovieBlendColumn[];
        backward: number[];
        forwardIndices: number[];
        factors: number[];
        commonFactor: number;
      }
    | {
        kind: "local-pass";
        pass: number;
        backward: number[];
        own: Target[];
        goal: Target[];
        envelope: number[];
        smooth: number[];
        field: number[];
        adjustments: IAdjustment[];
        settled: boolean;
      }
    | {
        kind: "minorant";
        result: IAutoMovieConstructionLocalScaleMinorant.Result;
      }
    | {
        kind: "refusal";
        stage:
          | "correspondence"
          | "columns"
          | "common"
          | "local"
          | "publication";
        reason: string;
        pass: number | null;
      };
}

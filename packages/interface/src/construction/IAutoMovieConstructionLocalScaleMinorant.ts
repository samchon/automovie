/** Certify one uniform attenuation of a positive nonuniform scale field. */
export namespace IAutoMovieConstructionLocalScaleMinorant {
  /** An admitted forward factor and its existing logarithmic upper bound. */
  export interface ICap {
    /** Original column index in the scale field. */
    readonly index: number;

    /** Previously admitted factor, finite and in (0, 1]. */
    readonly factor: number;

    /** Existing finite nonpositive upper bound in natural-log scale. */
    readonly logarithm: number;
  }

  /**
   * Reuse the caller's literal geometry certificate, returning null on success.
   * The callback is synchronous, nonthrowing and does not mutate the inputs. It
   * checks scaled-vector validity at every column and the original forward
   * predicate only when forward is true. It runs first on each admitted F, then
   * on every final factor; backward geometry is never forward-certified.
   */
  export type Certify = (
    index: number,
    factor: number,
    forward: boolean,
  ) => string | null;

  /** A certified field or the exact stage and column that refused publication. */
  export type Result =
    | {
        kind: "accepted";
        field: number[];
        alpha: number;
        limitingIndices: number[];
      }
    | {
        kind: "refused";
        stage:
          | "input-field"
          | "input-cap"
          | "held-certificate"
          | "ratio"
          | "alpha"
          | "candidate-field"
          | "candidate-cap"
          | "candidate-log"
          | "candidate-certificate";
        index: number | null;
        reason: string;
      };
}

/**
 * Certify one uniform attenuation of a positive nonuniform scale field.
 *
 * @evidence contracts/development/design.md#principled-representation Dimensionless factors and natural logarithmic upper bounds constrain one constant multiplier; the caller retains geometry and derivative units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the attenuation and numerical postconditions consumed by SplitBand; the geometry owner supplies its existing certificate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Has no scene data, common-factor fallback, scalar geometry predicate or configurable search.
 * @evidence contracts/development/common.md#meaningful-documentation States the discrete scope, scalar units and separation from geometric certification.
 */
export namespace IAutoMovieConstructionLocalScaleMinorant {
  /**
   * An admitted forward factor and its existing logarithmic upper bound.
   *
   * @evidence contracts/development/design.md#principled-representation The index addresses the original field; factor is dimensionless and logarithm is a finite natural-log bound. Runtime validation checks range, uniqueness and finiteness.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The caller supplies the original admitted factor without reconstructing it from log or supplying a common factor.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed immutable record carries one constraint; missing indices are the backward columns.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the admitted floating-point factor from its separate logarithmic constraint.
   */
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
   * The callback is synchronous, nonthrowing and does not mutate the inputs.
   * It checks scaled-vector validity at every column and the original forward
   * predicate only when forward is true. It runs first on each admitted F,
   * then on every final factor; backward geometry is never forward-certified.
   *
   * @evidence contracts/development/design.md#principled-representation An index, dimensionless factor and explicit forward status identify the existing geometric check without duplicating it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Null admits and a string retains the owner's actual failure reason; the callback provides no replacement factor.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Does not substitute an approximate scalar predicate or request another search.
   * @evidence contracts/development/common.md#meaningful-documentation States both invocation stages, ownership and backward semantics.
   */
  export type Certify = (
    index: number,
    factor: number,
    forward: boolean,
  ) => string | null;

  /**
   * A certified field or the exact stage and column that refused publication.
   *
   * @evidence contracts/development/design.md#principled-representation The closed alternatives separate a complete accepted field from a numerical or delegated-certificate failure. A null index identifies a whole-input or alpha failure.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Alpha and its limiting columns explain the actual field change; stage, index and reason feed the strip's real refusal and trace.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Failure carries no fallback field and success has no optional error state.
   * @evidence contracts/development/common.md#meaningful-documentation Names the one multiplier, discrete limiting columns and failure ownership.
   */
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

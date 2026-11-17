/** Data and callback contracts shared by the SwivelArcs operations. */
export namespace IAutoMovieSwivelArcs {
  /**
   * `a + b cos ψ + c sin ψ` of a swivel `ψ`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its term.
   * @evidence contracts/development/design.md#principled-representation The three coefficients of a sinusoid.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None optional.
   */
  export interface ISinusoid {
    /** The constant term. */
    a: number;

    /** The cosine's coefficient. */
    b: number;

    /** The sine's coefficient. */
    c: number;
  }

  /**
   * An interval of swivels, degrees, `from` up to `to`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its end and unit.
   * @evidence contracts/development/design.md#principled-representation The two ends of an arc.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None optional.
   */
  export interface IArc {
    /** The start, degrees. */
    from: number;

    /** The end, degrees, not before `from`. */
    to: number;
  }
}

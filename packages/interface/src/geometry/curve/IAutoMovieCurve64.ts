/**
 * Optional source provenance shared only by the Bernstein piece alternatives.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The retained metadata distinguishes a local parameter interval from a descriptive source interval and does not rescale derivatives.
 * @evidence contracts/development/design.md#principled-representation Optional interval tuples describe provenance; admissible bounds remain the curve producer's responsibility.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieBernsteinCurvePiece64 uses this helper for the same optional metadata across its three coefficient alternatives; it has no independent runtime lifecycle.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Omission records no source provenance rather than inventing a chart or changing the evaluator clock.
 */
export namespace IAutoMovieCurve64 {
  /**
   * Optional provenance for a Bernstein piece: parameterDomain, when present, is [0,1]; qInterval is descriptive source extent and does not rescale local-t derivatives.
   *
   * @evidence contracts/development/design.md#principled-representation Separate source intervals preserve provenance without changing the normalized evaluator chart.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both optional fields are shared by every Bernstein branch.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An omitted interval does not create an inferred physical phase width.
   * @evidence contracts/development/common.md#meaningful-documentation Explains optional presence and the difference between local domain and source extent.
   */
  export interface PieceMetadata {
    /** Optional descriptive source interval; evaluation still returns derivatives per normalized local t. */
    parameterDomain?: readonly [number, number];

    /** Optional source q interval; it records provenance and does not silently rescale local-t derivatives. */
    qInterval?: readonly [number, number];
  }
}

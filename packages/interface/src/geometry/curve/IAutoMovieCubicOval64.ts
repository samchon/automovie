/**
 * Data and callback contracts shared by the CubicOval64 operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Positive millimetre breadth and depth are the diameters of one normalized cubic oval, with a dimensionless breadth/depth ratio. Scalar types do not enforce positivity or finiteness; axesBySimpson admits circumference and ratio before returning dimensions.
 * @evidence contracts/development/design.md#principled-representation Positive millimetre breadth and depth are the diameters of one normalized cubic oval, with a dimensionless breadth/depth ratio.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieCubicOval64.axesBySimpson publishes these dimensions after solving against its Simpson perimeter.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scalar types do not enforce positivity or finiteness; axesBySimpson admits circumference and ratio before returning dimensions.
 */
export namespace IAutoMovieCubicOval64 {
  /**
   * Resolve breadthMm/depthMm at a fixed positive breadth/depth ratio using the same Simpson perimeter. Both inputs and returned diameters are positive finite values in millimetres; an unrepresentable positive diameter throws RangeError before publication.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Positive millimetre breadth and depth are the diameters of one normalized cubic oval, with a dimensionless breadth/depth ratio. Scalar types do not enforce positivity or finiteness; axesBySimpson admits circumference and ratio before returning dimensions.
   * @evidence contracts/development/design.md#principled-representation Positive millimetre breadth and depth are the diameters of one normalized cubic oval, with a dimensionless breadth/depth ratio.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieCubicOval64.axesBySimpson publishes these dimensions after solving against its Simpson perimeter.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scalar types do not enforce positivity or finiteness; axesBySimpson admits circumference and ratio before returning dimensions.
   */
  export type IAxesBySimpsonResult = {
    /** Positive lateral support separation of the normalized cubic oval, mm. */
    breadthMm: number;

    /** Positive anterior/posterior support separation of that same oval, mm. */
    depthMm: number;
  };
}

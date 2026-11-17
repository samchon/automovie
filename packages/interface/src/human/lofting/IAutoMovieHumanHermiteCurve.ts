/** Source-free cubic spans in the registered millimetre frame.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Source-free cubic spans in the registered millimetre frame.
 * @evidence contracts/development/design.md#principled-representation `name`: Anatomical boundary identity. `chain`: Skin chain owning this exterior boundary in the calibration graph. `closed`: Whether the last endpoint is literally the first endpoint.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadLane.vermilion. Also types AutoMovieHumanHeadLane.out.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `chain`, `closed`, `spans`; callers supply the complete record.
 */
export interface IAutoMovieHumanHermiteCurve {
  /** Anatomical boundary identity. */
  name: string;

  /** Skin chain owning this exterior boundary in the calibration graph. */
  chain: string;

  /** Whether the last endpoint is literally the first endpoint. */
  closed: boolean;

  /** Ordered spans; derivatives retain their original physical phase units. */
  spans: Array<{
    /** Original source curve and span address, for boundary diagnostics. */
    address: string;
    /** Positive physical phase interval in millimetres. */
    interval: number;
    /** First endpoint in millimetres. */
    start: [number, number, number];
    /** Last endpoint in millimetres. */
    end: [number, number, number];
    /** First endpoint derivative per phase millimetre. */
    startDerivative: [number, number, number];
    /** Last endpoint derivative per phase millimetre. */
    endDerivative: [number, number, number];
  }>;
}

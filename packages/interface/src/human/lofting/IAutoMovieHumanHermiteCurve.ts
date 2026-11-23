/** Source-free cubic spans in the registered millimetre frame. */
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

/**
 * Observed physical crease with source incidence identities at its two
 * endpoints. from/to and sourceEdge preserve source identities, the two
 * sourceFaces retain original ordinals, and angleDegrees is the measured
 * incident-face angle.
 */
export type IAutoMovieRecoverySourceCrease = {
  /** Identity of the directed source incidence at this edge's start. */
  from: string;

  /** Identity of the directed source incidence at this edge's end. */
  to: string;

  /**
   * Original source-edge identity; coincident edges with different incidence
   * remain distinct.
   */
  sourceEdge: string;

  /** Original source-face ordinals belonging to this observed chart or feature. */
  sourceFaces: [number, number];

  /** Measured angle between the incident source faces, in degrees. */
  angleDegrees: number;
};

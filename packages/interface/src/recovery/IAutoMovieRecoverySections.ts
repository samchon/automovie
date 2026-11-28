import type {
  AutoMovieVector3Tuple,
  IAutoMovieContourLoft64,
  IAutoMovieRecoverySectionReport,
  IAutoMovieRecoverySectionsInput,
  IAutoMovieRecoverySourceTerminal,
} from "..";

/**
 * Requested physical section observations, fitting evidence and optional source
 * terminal observations.
 */
export interface IAutoMovieRecoverySections {
  /** Caller-supplied name of the fixed-section collection. */
  name: string;

  /** Original caller section direction supplied to build the physical frame. */
  axis: Readonly<AutoMovieVector3Tuple>;

  /** Original caller direction whose planar projection selects frame V. */
  reference: Readonly<AutoMovieVector3Tuple>;

  /** Origin and right-handed orthonormal axes used for all requested cuts. */
  frame: {
    /** Common registered frame origin in millimetres before station translation. */
    originMm: Readonly<AutoMovieVector3Tuple>;

    /** Unit cutting normal along the signed physical station axis. */
    n: Readonly<AutoMovieVector3Tuple>;

    /** Unit in-plane U axis forming a right-handed frame with V and N. */
    u: Readonly<AutoMovieVector3Tuple>;

    /** Unit in-plane V axis aligned with the projected caller reference. */
    v: Readonly<AutoMovieVector3Tuple>;
  };

  /** Fitted closed-loop sections in observation order. */
  sections: IAutoMovieContourLoft64.ISection[];

  /** Fit and contact observations aligned with sections by array position. */
  reports: IAutoMovieRecoverySectionReport[];

  /**
   * Fitting tolerance and span cap, alias policy, material orientation override
   * and corner threshold used for the observation.
   */
  policy: Pick<
    IAutoMovieRecoverySectionsInput,
    | "toleranceMm"
    | "maxSpans"
    | "exactCoordinateAliases"
    | "sourceOrientationSign"
    | "cornerDegrees"
  >;

  /** Counts of retained planes, fitting observations and cubic spans. */
  summary: {
    /** Number of planes retained in the observed collection. */
    sections: number;
    /** Number of physical sample observations used by successful contour fits. */
    observations: number;
    /** Number of emitted cubic spans across successful contour fits. */
    spans: number;
  };

  /** Source terminal results when the caller supplied terminal seeds. */
  terminals?: IAutoMovieRecoverySourceTerminal[];
}

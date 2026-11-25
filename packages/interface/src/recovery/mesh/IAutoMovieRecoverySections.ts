import type {
  AutoMovieVector3Tuple,
  IAutoMovieContourLoft64,
  IAutoMovieRecoverySectionReport,
  IAutoMovieRecoverySectionsInput,
  IAutoMovieRecoverySourceTerminal,
} from "../../index";

/**
 * Source-free fitted curves at explicitly requested physical planes. Empty
 * sections, all closed components, open fits and rejected-contour diagnostics
 * remain in request order. This collection declares no between-plane topology,
 * continuation, selection or surface authorization.
 */
export interface IAutoMovieRecoverySections {
  /** Collection identity used in every curve name. */
  name: string;

  /**
   * Original caller direction, before normalization; a fresh millimetre-frame
   * triple.
   */
  axis: Readonly<AutoMovieVector3Tuple>;

  /**
   * Original caller frame reference, before orthogonal projection; a fresh
   * triple.
   */
  reference: Readonly<AutoMovieVector3Tuple>;

  /**
   * Actual right-handed orthonormal frame; coordinates measure along n from
   * originMm and u cross v equals n.
   */
  frame: {
    /** Section-plane origin in the registered millimetre Cartesian frame. */
    originMm: Readonly<AutoMovieVector3Tuple>;

    /**
     * Unit section-plane normal in the registered Cartesian frame; u cross v
     * equals n.
     */
    n: Readonly<AutoMovieVector3Tuple>;

    /**
     * Unit u-axis of the right-handed section plane, in the registered
     * Cartesian frame.
     */
    u: Readonly<AutoMovieVector3Tuple>;

    /**
     * Unit v-axis of the right-handed section plane, in the registered
     * Cartesian frame.
     */
    v: Readonly<AutoMovieVector3Tuple>;
  };

  /**
   * Every requested plane in original order, including empty cuts; curves
   * retain measured winding.
   */
  sections: IAutoMovieContourLoft64.ISection[];

  /** Same-order fit diagnostics, open curves and isolated contacts. */
  reports: IAutoMovieRecoverySectionReport[];

  /** Fit and incidence policy without source arrays. */
  policy: Pick<
    IAutoMovieRecoverySectionsInput,
    | "toleranceMm"
    | "maxSpans"
    | "exactCoordinateAliases"
    | "sourceOrientationSign"
    | "cornerDegrees"
  >;

  /**
   * Actual requested planes, raw observations admitted to successful fits and
   * fitted cubic spans.
   */
  summary: {
    /**
     * Actual observed section-plane population, including planes with no
     * admitted coefficient loops.
     */
    sections: number;
    /** Actual raw observation population processed by this operation. */
    observations: number;
    /**
     * Actual retained cubic-span population, separate from original observation
     * count.
     */
    spans: number;
  };

  /**
   * Present only when terminalSeeds were requested; observed source extrema and
   * critical qualification do not constitute generated caps or inferred loop
   * continuation.
   */
  terminals?: IAutoMovieRecoverySourceTerminal[];
}

import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieCubicBezierCurve64 } from "../../../geometry/curve/IAutoMovieCubicBezierCurve64";

/**
 * Type contracts exchanged by AutoMovieHumanHandPalm; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanHandPalm {
  /** JSON coefficient layout before restoring the engine's fixed tuple widths. */
  export interface IFixedCurveInput {
    /** Declared cubic representation and physical units. */
    type: string;
    /** Original curve identity. */
    name: string;
    /** Original closed-loop flag. */
    closed: boolean;
    /** Position unit of the stored controls. */
    unit: string;
    /** Unit of the original curve parameter. */
    phaseUnit: string;
    /** Original span widths. */
    phaseIntervals: number[];
    /** Four three-coordinate controls per span. */
    spans: number[][][];
  }

  /** One Bézier section and its cutting chart in native world millimetres. */
  export interface IFixedSection {
    /**
     * Source row label, with a fractional label for an inserted measured collar
     * cut.
     */
    station: number;

    /** Distance along the source course in millimetres, used to index the axis. */
    stationMm: number;

    /**
     * Signed cutting-plane coordinate in millimetres in the section's
     * observation chart.
     */
    coordinateMm: number;

    /** Cutting-plane origin in native reference-world millimetres. */
    originMm: AutoMovieVector3Tuple;

    /** First unit tangent of the cutting plane in native reference-world axes. */
    u: AutoMovieVector3Tuple;

    /**
     * Second unit tangent of the cutting plane in the reference chart's
     * handedness.
     */
    v: AutoMovieVector3Tuple;

    /**
     * Source contours in native reference-world millimetres with their observed
     * closure kind.
     */
    loops: {
      /**
       * Source representation or event kind, restored to the owning contour
       * contract by the Human builder.
       */
      kind: string;
      /**
       * Closed source curve in its declared section chart; coefficient and
       * derivative units follow that curve's parameter.
       */
      curve: IAutoMovieCubicBezierCurve64;
    }[];
  }

  /**
   * Numerical chart of the ordinary strip. Its rows are still the original
   * world planes.
   */
  export interface IContourCoordinates {
    /** Accumulated distances between the actual plane origins, millimetres. */
    stations: number[];
    /** Whether the measured turning collar is retiled in its world chart. */
    worldCollar: boolean;
    /**
     * Project a world-millimetre point on the zero-based source row into [local
     * u, accumulated station, local v], all millimetres. A point more than 1e-6
     * mm from that row's plane throws.
     */
    into(row: number, point: AutoMovieVector3Tuple): AutoMovieVector3Tuple;
    /**
     * Return [local u, accumulated station, local v] millimetres to its
     * recorded world plane. The station must match a retained row within 1e-6
     * mm or the call throws.
     */
    out(point: AutoMovieVector3Tuple): AutoMovieVector3Tuple;
  }

  /** Isolated raw-mesh tip and its observed neighbouring coordinates. */
  export interface IFixedTerminal {
    /** Whether the raw-mesh maximum qualifies as a single point for a loft cap. */
    singleTipQualified: boolean;

    /**
     * Terminal plane coordinate and its raw-mesh extremal points in native
     * world millimetres.
     */
    maximum: {
      /**
       * Physical coordinate of this section or event along the original source
       * axis, millimetres.
       */
      coordinateMm: number;
      /**
       * Ordered terminal-boundary points in the original source frame,
       * millimetres.
       */
      pointsMm: AutoMovieVector3Tuple[];
    };

    /**
     * Observed plane coordinates in millimetres, including a cut beyond the
     * maximum.
     */
    coordinatesMm: number[];
  }

  /**
   * The value argument of AutoMovieHumanHandPalm.fixedSection. Restore the
   * unchanged absolute frame and cubic loops of an authored section.
   */
  export type IFixedSectionValue = {
    /**
     * Archived source row address, including fractional labels for inserted
     * cuts; the physical station is stationMm.
     */
    station: number;
    /** Physical station along the original source axis, millimetres. */
    stationMm: number;
    /**
     * Physical coordinate of this section or event along the original source
     * axis, millimetres.
     */
    coordinateMm: number;
    /** Section-plane origin in the original source frame, millimetres. */
    originMm: number[];
    /** Unit u axis of the section's local chart in the registered source frame. */
    u: number[];
    /** Unit v axis of the section's local chart in the registered source frame. */
    v: number[];
    /**
     * Ordered section boundary loops, retaining the original component
     * correspondence and orientation.
     */
    loops: {
      /**
       * Source representation or event kind, restored to the owning contour
       * contract by the Human builder.
       */
      kind: string;
      /**
       * Closed source curve in its declared section chart; coefficient and
       * derivative units follow that curve's parameter.
       */
      curve: IFixedCurveInput;
    }[];
  };

  /**
   * Result of AutoMovieHumanHandPalm.openTerminal. Read the actual open capture
   * edge and verify every directed mesh edge.
   */
  export type IOpenTerminalResult = {
    /**
     * Index of the first vertex in the actual open terminal ring within the
     * archived mesh position array.
     */
    base: number;
    /**
     * Directed open-edge boundary vertices in their verified cyclic order,
     * registered millimetres.
     */
    boundary: AutoMovieVector3Tuple[];
  };

  /**
   * The map argument of AutoMovieHumanHandPalm.palmOf. The palm's chain, its
   * sections square to the hand's axis.
   */
  export type PalmOfMap = (
    q: readonly [number, number, number],
  ) => AutoMovieVector3Tuple;
}

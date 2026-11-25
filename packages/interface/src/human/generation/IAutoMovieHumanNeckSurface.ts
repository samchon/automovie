import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanNeckSurface; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanNeckSurface {
  /** One actual source course, sampled at the common display phases. */
  export interface ISection {
    /** Source chain owning this course. */
    chain: string;

    /** Continuous material address in calibration millimetres, not world Y. */
    stationMm: number;

    /** Requested world centre height in metres. */
    requestedHeight: number;

    /** Actual source section's phase-mean centre in registered world metres. */
    centre: AutoMovieVector3Tuple;

    /** Actual source frame: origin in metres and unmodified dimensionless basis. */
    frame: {
      /** Registered world origin in metres. */
      origin: AutoMovieVector3Tuple;

      /** Source basis vector carrying the section's depth coordinate. */
      u: AutoMovieVector3Tuple;

      /** Source basis vector carrying the section's lateral coordinate. */
      v: AutoMovieVector3Tuple;
    };

    /**
     * Actual source world points in metres, in this course's material-phase
     * order.
     */
    points: AutoMovieVector3Tuple[];

    /** Actual material phases in radians that evaluated these source points. */
    sourcePhases: number[];

    /**
     * Separate LOD zipper coordinates from arclength of the frame-projected
     * eight-point polygon, radians. These neither change the points nor recover
     * source event correspondence or exact three-dimensional arclength.
     */
    displayCoordinates: number[];

    /** Source perimeter measured at 256 phases, metres; not polygon perimeter. */
    circumference: number;

    /** Full world Z extent of the 256-phase source section, metres. */
    breadth: number;

    /** Full world X extent of the 256-phase source section, metres. */
    depth: number;
  }

  /** Prepared neutral neck exterior; no full calibration is retained. */
  export interface IOutput {
    /** Physical output units; only stationMm retains the source chart's mm. */
    units: "metres";

    /**
     * Public neck length defines a display band, not an anatomical jaw
     * boundary.
     */
    bandDefinition: "requested-length";

    /**
     * Source sample phases in radians; their numbers do not assert cross-chart
     * material correspondence.
     */
    phases: number[];

    /**
     * Actual lower boundary, half-height, three-quarter-height and upper
     * courses.
     */
    sections: ISection[];

    /** Actual head courses at the existing one-third/two-thirds display heights. */
    headSections: [ISection, ISection];

    /**
     * Canonical calibration pole used by the skeleton, distinct from a finite
     * section. Generated chain.pole overrides are outside this display
     * contract.
     */
    crown: {
      /** Actual source chain whose top this pole closes. */
      chain: string;

      /** Actual source end, retained without inventing a terminal ring. */
      end: "top" | "bottom";

      /** Registered source terminal point in physical metres. */
      point: AutoMovieVector3Tuple;

      /** Whether the source declares a recovered critical point. */
      critical: boolean;
    };

    /**
     * Actual upper-minus-lower centre height, metres; not a bone or axis
     * length.
     */
    visibleLength: number;

    /** Public physical neck-length input used as this display band's height, m. */
    publicTargetLength: number;

    /** Middle of the visible world-height band, metres. */
    requestedMidHeight: number;

    /** Evaluated centre height of the middle source course, metres. */
    actualMidHeight: number;

    /**
     * Public neck circumference input in metres, never used to resize points.
     * Its measurement site has not been identified with these display courses;
     * differences from their circumferences do not establish a target error.
     */
    publicTargetCircumference?: number;
  }
}

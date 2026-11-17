import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanNeckSurface; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanNeckSurface exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups ISection, IOutput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanNeckSurface; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the ISection, IOutput contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanNeckSurface {
  /**
   * One actual source course, sampled at the common display phases.
   *
   * @evidence contracts/development/design.md#principled-representation Owner and material station identify the source; sampled points preserve its frame and lift independently of scalar measurements. `chain`: Source chain owning this course. `stationMm`: Continuous material address in calibration millimetres, not world Y. `requestedHeight`: Requested world centre height in metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record carries the source address, display geometry and independently measured metrics required by the polygon consumer. Returned by AutoMovieHumanNeckSurfaceSampling.section. Also types AutoMovieHumanNeckSurface.lower, AutoMovieHumanNeckSurface.sections.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record separates requested height, actual centre and measured source perimeter instead of asserting that the display polygon meets a target. Required fields are `chain`, `stationMm`, `requestedHeight`, `centre`, `frame`, `points`, `sourcePhases`, `displayCoordinates`, `circumference`, `breadth`, `depth`; callers supply the complete record.
   * @evidence contracts/development/common.md#meaningful-documentation Every field states its ownership, units or sampling meaning, including the millimetre material address. One actual source course, sampled at the common display phases.
   */
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

    /** Actual source world points in metres, in this course's material-phase order. */
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

  /**
   * Prepared neutral neck exterior; no full calibration is retained.
   *
   * @evidence contracts/development/design.md#principled-representation Per-course phases retain source addresses while projected-polygon coordinates define display joins; requested height, achieved centre height and public circumference retain separate meanings. `units`: Physical output units; only stationMm retains the source chart's mm. `bandDefinition`: Public neck length defines a display band, not an anatomical jaw boundary. `phases`: Source sample phases in radians; their numbers do not assert cross-chart material correspondence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The result contains only neck and head geometry and metadata consumed by the existing polygon display. Returned by AutoMovieHumanNeckSurface.derive. Also types AutoMovieHumanSkeleton.neckSurface.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Public circumference is optional metadata and never replaces source measurements or points. `publicTargetCircumference`: Public neck circumference input in metres, never used to resize points.
   * @evidence contracts/development/common.md#meaningful-documentation The fields distinguish physical units, source chart units, phase order and display conventions. Prepared neutral neck exterior; no full calibration is retained.
   */
  export interface IOutput {
    /** Physical output units; only stationMm retains the source chart's mm. */
    units: "metres";

    /** Public neck length defines a display band, not an anatomical jaw boundary. */
    bandDefinition: "requested-length";

    /** Source sample phases in radians; their numbers do not assert cross-chart material correspondence. */
    phases: number[];

    /** Actual lower boundary, half-height, three-quarter-height and upper courses. */
    sections: ISection[];

    /** Actual head courses at the existing one-third/two-thirds display heights. */
    headSections: [ISection, ISection];

    /**
     * Canonical calibration pole used by the skeleton, distinct from a finite
     * section. Generated chain.pole overrides are outside this display contract.
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

    /** Actual upper-minus-lower centre height, metres; not a bone or axis length. */
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

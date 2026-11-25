import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanConicLoft } from "../conic/IAutoMovieHumanConicLoft";
import type { IAutoMovieHumanNail } from "./IAutoMovieHumanNail";

/** The anatomy, original skin and clipping receipt of one digit's nail. */
export namespace IAutoMovieHumanDigitNails {
  /** A nail's anatomy label and the measured or estimated dimensions it selects. */
  export interface IRow {
    /** Anatomical digit name in the default proportion table. */
    digit: string;

    /** Nail dimensions and anatomical bounds for this digit class. */
    proportions: IAutoMovieHumanNail.IProportions;
  }

  /** One ready conic digit and its placement in the original source chart. */
  export interface IDigit {
    /** The placed digit, with its actual course and distal closure. */
    family: IAutoMovieHumanConicLoft.IFamily;

    /** Anatomy label when the source has a different owner name. */
    digit?: string;

    /**
     * Station in the original chart to arclength along the positioned course,
     * both in millimetres.
     */
    physicalStation?: (station: number) => number;
  }

  /** The real placed digit before its nail relief. */
  export interface IOriginal {
    /** Anatomy key in the nail proportion table. */
    digit: string;

    /** The placed skin's original chart, including its own distal pole. */
    source: IAutoMovieViewPart;

    /**
     * Signed physical mm from the distal joint to each original station plane,
     * increasing toward the pole.
     */
    jointDistance: (station: number) => number;
  }

  /** Original digit and the same anatomical placement used for its nail. */
  export interface IPlaced {
    /** Native exposed digit chart and its physical distal station map. */
    original: IOriginal;
    /** Actual distal joint and its bone and dorsal unit directions. */
    frame: IAutoMovieHumanNail.IFrame;
  }

  /**
   * Axial support and combined bed-and-strip clipping from the prepared
   * original.
   */
  export interface ISupport {
    /** The original chart's station bounds in millimetres. */
    domain: readonly [number, number];

    /** Where the distal aperture starts in that chart, millimetres. */
    aperture: number;

    /**
     * The original fit's greatest requested clipping on either net,
     * millimetres.
     */
    clipped: number;

    /** Physical location of the maximum request in the nail frame, millimetres. */
    clippedAt: IAutoMovieHumanNail.IReadings["clippedAt"];

    /** Which net control owns the maximum request. */
    clippedIn: IAutoMovieHumanNail.IReadings["clippedIn"];

    /** The combined clipping limit, millimetres. */
    limit: number;

    /** Whether the combined clipping meets the limit. */
    admitted: boolean;
  }

  /** One prepared nail retaining the direct skin it was fitted on. */
  export interface IMade {
    /** The anatomy row used by the fit. */
    row: IRow;

    /** The original view part before applying the nail. */
    readonly original: IAutoMovieViewPart;

    /** The plate, bed and strip, along with their fit diagnostics. */
    nail: IAutoMovieHumanNail.INail;

    /** The original chart's support and clipping result. */
    support: ISupport;
  }
}

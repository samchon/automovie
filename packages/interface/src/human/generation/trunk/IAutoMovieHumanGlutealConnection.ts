import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanGlutealParent } from "./IAutoMovieHumanGlutealParent";

/**
 * Type contracts exchanged by AutoMovieHumanGlutealConnection; runtime
 * evaluation remains in Human.
 */
export namespace IAutoMovieHumanGlutealConnection {
  /** Independent mass law and the identical original parent definitions. */
  export interface IInput {
    /** Current tape pass's original trunk, calibration mm. */
    trunk: IAutoMovieViewPart;
    /** Same-side original leg and its authoritative metre declaration. */
    leg: {
      /**
       * Geometric part with its original axis and section laws; its declared
       * source frame and units apply.
       */
      part: IAutoMovieViewPart;
      /**
       * The same part expressed as the canonical construction view, with
       * physical lengths in metres.
       */
      view: IAutoMovieConstructionView;
    };
    /** Public posterior AP apex; its height and across position remain fixed. */
    target: AutoMovieVector3Tuple;
    /** Own root footprint: up, lateral, down and medial, mm. */
    footprint: [number, number, number, number];
    /**
     * The existing attachment's fold reach gives the footprint solve's spatial
     * resolution, mm.
     */
    fold: number;
    /** Own source fullness, dimensionless; it is not copied from the parent. */
    shoulder: number;
    /** Anatomical lateral is +Z on the left and -Z on the right. */
    lateral: 1 | -1;
  }

  /** One whole-phase root position and its actual local parent chord. */
  export interface IContact {
    /** Point of the gluteal root curve, calibration mm. */
    point: AutoMovieVector3Tuple;
    /** Parent chord with its original boundary owners/stations/phases. */
    chord: IAutoMovieHumanGlutealParent.IChord;
  }

  /**
   * Parent-supported placement candidate and the local field that determined
   * it.
   */
  export interface IConnection {
    /**
     * The admitted footprint in anatomical [up, lateral, down, medial] order,
     * mm.
     */
    footprint: [number, number, number, number];
    /** Identical parent definitions, also consumed by their production lofts. */
    parent: IAutoMovieHumanGlutealParent.IParent;
    /** Composite parent's posterior wall at the apex's unchanged Y/Z, mm. */
    wall: AutoMovieVector3Tuple;
    /** Fixed anatomical posterior direction. */
    normal: AutoMovieVector3Tuple;
    /** Strictly positive wall-to-public-apex distance, mm. */
    amplitude: number;
    /**
     * Internal root-axis candidate, mm; common mass preparation may retain its
     * supported original datum.
     */
    root: AutoMovieVector3Tuple;
    /** Root-to-wall AP separation, mm. */
    embed: number;
    /**
     * Common AP interval over this exact footprint's final bounded phase grid,
     * mm; not a continuous containment certificate.
     */
    rootInterval: readonly [number, number];
    /** Final numerical phase budget; not a continuous containment certificate. */
    phases: number;
    /**
     * Exact candidate-ring contact query; a retained original root must publish
     * its own matching contact reader.
     */
    contact(phi: number): IContact | string;
  }
}

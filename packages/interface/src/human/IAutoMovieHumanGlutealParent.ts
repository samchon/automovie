import type { IAutoMovieConstructionView } from "../construction/IAutoMovieConstructionView";
import type { IAutoMovieLoftViewSource } from "../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";

/**
 * Shared original parents and native AP chord boundaries with explicit
 * unavailable results. Runtime construction and admission remain with
 * AutoMovieHumanGlutealParent in Human.
 */
export namespace IAutoMovieHumanGlutealParent {
  /** Shared original definitions and their local contact reader. */
  export interface IParent {
    /** The identical original parts consumed by the production parent lofts. */
    parts: readonly IAutoMovieViewPart[];
    /**
     * Same prepared scalar/fullness/cap owners; physical jets stay available
     * through the public reader.
     */
    sources: readonly {
      /**
       * Geometric part with its original axis and section laws; its declared
       * source frame and units apply.
       */
      part: IAutoMovieViewPart;
      /**
       * Admitted original scalar/section owner for this geometric part;
       * consumers read its declared source parameter.
       */
      source: IAutoMovieLoftViewSource.ISource;
    }[];
    /** Admitted source-native AP intervals, or the explicit unavailable premise. */
    chord(y: number, z: number): IChord[] | string;
  }

  /** One occupied AP interval at the queried world height/across position. */
  export interface IChord {
    /** Posterior and anterior actual source boundaries. */
    back: IBoundary;
    /** Anterior actual source boundary. */
    front: IBoundary;
  }

  /** A boundary point and the actual original chart that supplied it. */
  export interface IBoundary {
    /** World AP coordinate, calibration mm. */
    x: number;
    /** Source part name; a union keeps the actual outer boundary's owner. */
    owner: string;
    /** Physical source station, calibration mm. */
    station: number;
    /** Original polar phase, radians. */
    phase: number;
  }

  /**
   * World-height cut points [X, Z] in calibration millimetres from the
   * identical original parent, or the original unavailable reason as a string.
   * A string is not an empty successful cut.
   */
  export type LevelCutResult = [number, number][] | string;

  /**
   * The actual leg's millimetre view part and its corresponding metre
   * construction view, borrowed together when preparing the trunk/leg parent
   * source.
   */
  export type ICreateLeg = {
    /**
     * Geometric part with its original axis and section laws; its declared
     * source frame and units apply.
     */
    part: IAutoMovieViewPart;
    /**
     * The same part expressed as the canonical construction view, with physical
     * lengths in metres.
     */
    view: IAutoMovieConstructionView;
  };
}

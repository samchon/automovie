import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieHumanFootArc } from "./IAutoMovieHumanFootArc";

/**
 * Five section guide points and their shared contact jets in the across/up
 * millimetre chart. Runtime construction and admission remain with
 * AutoMovieHumanFootSectionJets in Human.
 */
export namespace IAutoMovieHumanFootSectionJets {
  /** A section's five guide points in its plane, `[across, up]`, mm. */
  export interface IPoints {
    /** The instep's crest. */
    crest: AutoMovieVector2Tuple;

    /** The lateral border. */
    lateral: AutoMovieVector2Tuple;

    /** The lateral edge of the plantar contact. */
    contactLateral: AutoMovieVector2Tuple;

    /** The medial edge of the plantar contact. */
    contactMedial: AutoMovieVector2Tuple;

    /** The medial border. */
    medial: AutoMovieVector2Tuple;
  }

  /** What the jets read. */
  export interface IInput {
    /** The five points. */
    points: IPoints;

    /** The lateral and medial contact edges' heights over the floor, mm. */
    heights: IInputHeights;

    /** The heel's posterior corner's height, mm. */
    corner: number;
  }

  /** The heights object of {@link IInput}. */
  export type IInputHeights = {
    /** Lateral plantar contact edge's height above the floor, millimetres. */
    lateral: number;
    /** Medial plantar contact edge's height above the floor, millimetres. */
    medial: number;
  };

  /** The five jets. */
  export interface IJets {
    /** The crest's. */
    crest: IAutoMovieHumanFootArc.IJet;

    /** The lateral border's. */
    lateral: IAutoMovieHumanFootArc.IJet;

    /** The lateral contact edge's. */
    contactLateral: IAutoMovieHumanFootArc.IJet;

    /** The medial contact edge's. */
    contactMedial: IAutoMovieHumanFootArc.IJet;

    /** The medial border's. */
    medial: IAutoMovieHumanFootArc.IJet;
  }
}

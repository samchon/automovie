import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";
import type { IAutoMovieHumanFootToeLines } from "./IAutoMovieHumanFootToeLines";

/**
 * Sided foot joint centres and toe lines, retaining the canonical foot frame.
 * Runtime construction and admission remain with AutoMovieHumanFootBones in
 * Human.
 */
export namespace IAutoMovieHumanFootBones {
  /** One side's centres, reflected for the side. */
  export interface IBones {
    /** Ankle centre, at the lateral malleolus height. */
    ankle: AutoMovieVector3Tuple;

    /** Lateral and medial malleoli. */
    malleoli: IBonesMalleoli;

    /** Metatarsal head centres, hallux first. */
    heads: AutoMovieVector3Tuple[];

    /** Mean of the metatarsal heads. */
    ball: AutoMovieVector3Tuple;

    /**
     * Each toe's joints from its metatarsal head to its tip, hallux first: the
     * hallux's MTP, IP and tip, a lesser toe's MTP, PIP, DIP and tip.
     */
    toes: AutoMovieVector3Tuple[][];
  }

  /** The malleoli object of {@link IBones}. */
  export type IBonesMalleoli = {
    /** Lateral malleolus landmark in the registered frame, millimetres. */
    lateral: AutoMovieVector3Tuple;
    /** Medial malleolus landmark in the registered frame, millimetres. */
    medial: AutoMovieVector3Tuple;
  };

  /** A foot's centres and the frame they stand in. */
  export interface ICentres {
    /** The foot's frame. */
    frame: IAutoMovieHumanFootFrame.IFrame;

    /** Toe lines: head centre and apex, left frame. */
    lines: IAutoMovieHumanFootToeLines.ILine[];

    /** Centres, reflected for the side. */
    bones: IBones;
  }
}

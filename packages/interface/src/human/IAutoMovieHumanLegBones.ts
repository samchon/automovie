import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Canonical-left leg joint centres, segment lengths and stature/ankle placement
 * inputs. Runtime construction and admission remain with AutoMovieHumanLegBones
 * in Human.
 */
export namespace IAutoMovieHumanLegBones {
  /** The three joint centres of the left leg and the bones' lengths. */
  export interface IBones {
    /** Hip joint centre. */
    hip: AutoMovieVector3Tuple;

    /** Knee joint centre. */
    knee: AutoMovieVector3Tuple;

    /** Ankle joint centre, at the lateral malleolus. */
    ankle: AutoMovieVector3Tuple;

    /** Femur, hip to knee, mm. */
    femur: number;

    /** Tibia, knee to ankle, mm. */
    tibia: number;
  }

  /** What the bones are placed from. */
  export interface IInput {
    /** Stature, calibration mm. */
    stature: number;

    /**
     * Calibration millimetres per world millimetre; the published constants
     * below are world millimetres.
     */
    scale: number;

    /** Lateral malleolus height, calibration mm: the foot's `ankleHeight` input. */
    ankleHeight: number;

    /**
     * Medial over lateral malleolus height (the foot prior's convention, Gray
     * 1918: the medial stands higher).
     */
    medial: number;

    /**
     * Forward place of the hip centre, calibration mm: under the trunk's crotch
     * ring.
     */
    hipForward: number;

    /** Forward place of the ankle centre, calibration mm: the foot's stance. */
    ankleForward: number;
  }
}

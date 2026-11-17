import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanLegBones; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLegBones {
  /** The three joint centres of the left leg and the bones' lengths.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The three joint centres of the left leg and the bones' lengths.
   * @evidence contracts/development/design.md#principled-representation `hip`: Hip joint centre. `knee`: Knee joint centre. `ankle`: Ankle joint centre, at the lateral malleolus.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegBones.of. Read by AutoMovieHumanLegWalk.define, AutoMovieHumanLegWalk.create, AutoMovieHumanLegWalk.source.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `hip`, `knee`, `ankle`, `femur`, `tibia`; callers supply the complete record.
   */
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

  /** What the bones are placed from.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the bones are placed from.
   * @evidence contracts/development/design.md#principled-representation `stature`: Stature, calibration mm. `scale`: Calibration millimetres per world millimetre; the published constants below are world millimetres. `ankleHeight`: Lateral malleolus height, calibration mm: the foot's `ankleHeight` input.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLegBones.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `stature`, `scale`, `ankleHeight`, `medial`, `hipForward`, `ankleForward`; callers supply the complete record.
   */
  export interface IInput {
    /** Stature, calibration mm. */
    stature: number;

    /** Calibration millimetres per world millimetre; the published constants below are world millimetres. */
    scale: number;

    /** Lateral malleolus height, calibration mm: the foot's `ankleHeight` input. */
    ankleHeight: number;

    /** Medial over lateral malleolus height (the foot prior's convention, Gray 1918: the medial stands higher). */
    medial: number;

    /** Forward place of the hip centre, calibration mm: under the trunk's crotch ring. */
    hipForward: number;

    /** Forward place of the ankle centre, calibration mm: the foot's stance. */
    ankleForward: number;
  }
}

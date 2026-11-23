import type { IAutoMovieHumanCalibrationBone } from "../generation/IAutoMovieHumanCalibrationBone";

/**
 * Bind-joint records augmented with the outgoing segment's millimetre girth
 * radius. Runtime construction and admission remain with
 * AutoMovieHumanJointCentres in Human.
 */
export namespace IAutoMovieHumanJointCentres {
  /** One joint: a bone's origin, parent, segment direction and girth. */
  export interface IJoint extends IAutoMovieHumanCalibrationBone {
    /**
     * Skin girth radius of the segment leaving this joint, mm: perimeter / 2pi
     * at its middle.
     */
    radius: number;
  }
}

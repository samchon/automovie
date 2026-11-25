import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";

/**
 * Contracts used by turnHumanPosture, HumanTrunk.resolve,
 * HumanCarriedLift.over.mix, resolveHumanPosture.seeded.
 */
export namespace IAutoMovieMotionHumanTurnHumanPosture {
  /** A posture's root and goals after its whole-body rotation. */
  export interface ITurned {
    /** The root's world position, metres. */
    position: IAutoMovieVector3;

    /** The root's world rotation, unit. */
    rotation: IAutoMovieQuaternion;

    /** The limb goals, world goals turned and attached ones kept. */
    limbs: IAutoMovieMotionHumanPosture["limbs"];
  }
}

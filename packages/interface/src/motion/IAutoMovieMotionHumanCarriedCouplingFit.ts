import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The key pose of a coupled carry placed on its bearer: the bearer's stance and
 * the borne legs changed least from the upright bearer and the carry's own legs
 * so every hold's wrist goal lies within its arm, the borne resting region
 * exactly on the bearer's, its turn about that point fitted to the row's hold
 * places. `HumanCarriedCoupling` builds the coupling on it.
 */
export namespace IAutoMovieMotionHumanCarriedCouplingFit {
  /**
   * The key pose's placement on the bearer: the bearer's stance, the borne
   * legs, the turn and where it puts a point of the key pose at the origin.
   */
  export interface IFit {
    /**
     * The bearer's stance (`HumanCarriedCouplingPose.stance`): trunk
     * inclination, degrees, and lowering, a share of a squat's drop.
     */
    stance: {
      /** Forward trunk inclination in degrees. */
      incline: number;
      /**
       * Lowering as a share of the body's squat drop in [0, 1]; zero is the
       * standing alignment.
       */
      depth: number;
    };

    /**
     * Both legs' hip flexion, knee flexion and hip abduction the key pose
     * takes, degrees.
     */
    legs: readonly [number, number, number];

    /** The turn applied after the key pose's own heading, unit quaternion. */
    turn: IAutoMovieQuaternion;

    /**
     * A point of the key pose at the origin, placed on the bearer.
     *
     * @param point World metres on the key pose at the origin.
     * @returns World metres on the bearer in its stance at the origin.
     */
    place(point: IAutoMovieVector3): IAutoMovieVector3;
  }
}

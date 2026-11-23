import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * The key pose of a coupled carry placed on its bearer (#3437): the
 * bearer's stance and the borne legs changed least from the upright bearer
 * and the carry's own legs so every hold's wrist goal lies within its arm, the borne
 * resting region exactly on the bearer's, its turn about that point fitted
 * to the row's hold places. `HumanCarriedCoupling` builds the coupling on it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation stance: The bearer's stance (`HumanCarriedCouplingPose.stance`): trunk inclination, degrees, and lowering, a share of a squat's drop. legs: Both legs' hip flexion, knee flexion and hip abduction the key pose takes, degrees.
 * @evidence contracts/development/design.md#principled-representation stance: The bearer's stance (`HumanCarriedCouplingPose.stance`): trunk inclination, degrees, and lowering, a share of a squat's drop. legs: Both legs' hip flexion, knee flexion and hip abduction the key pose takes, degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.fit, return); lexicon/HumanCarriedCouplingRigid.ts (HumanCarriedCouplingRigid.read, return); lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.couple); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.fit.gaps).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieQuaternion, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanCarriedCouplingFit {
  /**
   * The key pose's placement on the bearer: the bearer's stance, the borne
   * legs, the turn and where it puts a point of the key pose at the origin.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the members and their frames.
   * @evidence contracts/development/design.md#principled-representation A rigid map as its turn and its point map, so callers place any point the same way, with the two postures it maps between.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The stance, the legs, the turn and the point map.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The point map keeps the resting contact exact; no caller rebuilds it.
   */
  export interface IFit {
    /** The bearer's stance (`HumanCarriedCouplingPose.stance`): trunk inclination, degrees, and lowering, a share of a squat's drop. */
    stance: {
      /** Forward trunk inclination in degrees. */
      incline: number;
      /** Lowering as a share of the body's squat drop in [0, 1]; zero is the standing alignment. */
      depth: number;
    };

    /** Both legs' hip flexion, knee flexion and hip abduction the key pose takes, degrees. */
    legs: readonly [number, number, number];

    /** The turn applied after the key pose's own heading, unit quaternion. */
    turn: IAutoMovieQuaternion;

    /**
     * A point of the key pose at the origin, placed on the bearer.
     *
     * @param point World metres on the key pose at the origin.
     * @returns World metres on the bearer in its stance at the origin.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanCarriedCouplingFit.IFit.place: A point of the key pose at the origin, placed on the bearer.
     */
    place(point: IAutoMovieVector3): IAutoMovieVector3;
  }
}

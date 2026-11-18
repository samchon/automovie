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
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanCarriedCouplingFit.IFit.place is used through packages/motions/src/lexicon/HumanCarriedCouplingFit.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanCarriedCouplingFit.IFit.place is used through packages/motions/src/lexicon/HumanCarriedCouplingFit.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanCarriedCouplingFit.IFit.place is used through packages/motions/src/lexicon/HumanCarriedCouplingFit.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanCarriedCouplingFit.IFit.place is used through packages/motions/src/lexicon/HumanCarriedCouplingFit.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanCarriedCouplingFit.IFit.place is used through packages/motions/src/lexicon/HumanCarriedCouplingFit.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanCarriedCouplingFit.IFit.place is used through packages/motions/src/lexicon/HumanCarriedCouplingFit.ts.
     */
    place(point: IAutoMovieVector3): IAutoMovieVector3;
  }
}

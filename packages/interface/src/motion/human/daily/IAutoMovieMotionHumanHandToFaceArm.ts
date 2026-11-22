import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanTarget } from "../compose/IAutoMovieMotionHumanTarget";
import type { IAutoMovieMotionHumanTouchDrink } from "../compose/IAutoMovieMotionHumanTouchDrink";
import type { IAutoMovieMotionHumanTouchEffector } from "../compose/IAutoMovieMotionHumanTouchEffector";
import type { IAutoMovieMotionHumanTouchForm } from "../compose/IAutoMovieMotionHumanTouchForm";
import type { IAutoMovieMotionHumanGrasp } from "../handling/IAutoMovieMotionHumanGrasp";
import type { IAutoMovieMotionHumanTouch } from "../next/IAutoMovieMotionHumanTouch";
import type { IAutoMovieHumanLimbGoal } from "../posture/IAutoMovieHumanLimbGoal";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * The arm a hand-to-face task lays on its place (`handToFace`): how the
 * effector lies, the elbow's hint and the reference every second's fit is
 * held to, and, for a held vessel, its lean toward the lips and the way it
 * faces.
 *
 * @evidence contracts/development/common.md#meaningful-documentation lean: A vessel's lean toward the lips, degrees; absent for no vessel. facing: The level direction a vessel faces against; absent for no vessel searched. own: The grasp a held tool was taken up by, which keeps its turn; null for none.
 * @evidence contracts/development/design.md#principled-representation lean: A vessel's lean toward the lips, degrees; absent for no vessel. facing: The level direction a vessel faces against; absent for no vessel searched. own: The grasp a held tool was taken up by, which keeps its turn; null for none.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: daily/handToFaceArm.ts (handToFaceArm.of, return); daily/handToFaceArm.ts (handToFaceArm.of, props); daily/handToFace.ts (handToFace.plan); daily/handToFaceArm.ts (handToFaceArm.of).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanTouch.ITouch, IAutoMovieVector3, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanHandToFaceArm {
  /**
   * One hand's arm at the face. One hand's arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation lean: A vessel's lean toward the lips, degrees; absent for no vessel. facing: The level direction a vessel faces against; absent for no vessel searched.
   * @evidence contracts/development/design.md#principled-representation lean: A vessel's lean toward the lips, degrees; absent for no vessel. facing: The level direction a vessel faces against; absent for no vessel searched.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: daily/handToFaceArm.ts (handToFaceArm.of, return); daily/handToFace.ts (handToFace.plan); daily/handToFaceArm.ts (handToFaceArm.of).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanTouch.ITouch, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IArm {
    /** What the effector's along axis lies on. */
    lay: IAutoMovieMotionHumanTouch.ITouch["lay"];

    /** The elbow's hint, world. */
    bend: IAutoMovieVector3;

    /** The arm laid at the face, which every second's fit is held to. */
    reference: NonNullable<IAutoMovieMotionHumanTouch.ITouch["reference"]>;

    /** The goal that lays the hand at the face, the one the reference solves: the action's reach is timed to it. */
    goal: IAutoMovieHumanLimbGoal;

    /** A vessel's lean toward the lips, degrees; absent for no vessel. */
    lean?: number;

    /** The level direction a vessel faces against; absent for no vessel searched. */
    facing?: IAutoMovieVector3;
  }

  /**
   * One hand's arm at the face. What `of` reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation own: The grasp a held tool was taken up by, which keeps its turn; null for none.
   * @evidence contracts/development/design.md#principled-representation own: The grasp a held tool was taken up by, which keeps its turn; null for none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: daily/handToFaceArm.ts (handToFaceArm.of, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, AutoMovieHumanSide, IAutoMovieMotionHumanTouchEffector.IEffector, IAutoMovieMotionHumanTarget.IPlace identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The entry with the head at the face as the hand arrives. */
    atFace: IAutoMovieMotionHumanPosture;

    /** The entry with the head turned, as a drinker's is in the drinking phase. */
    turned: IAutoMovieMotionHumanPosture;

    /** The hand. */
    side: AutoMovieHumanSide;

    /** The hand's effector. */
    effector: IAutoMovieMotionHumanTouchEffector.IEffector;

    /**
     * The hand's place at a posture and second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanHandToFaceArm.IProps.place: The hand's place at a posture and second.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHandToFaceArm.IProps.place is used through packages/motions/src/daily/handToFace.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHandToFaceArm.IProps.place is used through packages/motions/src/daily/handToFace.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHandToFaceArm.IProps.place is used through packages/motions/src/daily/handToFace.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHandToFaceArm.IProps.place is used through packages/motions/src/daily/handToFace.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHandToFaceArm.IProps.place is used through packages/motions/src/daily/handToFace.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHandToFaceArm.IProps.place is used through packages/motions/src/daily/handToFace.ts.
     */
    place: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ) => Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">;

    /** The row's tangent. */
    tangent: IAutoMovieMotionHumanTouchForm.Tangent;

    /** Whether the row holds its effector upright, a vessel. */
    upright: boolean;

    /** The grasp a held tool was taken up by, which keeps its turn; null for none. */
    own: IAutoMovieMotionHumanGrasp.IKey | null;

    /** The drink a held vessel's rim side was admitted with (`handToFaceVessel`), whose effector is `effector`; searched here for an upright effector without one. */
    drink?: IAutoMovieMotionHumanTouchDrink.IDrink;
  }
}

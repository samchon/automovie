import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanTarget } from "../compose/IAutoMovieMotionHumanTarget";
import type { IAutoMovieMotionHumanTouchEffector } from "../compose/IAutoMovieMotionHumanTouchEffector";
import type { IAutoMovieMotionHumanTouchForm } from "../compose/IAutoMovieMotionHumanTouchForm";
import type { IAutoMovieMotionHumanGrasp } from "../handling/IAutoMovieMotionHumanGrasp";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanTouch } from "../touch/IAutoMovieMotionHumanTouch";

/**
 * The arm a hand-to-face task lays on its place (`handToFace`): how the
 * effector lies, the elbow's hint and the reference every second's fit is
 * held to, and, for a held vessel, its lean toward the lips and the way it
 * faces.
 *
 * @evidence contracts/development/common.md#meaningful-documentation lean: A vessel's lean toward the lips, degrees; absent for no vessel. facing: The level direction a vessel faces against; absent for no vessel searched. own: The grasp a held tool was taken up by, which keeps its turn; null for none.
 * @evidence contracts/development/design.md#principled-representation lean: A vessel's lean toward the lips, degrees; absent for no vessel. facing: The level direction a vessel faces against; absent for no vessel searched. own: The grasp a held tool was taken up by, which keeps its turn; null for none.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: daily/handToFaceArm.ts (handToFaceArm.of, return); daily/handToFaceArm.ts (handToFaceArm.of, props); daily/handToFace.ts (handToFace.plan); daily/handToFaceArm.ts (handToFaceArm.of).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanTouch.ITouch, IAutoMovieVector3, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanHand.Side identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
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
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanHand.Side, IAutoMovieMotionHumanTouchEffector.IEffector, IAutoMovieMotionHumanTarget.IPlace identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The entry with the head at the face as the hand arrives. */
    atFace: IAutoMovieMotionHumanPosture;

    /** The entry with the head turned, as a drinker's is in the drinking phase. */
    turned: IAutoMovieMotionHumanPosture;

    /** The hand. */
    side: IAutoMovieMotionHumanHand.Side;

    /** The hand's effector. */
    effector: IAutoMovieMotionHumanTouchEffector.IEffector;

    /** The hand's place at a posture and second. */
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
  }
}

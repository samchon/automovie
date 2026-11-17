import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieHumanLimbGoal } from "../posture/IAutoMovieHumanLimbGoal";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * Contracts used by HumanMountRider.hold.
 *
 * @evidence contracts/development/common.md#meaningful-documentation point: Grip contact point in world metres. radius: Grip radius in metres; defaults to zero for a surface contact.
 * @evidence contracts/development/design.md#principled-representation point: Grip contact point in world metres. radius: Grip radius in metres; defaults to zero for a surface contact.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanMountRider.ts (HumanMountRider.hold, grip); lexicon/HumanMountRider.ts (HumanMountRider.hold, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieHumanLimbGoal, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanMountRider {
  /**
   * A hand holding a grip, a rein or a rim: where its wrist goes, how the hand turns and how its fingers close, a share of the way from where the posture's own joints hold the hand. Input grip of HumanMountRider.hold. The held point and its outward unit normal, world, the unit axis the grip runs along when it has one, its radius, metres, when the object states one, and the side of the axis the fingers lie on (the sign of the axis crossed with the normal) when a hold keeps the side it was taken from; the side the body faces when absent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: Grip contact point in world metres. radius: Grip radius in metres; defaults to zero for a surface contact.
   * @evidence contracts/development/design.md#principled-representation point: Grip contact point in world metres. radius: Grip radius in metres; defaults to zero for a surface contact.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanMountRider.ts (HumanMountRider.hold, grip).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IHoldGrip = {
    /** Grip contact point in world metres. */
    point: IAutoMovieVector3;
    /** Grip outward surface normal in world coordinates. */
    normal: IAutoMovieVector3;
    /** Optional world direction of the grip's long axis; without it fingers follow the body's forward direction. */
    axis?: IAutoMovieVector3;
    /** Grip radius in metres; defaults to zero for a surface contact. */
    radius?: number;
    /** Sign selecting which direction along axis cross normal the fingers face; omitted chooses the direction nearer body-forward. */
    across?: 1 | -1;
  };

  /**
   * A hand holding a grip, a rein or a rim: where its wrist goes, how the hand turns and how its fingers close, a share of the way from where the posture's own joints hold the hand. Result returned by HumanMountRider.hold. The arm's goal and the hand's finger joints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation arm: World-space arm goal fitting the wrist to the grip. fingers: Clinical-degree finger rotations blended from the open pose to the supplied closure.
   * @evidence contracts/development/design.md#principled-representation arm: World-space arm goal fitting the wrist to the grip. fingers: Clinical-degree finger rotations blended from the open pose to the supplied closure.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanMountRider.ts (HumanMountRider.hold, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieHumanLimbGoal, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IHoldResult = {
    /** World-space arm goal fitting the wrist to the grip. */
    arm: IAutoMovieHumanLimbGoal;
    /** Clinical-degree finger rotations blended from the open pose to the supplied closure. */
    fingers: IAutoMovieMotionHumanPosture["joints"];
  };
}

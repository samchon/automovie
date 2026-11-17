import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Contracts used by HumanPropFrame.bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation worldPosition: Resolved bone origin in world metres.
 * @evidence contracts/development/design.md#principled-representation worldPosition: Resolved bone origin in world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPropFrame.ts (HumanPropFrame.bone, bone).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanPropFrame {
  /**
   * A resolved bone's world frame. Input bone of HumanPropFrame.bone. The bone's world position and rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation worldPosition: Resolved bone origin in world metres.
   * @evidence contracts/development/design.md#principled-representation worldPosition: Resolved bone origin in world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPropFrame.ts (HumanPropFrame.bone, bone).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IBoneBone = {
    /** Resolved bone origin in world metres. */
    worldPosition: IAutoMovieVector3;
    /** Resolved bone orientation as a world unit quaternion. */
    worldRotation: IAutoMovieQuaternion;
  };
}

import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * An authored shot cue for the visible polygon body. The cue moves the
 * selected rigid part and its descendants at source time. A bend follows
 * the living pose's joint. A detached part leaves from the cue's sampled
 * pose and then follows the authored shot-world displacement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the source clock, supported branch and the two transform frames.
 * @evidence contracts/development/design.md#principled-representation Separates a live joint-relative rotation from a release pose with an independent world displacement.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shares the canonical bone, quaternion and vector types. The shot owns timing and the polygon renderer owns display.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Inputs describe visual poses on an explicit clock. Anatomical limits, dynamics and collision geometry remain with their regular owners.
 */
export type IAutoMoviePolygonBodyCue = {
  /** Id of the staged actor whose polygon drawing receives the cue. */
  readonly subject: string;

  /** Root of a branch with a visible polygon part. The body drawing has no eye or jaw branches. */
  readonly bone: Exclude<AutoMovieHumanoidBone, "leftEye" | "rightEye" | "jaw">;

  /** Cue start in shot-local seconds. */
  readonly at: number;

  /** Transition length in seconds. Zero selects the final transform at the cue. */
  readonly duration: number;
} & (
  | {
      /** Bend the visible branch about the current bone's origin. */
      readonly kind: "bend";
      /** Final unit-quaternion turn in the current bone's local frame. */
      readonly rotation: IAutoMovieQuaternion;
    }
  | {
      /** Release the displayed branch from the pose at the cue. */
      readonly kind: "detach";
      /** Final unit-quaternion turn in shot-world axes about the release origin. */
      readonly rotation: IAutoMovieQuaternion;
      /** Final displacement of the release origin in shot-world metres. */
      readonly translation: IAutoMovieVector3;
    }
);

import type { IAutoMovieHumanNeutralBody } from "./IAutoMovieHumanNeutralBody";
import { AutoMovieHumanNeutralTurn as Turn } from "./AutoMovieHumanNeutralTurn";
import type { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/** The knee's neutral: the shank plumb under the knee, straight on the thigh (Neutral-0: extension is the zero of knee flexion). */
export namespace AutoMovieHumanNeutralKnee {
  /**
   * Derive one knee's neutral.
   *
   * @param body The bind skeleton.
   * @param side Which leg.
   * @param thigh The thigh's world turn.
   * @returns The shank's world turn.
   */
  export function derive(
    body: IAutoMovieHumanNeutralBody,
    side: "left" | "right",
    thigh: Math3D.Quaternion,
  ): Math3D.Quaternion {
    return Turn.straighten(body, `${side}LowerLeg`, thigh, Turn.DOWN);
  }
}

import type { IAutoMovieHumanNeutralBody } from "./IAutoMovieHumanNeutralBody";
import { AutoMovieHumanNeutralTurn as Turn } from "./AutoMovieHumanNeutralTurn";
import type { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The elbow's neutral: straight (Neutral-0: extension is the zero of elbow
 * flexion), the forearm laid on the arm's line.
 */
export namespace AutoMovieHumanNeutralElbow {
  /**
   * Derive one elbow's neutral.
   *
   * @param body The bind skeleton.
   * @param side Which arm.
   * @param upper The upper arm's world turn.
   * @param down The arm's unit direction at neutral.
   * @returns The forearm's world turn before its twist.
   */
  export function derive(
    body: IAutoMovieHumanNeutralBody,
    side: "left" | "right",
    upper: Math3D.Quaternion,
    down: Math3D.Vector,
  ): Math3D.Quaternion {
    return Turn.straighten(body, `${side}LowerArm`, upper, down);
  }
}

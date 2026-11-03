import type { IAutoMovieHumanNeutralBody } from "./IAutoMovieHumanNeutralBody";
import { AutoMovieHumanNeutralTurn as Turn } from "./AutoMovieHumanNeutralTurn";
import type { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The wrist's neutral: straight (Neutral-0: the hand on the forearm's line),
 * before the forearm's twist is put on it.
 */
export namespace AutoMovieHumanNeutralWrist {
  /**
   * Derive one wrist's neutral.
   *
   * @param body The bind skeleton.
   * @param side Which hand.
   * @param straight The forearm's world turn before its twist.
   * @param down The arm's unit direction at neutral.
   * @returns The hand's world turn before the forearm's twist.
   */
  export function derive(
    body: IAutoMovieHumanNeutralBody,
    side: "left" | "right",
    straight: Math3D.Quaternion,
    down: Math3D.Vector,
  ): Math3D.Quaternion {
    return Turn.straighten(body, `${side}Hand`, straight, down);
  }
}

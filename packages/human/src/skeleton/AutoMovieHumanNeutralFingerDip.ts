import type { IAutoMovieHumanNeutralBody } from "./IAutoMovieHumanNeutralBody";
import { AutoMovieHumanNeutralTurn as Turn } from "./AutoMovieHumanNeutralTurn";
import type { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/** A finger's distal interphalangeal neutral: the distal phalanx straight on the middle one. */
export namespace AutoMovieHumanNeutralFingerDip {
  /**
   * Derive one finger's distal phalanx.
   *
   * @param body The bind skeleton.
   * @param side Which hand.
   * @param finger Which finger.
   * @param middle The middle phalanx's world turn.
   * @param down The arm's unit direction at neutral.
   * @returns The distal phalanx's world turn.
   */
  export function derive(
    body: IAutoMovieHumanNeutralBody,
    side: "left" | "right",
    finger: string,
    middle: Math3D.Quaternion,
    down: Math3D.Vector,
  ): Math3D.Quaternion {
    return Turn.straighten(body, `${side}${finger}Distal`, middle, down);
  }
}

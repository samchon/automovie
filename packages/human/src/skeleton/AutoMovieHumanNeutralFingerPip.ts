import type { IAutoMovieHumanNeutralBody } from "./IAutoMovieHumanNeutralBody";
import { AutoMovieHumanNeutralTurn as Turn } from "./AutoMovieHumanNeutralTurn";
import type { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/** A finger's proximal interphalangeal neutral: the middle phalanx straight on the proximal one. */
export namespace AutoMovieHumanNeutralFingerPip {
  /**
   * Derive one finger's middle phalanx.
   *
   * @param body The bind skeleton.
   * @param side Which hand.
   * @param finger Which finger.
   * @param proximal The proximal phalanx's world turn.
   * @param down The arm's unit direction at neutral.
   * @returns The middle phalanx's world turn.
   */
  export function derive(
    body: IAutoMovieHumanNeutralBody,
    side: "left" | "right",
    finger: string,
    proximal: Math3D.Quaternion,
    down: Math3D.Vector,
  ): Math3D.Quaternion {
    return Turn.straighten(body, `${side}${finger}Intermediate`, proximal, down);
  }
}

import type { IAutoMovieHumanNeutralBody } from "./IAutoMovieHumanNeutralBody";
import { AutoMovieHumanNeutralTurn as Turn } from "./AutoMovieHumanNeutralTurn";
import type { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/** The thumb's metacarpophalangeal neutral: the proximal phalanx straight on its metacarpal. */
export namespace AutoMovieHumanNeutralThumbMcp {
  /**
   * Derive one thumb's proximal phalanx.
   *
   * @param body The bind skeleton.
   * @param side Which hand.
   * @param metacarpal The metacarpal's world turn.
   * @param along The line the thumb lies along.
   * @returns The proximal phalanx's world turn.
   */
  export function derive(
    body: IAutoMovieHumanNeutralBody,
    side: "left" | "right",
    metacarpal: Math3D.Quaternion,
    along: Math3D.Vector,
  ): Math3D.Quaternion {
    return Turn.straighten(body, `${side}ThumbProximal`, metacarpal, along);
  }
}

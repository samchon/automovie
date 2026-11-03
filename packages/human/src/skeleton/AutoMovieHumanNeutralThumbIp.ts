import type { IAutoMovieHumanNeutralBody } from "./IAutoMovieHumanNeutralBody";
import { AutoMovieHumanNeutralTurn as Turn } from "./AutoMovieHumanNeutralTurn";
import type { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/** The thumb's interphalangeal neutral: the distal phalanx straight on the proximal one. */
export namespace AutoMovieHumanNeutralThumbIp {
  /**
   * Derive one thumb's distal phalanx.
   *
   * @param body The bind skeleton.
   * @param side Which hand.
   * @param proximal The proximal phalanx's world turn.
   * @param along The line the thumb lies along.
   * @returns The distal phalanx's world turn.
   */
  export function derive(
    body: IAutoMovieHumanNeutralBody,
    side: "left" | "right",
    proximal: Math3D.Quaternion,
    along: Math3D.Vector,
  ): Math3D.Quaternion {
    return Turn.straighten(body, `${side}ThumbDistal`, proximal, along);
  }
}

import type { IAutoMovieHumanNeutralBody } from "./IAutoMovieHumanNeutralBody";
import { AutoMovieHumanNeutralTurn as Turn } from "./AutoMovieHumanNeutralTurn";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The forearm's neutral: thumb forward.
 *
 * The forearm's zero is the mid position its range of motion is measured from
 * (thumbs forward, Neutral-0: DGUV F 4030), not palms forward, which is the
 * forearm fully supinated. The turn the bind's hand needs to bring its radial
 * side to the front is the achieved rotation, shared between the elbow end and
 * the wrist end of the one forearm bone.
 */
export namespace AutoMovieHumanNeutralForearm {
  /** One forearm's neutral. */
  export interface IOutput {
    /** The forearm bone's world turn, which carries its share of the twist. */
    lower: Math3D.Quaternion;

    /** The hand's world turn, which carries the rest. */
    hand: Math3D.Quaternion;

    /** The achieved pronation from thumbs forward, degrees. */
    pronation: number;
  }

  /** Share of the forearm's twist the wrist carries. */
  export const WRIST_TWIST: number = 0.5;

  /**
   * Derive one forearm's neutral.
   *
   * @param body The bind skeleton.
   * @param side Which arm.
   * @param straight The forearm's world turn before its twist.
   * @param bent The hand's world turn before the twist.
   * @param down The arm's unit direction at neutral.
   * @returns The forearm's and hand's turns and the achieved pronation.
   */
  export function derive(
    body: IAutoMovieHumanNeutralBody,
    side: "left" | "right",
    straight: Math3D.Quaternion,
    bent: Math3D.Quaternion,
    down: Math3D.Vector,
  ): IOutput {
    const s: number = side === "left" ? 1 : -1;

    // The hand's radial side comes to the front; the turn is the achieved
    // forearm rotation.
    const radial: Math3D.Vector = Math3D.unit(
      Turn.perpendicular(
        Math3D.rotate(
          bent,
          body.between(`${side}LittleProximal`, `${side}IndexProximal`),
        ),
        down,
      ),
    );
    const rotation: number = Math.atan2(
      Turn.dot(Turn.cross(radial, Turn.FORWARD), down),
      Turn.dot(radial, Turn.FORWARD),
    );
    const twist: (share: number) => Math3D.Quaternion = (
      share: number,
    ): Math3D.Quaternion =>
      Math3D.fromAxisAngle(down, (rotation * share * 180) / Math.PI);
    return {
      lower: Math3D.multiply(twist(1 - WRIST_TWIST), straight),
      hand: Math3D.multiply(twist(1), bent),
      pronation: (s * rotation * 180) / Math.PI,
    };
  }
}

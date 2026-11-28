import { AutoMovieHumanPoseChannels } from "./AutoMovieHumanPoseChannels";

/**
 * The lumbopelvic share of a hip flexion: the groin piece's carrier.
 *
 * A clinical hip flexion is read between the thigh and the trunk, and the
 * pelvis carries a share of it by turning back: between a quarter and a third,
 * from the start of the movement (Bohannon 1985). The pelvis turns as far as
 * the other hip's extension lets the other thigh keep its place; the skeleton
 * hands the turn back to the spine and both thighs, so every requested
 * direction holds while the pelvis and its skin turn.
 */
export namespace AutoMovieHumanPelvicShare {
  /**
   * Dimensionless fraction of clinical hip flexion carried by the pelvis
   * before the opposite hip's extension limit applies. The value is 7/24, the
   * midpoint of one quarter and one third.
   */
  export const SHARE: number = 7 / 24;

  /**
   * Positive nominal hip extension allowance in clinical degrees. Derived from
   * the negative lower bound of the canonical hip flexion channel.
   */
  export const EXTENSION: number = -AutoMovieHumanPoseChannels.find(
    (row): boolean => row[0] === "legs.<side>.hip.flexion",
  )![4];

  /**
   * Read the nonnegative posterior pelvis tilt in degrees given left and right
   * clinical hip flexions. The share of the larger flexion is capped by the
   * other hip's available extension.
   */
  export function tilt(left: number, right: number): number {
    // The share of the larger flexion, bounded so the less flexed thigh keeps
    // its world direction within its hip's extension range (derived); the
    // skeleton turns the pelvis back by this about its flexion axis.
    return Math.max(
      0,
      Math.min(SHARE * Math.max(left, right), Math.min(left, right) + EXTENSION),
    );
  }

  /**
   * Read the hip joint's own flexion in degrees when the other thigh is down.
   * Positive clinical flexion loses the corresponding pelvis share. Extension
   * is carried through.
   */
  export function joint(flexion: number): number {
    return flexion > 0 ? flexion - tilt(flexion, 0) : flexion;
  }
}

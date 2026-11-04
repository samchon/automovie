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
   * Share of a clinical hip flexion the pelvis carries: Bohannon 1985 measured
   * a quarter to a third (measured range), taken at its midpoint 7/24
   * (convention, the abstract gives no mean).
   */
  export const SHARE: number = 7 / 24;

  /** The hip's extension range, degrees, read from the pose channels (AAOS): how far the other hip lets the pelvis turn back. */
  export const EXTENSION: number = -AutoMovieHumanPoseChannels.find(
    (row): boolean => row[0] === "legs.<side>.hip.flexion",
  )![4];

  /**
   * The pelvis's backward turn for both hips' clinical flexions.
   *
   * @param left Left hip flexion, degrees.
   * @param right Right hip flexion, degrees.
   * @returns The posterior tilt, degrees, never negative.
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
   * The largest turn a hip joint itself makes for a clinical flexion: least
   * pelvic help, with the other thigh down.
   *
   * @param flexion A clinical hip flexion, degrees.
   * @returns The hip joint's own flexion, degrees.
   */
  export function joint(flexion: number): number {
    return flexion > 0 ? flexion - tilt(flexion, 0) : flexion;
  }
}

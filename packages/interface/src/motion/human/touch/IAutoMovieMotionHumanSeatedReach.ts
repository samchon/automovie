import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";

/**
 * A seated reach with the trunk below the arm in task priority: the hand's
 * target first, and when the arm alone falls short, a lean of the trunk
 * forward, which the seat bears: the hips flex the trunk over the seat and
 * the spine's three joints flex above them, each within the flexion room
 * its range leaves. The joints share the lean in one share of each one's
 * room, and two seated partners in one share of each one's chain, the
 * joint-limit-weighted least-norm resolution of the redundancy (Chan and
 * Dubey 1995, "A weighted least-norm solution based scheme for avoiding
 * joint limits for redundant joint manipulators", IEEE Trans. Robot. Autom.
 * 11(2)): each joint's motion weighted by its range, so none reaches its
 * limit before another.
 *
 * A standing body leans none here: its reach stays its arm's, as the
 * standing laws already plan it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation room: Degrees of flexion the range still leaves.
 * @evidence contracts/development/design.md#principled-representation room: Degrees of flexion the range still leaves.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: touch/HumanSeatedReach.ts (HumanSeatedReach.rooms, return); touch/HumanSeatedReach.ts (HumanSeatedReach.rooms.joints, return); touch/HumanSeatedReach.ts (HumanSeatedReach.rooms, j); touch/HumanSeatedReach.ts (HumanSeatedReach.lean, joints); touch/HumanSeatedReach.ts (HumanSeatedReach.lean.pivots, j); touch/HumanSeatedReach.ts (HumanSeatedReach.lean, j).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanSeatedReach {
  /**
   * One joint of a seated lean: the bone it turns about and the flexion
   * room its range leaves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation A joint and its room, the data the weighted resolution reads.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The hips stand for the hip joints, which turn the trunk over the seat.
   */
  export interface IJoint {
    /** The bone the trunk turns about: `hips` for the hip joints, a spine bone otherwise. */
    bone: AutoMovieHumanoidBone;

    /** Degrees of flexion the range still leaves. */
    room: number;
  }

  /**
   * One seated role's own least share of its joints' rooms that brings a point within its arm's limit: none when the arm reaches it, the whole room when nothing less does. Result returned by HumanSeatedReach.need. The share and the joints it is a share of.
   *
   * @evidence contracts/development/common.md#meaningful-documentation share: Common share in [0, 1] of every eligible trunk joint's remaining flexion room. Zero is returned when joints is empty, even if the target cannot be reached; 1 may mean a feasible endpoint or saturation while still unreachable. The subsequent arm fit judges the actual miss. joints: Eligible trunk bones with their remaining available flexion in degrees; these are available rooms, not applied joint rotations or a certificate that the target is reachable.
   * @evidence contracts/development/design.md#principled-representation share: Common share in [0, 1] of every eligible trunk joint's remaining flexion room. Zero is returned when joints is empty, even if the target cannot be reached; 1 may mean a feasible endpoint or saturation while still unreachable. The subsequent arm fit judges the actual miss. joints: Eligible trunk bones with their remaining available flexion in degrees; these are available rooms, not applied joint rotations or a certificate that the target is reachable.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: touch/HumanSeatedReach.ts (HumanSeatedReach.need, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanSeatedReach.IJoint identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type INeedResult = {
    /** Common share in [0, 1] of every eligible trunk joint's remaining flexion room. Zero is returned when joints is empty, even if the target cannot be reached; 1 may mean a feasible endpoint or saturation while still unreachable. The subsequent arm fit judges the actual miss. */
    share: number;
    /** Eligible trunk bones with their remaining available flexion in degrees; these are available rooms, not applied joint rotations or a certificate that the target is reachable. */
    joints: IAutoMovieMotionHumanSeatedReach.IJoint[];
  };
}

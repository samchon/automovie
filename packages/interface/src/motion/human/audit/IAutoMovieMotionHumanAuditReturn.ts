import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";

/**
 * Whether a body is back where it was: how far the joint centres of one
 * instant are from the same centres of an earlier instant.
 *
 * An action that says it returns to its entry (a wave that lowers the arm
 * again, a squat that stands back up, a punch that comes back to guard)
 * shows the entry's body at its end. Two readings tell the two ways that can
 * fail apart. `world` is the largest distance between a joint centre at the
 * two instants as displayed, so it also reads a body that kept its form but
 * drifted or turned. `shape` reads the same after each instant's centres are
 * expressed in that instant's own pelvis frame (origin at the hips, axes the
 * hips' orientation), so it reads the body's form alone: a walker who ends
 * in the stance they began in, two metres on and facing another way, has a
 * `shape` of zero and a `world` of two metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation world: The largest distance between a joint centre at the two instants, world frame, metres, with the bone, at the later instant. shape: The same in each instant's own pelvis frame, metres.
 * @evidence contracts/development/design.md#principled-representation world: The largest distance between a joint centre at the two instants, world frame, metres, with the bone, at the later instant. shape: The same in each instant's own pelvis frame, metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/AutoMovieMotionHumanAuditReturn.ts (AutoMovieMotionHumanAuditReturn.measure, return); audit/AutoMovieMotionHumanAuditReturn.ts (AutoMovieMotionHumanAuditReturn.measure).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanAuditMeasure identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanAuditReturn {
  /**
   * What the reading found.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and its frame.
   * @evidence contracts/development/design.md#principled-representation Form and placement apart, since an action may promise one without the other.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, each asserted by the audit's test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member.
   */
  export interface IResult {
    /** The largest distance between a joint centre at the two instants, world frame, metres, with the bone, at the later instant. */
    world: IAutoMovieMotionHumanAuditMeasure;

    /** The same in each instant's own pelvis frame, metres. */
    shape: IAutoMovieMotionHumanAuditMeasure;
  }
}

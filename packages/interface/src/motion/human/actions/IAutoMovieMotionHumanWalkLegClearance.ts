import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieMotionHumanLegChain } from "../posture/IAutoMovieMotionHumanLegChain";

/**
 * How far two legs of one body pass into each other, read as the tangle
 * audit reads them: each leg posed as the posture shows it (its hip, knee
 * and ankle and its thigh's and shank's rotations, `HumanLegChain`, and its
 * foot's rotation), and the deepest probe of either leg's thigh, shank, foot
 * or toes in a segment of the other beyond the probe's own reference depth
 * there (`AutoMovieMotionHumanAuditTangleModel.excess`). A planner that
 * keeps it within the audit's give (`AutoMovieMotionHumanAuditTangleModel.BUILT`)
 * keeps two legs that cross, as a sideways recovery's do, clear of each
 * other where the audit would find them run through each other.
 *
 * @evidence contracts/development/common.md#meaningful-documentation excess: The excess, metres. at: The binding piece read for the two legs moved, metres; equal to the excess for the legs read.
 * @evidence contracts/development/design.md#principled-representation excess: The excess, metres. at: The binding piece read for the two legs moved, metres; equal to the excess for the legs read.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkLegCapsules.ts (walkLegCapsules.bones, leg); actions/walkLegClearance.ts (walkLegClearance.placed, leg); actions/walkLegClearance.ts (walkLegClearance.reading, one); actions/walkLegClearance.ts (walkLegClearance.reading, other); actions/walkLegClearance.ts (walkLegClearance.reading.legs, leg); actions/walkLegClearance.ts (walkLegClearance.reading.segmentsOf, leg).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanWalkLegClearance {
  /**
   * A reading of two legs' clearance (`reading`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation The excess and its binding linear piece, as an active-set linearisation reads a piecewise-linear constraint.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by the stance course.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The piece is the audit's own reading of the binding probe.
   */
  export interface IReading {
    /** The excess, metres. */
    excess: number;

    /** The binding piece read for the two legs moved, metres; equal to the excess for the legs read. */
    at: (
      one: IAutoMovieMotionHumanWalkLegClearance.ILeg,
      other: IAutoMovieMotionHumanWalkLegClearance.ILeg,
    ) => number;
  }

  /**
   * A leg as posed (`IAutoMovieMotionHumanLegChain.IPosed`) with its side and its foot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame.
   * @evidence contracts/development/design.md#principled-representation The posed leg's joints and bones, and the foot's world rotation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The posed leg and two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `IAutoMovieMotionHumanLegChain.IPosed`.
   */
  export interface ILeg extends IAutoMovieMotionHumanLegChain.IPosed {
    /** The leg. */
    side: "left" | "right";

    /** The foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }
}

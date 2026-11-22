import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A supine quadrupedal crawl, the crab walk of horror films: from sitting,
 * the hands plant behind the hips and the pelvis lifts, and the body travels
 * on its hands and feet with the chest up, feet first or head first. The
 * full backbend variant arches the spine over so the head hangs reversed,
 * and is refused for a body whose spine cannot bend that far.
 *
 * The hands and the feet are the only floor contacts, and they step in the
 * diagonal sequence of a quadrupedal walk: a hand and the opposite foot
 * swing together while the other pair bears.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the entry, the contacts, the step sequence, the two leads and the backbend.
 * @evidence contracts/development/design.md#principled-representation A displacement in the performer's frame, a closed lead and the pelvis height in statures.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the `crabWalk` law reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A backbend beyond the spine's range is refused, never clamped.
 */
export namespace IAutoMovieMotionHumanCrabWalk {
  /**
   * Which end of the body leads the travel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two leading ends, feet first or head first.
   * @evidence contracts/development/design.md#principled-representation A closed union of the two travel directions along the body's long axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IParams.lead` reads it and `crabWalk.plan` branches on it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One literal per lead, with no optional fields to combine.
   */
  export type Lead = "feet" | "head";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation Metres in the performer's frame, a closed lead, a flag and statures.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `crabWalk.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The law refuses a height the arms and legs cannot hold.
   */
  export interface IParams {
    /** Where the root travels, metres in the performer's frame at the start: `+z` ahead of the body as it sat. */
    to: IAutoMovieVector3;

    /** Which end leads; `feet` when absent. */
    lead?: Lead;

    /** Whether the spine arches into a full backbend with the head reversed; false when absent. */
    backbend?: boolean;

    /** The pelvis's height above the floor, in statures; 0.22 when absent. */
    height?: number;
  }
}

import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Contracts used by StrikingBody.region.
 *
 * @evidence contracts/development/common.md#meaningful-documentation point: Struck body-region contact point in world metres. normal: Outward normal of the struck body region in world coordinates.
 * @evidence contracts/development/design.md#principled-representation point: Struck body-region contact point in world metres. normal: Outward normal of the struck body region in world coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/StrikingBody.ts (StrikingBody.region, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanStrikingBody {
  /**
   * A region of a body at its resolved bones. Result returned by StrikingBody.region. World point and outward normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: Struck body-region contact point in world metres. normal: Outward normal of the struck body region in world coordinates.
   * @evidence contracts/development/design.md#principled-representation point: Struck body-region contact point in world metres. normal: Outward normal of the struck body region in world coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/StrikingBody.ts (StrikingBody.region, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IRegionResult = {
    /** Struck body-region contact point in world metres. */
    point: IAutoMovieVector3;
    /** Outward normal of the struck body region in world coordinates. */
    normal: IAutoMovieVector3;
  };
}

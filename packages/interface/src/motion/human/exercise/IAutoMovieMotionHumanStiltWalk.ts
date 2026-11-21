import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A walk on stilts (#3997): each foot strapped on a stilt's platform, the
 * stilts' tips the only floor contacts, short steps on a wide base.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the walk and its contacts.
 * @evidence contracts/development/design.md#principled-representation The two stilts, the stop and the step count.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/stiltWalk.ts (stiltWalk.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The stilts are scene props, read by their own affordances.
 */
export namespace IAutoMovieMotionHumanStiltWalk {
  /**
   * The stilts worn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The prop under each foot.
   * @evidence contracts/development/design.md#principled-representation One scene id per foot.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two ids.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStilts {
    /** The stilt under the left foot. */
    left: string;

    /** The stilt under the right foot. */
    right: string;
  }

  /**
   * Parameters.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and support refusals.
   */
  export interface IParams {
    /** The stilts, each standing under its foot as the walk starts. */
    stilts: IStilts;

    /** The floor point to stop at, world metres. */
    to: IAutoMovieVector3;

    /** How many steps; the fewest short steps that reach `to` when absent.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    steps?: number;
  }
}

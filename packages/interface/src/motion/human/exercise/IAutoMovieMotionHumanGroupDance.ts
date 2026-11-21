import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanDance } from "./IAutoMovieMotionHumanDance";

/**
 * Social group dances on one shared beat (#4010), each member dancing the
 * same steps relative to the group:
 *
 * - line: a grapevine to the right and back to the left, the last count
 *   turning a quarter to the left, so every repeat faces the next wall and
 *   the rows keep their spacing;
 * - circle: members spaced evenly round a centre, hands joined with their
 *   neighbours, side-stepping round the centre so the circle rotates;
 * - conga: members in file, each with both hands on the shoulders of the
 *   one ahead, stepping three counts forward and kicking on the fourth.
 *
 * Each member's timing strays from the beat within `vary`, drawn from its
 * own seed, so a crowd does not dance cloned.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three dances and the seeded variation.
 * @evidence contracts/development/design.md#principled-representation A dance kind with the group geometry it needs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/groupDance.ts (groupDance.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
 */
export namespace IAutoMovieMotionHumanGroupDance {
  /**
   * The dances.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The dances' names.
   * @evidence contracts/development/design.md#principled-representation Closed choices "line", "circle", "conga".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/groupDance.ts (groupDance.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
   */
  export type Kind = "line" | "circle" | "conga";

  /**
   * Parameters.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The dance. */
    kind: Kind;

    /** Beats per minute; the dance law's `BPM` when absent.
     * Exclusive minimum: 0. Unit: "beats/min". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    bpm?: number;

    /** How many times the eight-count pattern is danced; 1 when absent.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    repeats?: number;

    /** A circle's centre on the floor, world metres. */
    centre?: IAutoMovieVector3;

    /** How many dance in the circle, so each member knows its neighbours.
     * Numeric representation: "uint32". Inclusive minimum: 3. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    members?: number;

    /** A circle member's neighbour on the left, whose right hand this one's left hand joins; open when absent. */
    left?: string;

    /** A circle member's neighbour on the right, whose left hand this one's right hand joins; open when absent. */
    right?: string;

    /** The conga member ahead, whose shoulders this one holds; the head of the line when absent. */
    ahead?: string;

    /** The most a member's timing strays from the beat, seconds, drawn from its seed; 0.02 when absent.
     * Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    vary?: number;

    /** A cue track to lock the beats to, as the dance law's. */
    lock?: IAutoMovieMotionHumanDance.IParams["lock"];
  }
}

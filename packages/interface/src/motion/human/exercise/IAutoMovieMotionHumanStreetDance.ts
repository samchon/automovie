import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanDance } from "./IAutoMovieMotionHumanDance";

/**
 * Street grooves on the beat clock (#4010): the rock, a bounce of the knees
 * with the chest and the head isolating side to side and popping hits that
 * stop sharp on their beat subdivisions; and the moonwalk's backslide, one
 * foot standing on its ball while the other slides back flat, the roles
 * changing every beat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the grooves, the hits and the backslide.
 * @evidence contracts/development/design.md#principled-representation A groove name with its tempo, count, hits and seeded variation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/streetDance.ts (streetDance.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
 */
export namespace IAutoMovieMotionHumanStreetDance {
  /**
   * The grooves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The grooves' names.
   * @evidence contracts/development/design.md#principled-representation Closed choices "rock", "moonwalk".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/streetDance.ts (streetDance.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
   */
  export type Groove = "rock" | "moonwalk";

  /**
   * Parameters.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The groove. */
    groove: Groove;

    /** Beats per minute; the dance law's `BPM` when absent.
     * Exclusive minimum: 0. Unit: "beats/min". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    bpm?: number;

    /** How many beats; 8 when absent, at the dance law's tempo (`dance.BPM`, 0.5 s a beat): 4 s plus one beat.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    beats?: number;

    /** The rock's popping hits, in quarter beats from the first beat; one on each beat's "and" when absent. */
    hits?: number[];

    /** The most a member's timing strays from the beat, seconds, drawn per member from its seed; 0.02 when absent.
     * Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    vary?: number;

    /** The moonwalk's first sliding foot; `right` when absent. */
    side?: AutoMovieHumanSide;

    /** A cue track to lock the beats to, as the dance law's. */
    lock?: IAutoMovieMotionHumanDance.IParams["lock"];
  }
}

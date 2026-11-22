import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanDance } from "./IAutoMovieMotionHumanDance";

/**
 * Classical ballet on the beat clock (#3991): the five positions of the feet
 * with a plié or a relevé, the pirouette from fourth on demi-pointe en
 * dehors or en dedans, and the grand jeté with its split at the flight's
 * apex. The turnout is the hip's external rotation and is refused beyond
 * the hip's range; a split beyond the hips' flexion and extension is
 * refused too.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the steps, the turnout and the refusals.
 * @evidence contracts/development/design.md#principled-representation A step kind with its own optional fields.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/balletStep.ts (balletStep.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
 */
export namespace IAutoMovieMotionHumanBallet {
  /**
   * The steps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The steps' names.
   * @evidence contracts/development/design.md#principled-representation Closed choices "position", "pirouette", "grandJete".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/balletStep.ts (balletStep.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
   */
  export type Kind = "position" | "pirouette" | "grandJete";

  /**
   * What the legs do in a position, on alternate beats.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Held, bent over the toes, or risen onto the balls.
   * @evidence contracts/development/design.md#principled-representation Closed choices "hold", "plie", "releve".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/balletPositions.ts (balletPositions.course).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
   */
  export type Movement = "hold" | "plie" | "releve";

  /**
   * Which way a pirouette turns: away from the supporting leg (en dehors) or toward it (en dedans).
   *
   * @evidence contracts/development/common.md#meaningful-documentation The two turning directions.
   * @evidence contracts/development/design.md#principled-representation Closed choices "enDehors", "enDedans".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/balletPirouette.ts (balletPirouette.course).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
   */
  export type Direction = "enDehors" | "enDedans";

  /**
   * Parameters.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The step. */
    kind: Kind;

    /** The position of the feet, one to five; first when absent.
     * Numeric representation: "uint32". Inclusive range [1, 5]. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    position?: number;

    /** What the legs do in the position; `plie` when absent. */
    movement?: Movement;

    /** Each foot's turn out, the hip's external rotation, degrees; `balletStep.TURNOUT` when absent. Refused beyond the hip's range.
     * Inclusive minimum: 0. Unit: "degrees". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    turnout?: number;

    /** A pirouette's whole turns; 1 when absent.
     * Numeric representation: "uint32". Inclusive range [1, 2]. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    turns?: number;

    /** A pirouette's direction; `enDehors` when absent. */
    direction?: Direction;

    /** A grand jeté's split at the apex, the front hip's flexion plus the back hip's extension, degrees; 150 when absent. Refused beyond the hips' range.
     * Exclusive minimum: 0. Unit: "degrees". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    split?: number;

    /** The working leg: the one in front in a position, raised in a pirouette, leading a jeté; `right` when absent. */
    side?: AutoMovieHumanSide;

    /** Beats per minute; the dance law's `BPM` when absent.
     * Exclusive minimum: 0. Unit: "beats/min". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    bpm?: number;

    /** How many beats a position is danced over; 4 when absent, at the dance law's tempo ({@link dance.BPM}, 0.5 s a beat): 2 s.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    beats?: number;

    /** A cue track to lock the beats to, as the dance law's. */
    lock?: IAutoMovieMotionHumanDance.IParams["lock"];
  }
}

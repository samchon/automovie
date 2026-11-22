import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanDance } from "../next/IAutoMovieMotionHumanDance";

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
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit, range and default, and which values the law refuses.
   * @evidence contracts/development/design.md#principled-representation The step, the position and movement, the turnout and split in degrees, the turns and the tempo in beats per minute.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members balletStep.plan and its position, pirouette and jeté courses read; `lock` reuses the dance law's own type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One record with members per step kind rather than a union on `kind`: a member only another step uses is not refused by step kind; ranges and the hip limits remain for balletStep.plan's runtime refusals.
   */
  export interface IParams {
    /** The step. */
    kind: Kind;

    /** The position of the feet, a whole number from 1 to 5; first when absent. */
    position?: number;

    /** What the legs do in the position; `plie` when absent. */
    movement?: Movement;

    /** Each foot's turn out, the hip's external rotation, degrees, at least 0; `balletStep.TURNOUT` when absent. Refused beyond the hip's range. */
    turnout?: number;

    /** A pirouette's whole turns, 1 or 2; 1 when absent. */
    turns?: number;

    /** A pirouette's direction; `enDehors` when absent. */
    direction?: Direction;

    /** A grand jeté's split at the apex, the front hip's flexion plus the back hip's extension, degrees, positive; 150 when absent. Refused beyond the hips' range. */
    split?: number;

    /** The working leg: the one in front in a position, raised in a pirouette, leading a jeté; `right` when absent. */
    side?: AutoMovieHumanSide;

    /** Beats per minute, positive; the dance law's `BPM` when absent. */
    bpm?: number;

    /** How many beats a position is danced over, a whole number of at least 1; 4 when absent, at the dance law's tempo (`dance.BPM`, 0.5 s a beat): 2 s. */
    count?: number;

    /** A cue track to lock the beats to, as the dance law's. */
    lock?: IAutoMovieMotionHumanDance.IParams["lock"];
  }
}

import { AutoMovieHumanBodyAnatomy } from "@automovie/human";
import type {
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanParameters,
} from "@automovie/interface";

import type { HumanPopulationSurvey } from "./HumanPopulationSurvey";
import { f1 } from "./human-parameters/internal/f1";
import { f2 } from "./human-parameters/internal/f2";
import { m1 } from "./human-parameters/internal/m1";
import { m2 } from "./human-parameters/internal/m2";

/*
 * Reads of a person's public inputs, shared by the people's construction and by
 * the audit that checks them, so both read the same field for the same
 * measure.
 */
export namespace HumanPopulationAccess {
  /*
   * One hand's inputs.
   */
  export interface IHand {
    /*
     * Hand length, mm.
     */
    handLength: number;

    /*
     * Palm length, mm.
     */
    palmLength: number;

    /*
     * Hand breadth, mm.
     */
    handBreadth: number;

    /*
     * Thumb length, mm.
     */
    thumbLength: number;
  }

  /*
   * One foot's inputs.
   */
  export interface IFoot {
    /*
     * Foot length, mm.
     */
    footLength: number;

    /*
     * Foot breadth, mm.
     */
    footBreadth: number;

    /*
     * Lateral malleolus height, mm.
     */
    ankleHeight: number;
  }

  /*
   * The reference people of each sex, whose inputs calibrate the courses the
   * survey does not measure.
   */
  export const REFERENCES: Record<
    HumanPopulationSurvey.Sex,
    IAutoMovieHumanParameters[]
  > = {
    female: [f1, f2],
    male: [m1, m2],
  };

  /*
   * A person's body measures, supplied or defaulted.
   * Parameter p: The person's inputs.
   * Returns: The resolved measures.
   */
  export function measures(
    p: IAutoMovieHumanParameters,
  ): IAutoMovieHumanBodyMeasures {
    return AutoMovieHumanBodyAnatomy.resolve(p);
  }

  /*
   * A person's hands, left then right.
   * Parameter p: The person's inputs.
   * Returns: Both hands; none when the inputs omit them.
   */
  export function hands(p: IAutoMovieHumanParameters): IHand[] {
    const pair: IAutoMovieHumanParameters["extremities"] = p.extremities;
    const both:
      | NonNullable<
          NonNullable<IAutoMovieHumanParameters["extremities"]>["hands"]
        >
      | undefined = pair?.hands;

    return both === undefined ? [] : [both.left, both.right];
  }

  /*
   * A person's feet, left then right.
   * Parameter p: The person's inputs.
   * Returns: Both feet; none when the inputs omit them.
   */
  export function feet(p: IAutoMovieHumanParameters): IFoot[] {
    const pair: IAutoMovieHumanParameters["extremities"] = p.extremities;
    const both:
      | NonNullable<
          NonNullable<IAutoMovieHumanParameters["extremities"]>["feet"]
        >
      | undefined = pair?.feet;

    return both === undefined ? [] : [both.left, both.right];
  }

  /*
   * Ramanujan's first approximation of the perimeter of an ellipse, `pi (3 (a +
   * b) - sqrt((3a + b)(a + 3b)))`, as the head circumference's ratio to it is
   * surveyed.
   * Parameter a: Semi-axis, mm.
   * Parameter b: Other semi-axis, mm.
   * Returns: The perimeter, mm.
   */
  export function ellipse(a: number, b: number): number {
    return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  }
}

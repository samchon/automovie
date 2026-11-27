import { AutoMovieArchetypeUnits } from "../../core/index";

export namespace AutoMovieArchetypeLadderData {
  /*
   * The ladder regulation.
   */
  export const OSHA: string =
    "29 CFR 1910.23 (https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.23)";

  /*
   * The pitch of a ladder whose foot stands a quarter of its length from the
   * wall, degrees: the arccosine of one quarter.
   */
  export const QUARTER: number = Math.acos(0.25) / AutoMovieArchetypeUnits.DEGREE;

  /*
   * A rung's diameter, which the regulation does not give.
   */
  export const RUNG: string =
    "no rung diameter is given by 29 CFR 1910.23 or 1926.1053; the 25 to 35 mm of a round rung, not read at a source";
}

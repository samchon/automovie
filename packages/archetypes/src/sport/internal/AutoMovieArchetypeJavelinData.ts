
import {
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../core";

export namespace AutoMovieArchetypeJavelinData {
  /*
   * The World Athletics rule as read.
   */
  export const RULE: string =
    "World Athletics Competition and Technical Rules, 2020 edition (https://athletics.lv/file/download/61151), Technical Rule 38.8 and 38.10, the javelin";

  /*
   * A band in metres of the rule.
   */
  export const m = (
    minimum: number,
    maximum: number,
    what: string,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.metres(minimum, maximum, `${RULE}: ${what}`);
}

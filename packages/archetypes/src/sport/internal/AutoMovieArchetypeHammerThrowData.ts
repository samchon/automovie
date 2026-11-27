

import {
  type AutoMovieArchetypeBandUnit,
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../core";

export namespace AutoMovieArchetypeHammerThrowData {
  /*
   * The World Athletics rule as read.
   */
  export const RULE: string =
    "World Athletics Competition and Technical Rules, 2020 edition (https://athletics.lv/file/download/61151), Technical Rule 36.6 and 36.8, the hammer";

  /*
   * A band of the rule.
   */
  export const band = (
    unit: AutoMovieArchetypeBandUnit,
    minimum: number,
    maximum: number,
    what: string,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.of(unit, minimum, maximum, `${RULE}: ${what}`);
}

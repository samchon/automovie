
import {
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../core/index";

export namespace AutoMovieArchetypeHurdleData {
  /*
   * The World Athletics rule as read.
   */
  export const RULE: string =
    "World Athletics Competition and Technical Rules, 2020 edition (https://athletics.lv/file/download/61151), Technical Rule 22.3 and 22.4, the hurdles";

  /*
   * A height band: the rule's height to 3 mm either way.
   */
  export const height = (metres: number, race: string): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.metres(
      metres - 0.003,
      metres + 0.003,
      `${RULE}: the ${race} ${metres.toFixed(3)} m, with a 3 mm tolerance above and below`,
    );
}

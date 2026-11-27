import type { AutoMovieArchetypeBandUnit } from "../../core";
import type { IAutoMovieArchetypeBand } from "../../core";
import { AutoMovieArchetypeBand } from "../../core";

/*
 * The World Athletics rule as read.
 */
export const RULE: string =
  "World Athletics Competition and Technical Rules, 2020 edition (https://athletics.lv/file/download/61151), Technical Rule 33.5, the shot";

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

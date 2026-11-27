import type { IAutoMovieArchetypeBand } from "../../core/index";
import { AutoMovieArchetypeBand } from "../../core/index";

/*
 * The rules the figures come from.
 */
export const RULES: string =
  "World Athletics Technical Rules (2020 edition), TR32.6: a throwing circle's inside diameter 2.135 m for the shot and the hammer and 2.50 m for the discus, each within 5 mm; TR32.9 and TR33: the javelin runway 4 m wide ending in an arc of 8 m radius (https://athletics.lv/file/download/61151)";

/*
 * The mass band shared by every event: an estimate of a painted or metal
 * marking.
 */
export const MASS: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
  "kg",
  5,
  20,
  "an estimate of the marking alone",
  true,
);

import type { IAutoMovieArchetypeFamilies } from "./IAutoMovieArchetypeFamilies";
import * as animals from "./animals";
import * as architecture from "./architecture";
import * as furniture from "./furniture";
import * as gym from "./gym";
import * as music from "./music";
import * as nature from "./nature";
import * as props from "./props";
import * as sport from "./sport";
import * as vehicles from "./vehicles";
import * as weapons from "./weapons";

/**
 * The model-producing families by their package subpaths, in manifest order.
 *
 * The root exports these families' producers and the object gallery groups them
 * by this table. Import builders for complete places from
 * `@automovie/archetypes/environments`.
 */
export const ARCHETYPE_FAMILIES: Readonly<IAutoMovieArchetypeFamilies> = {
  props,
  furniture,
  architecture,
  vehicles,
  animals,
  weapons,
  gym,
  sport,
  music,
  nature,
};

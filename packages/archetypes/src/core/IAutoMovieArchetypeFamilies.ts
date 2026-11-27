import type * as animals from "../animals";
import type * as architecture from "../architecture";
import type * as furniture from "../furniture";
import type * as gym from "../gym";
import type * as music from "../music";
import type * as nature from "../nature";
import type * as props from "../props";
import type * as sport from "../sport";
import type * as vehicles from "../vehicles";
import type * as weapons from "../weapons";

/**
 * The model-producing families by their package subpaths, each the module its
 * subpath exports.
 */
export type IAutoMovieArchetypeFamilies = {
  /** `@automovie/archetypes/props`. */
  props: typeof props;

  /** `@automovie/archetypes/furniture`. */
  furniture: typeof furniture;

  /** `@automovie/archetypes/architecture`. */
  architecture: typeof architecture;

  /** `@automovie/archetypes/vehicles`. */
  vehicles: typeof vehicles;

  /** `@automovie/archetypes/animals`. */
  animals: typeof animals;

  /** `@automovie/archetypes/weapons`. */
  weapons: typeof weapons;

  /** `@automovie/archetypes/gym`. */
  gym: typeof gym;

  /** `@automovie/archetypes/sport`. */
  sport: typeof sport;

  /** `@automovie/archetypes/music`. */
  music: typeof music;

  /** `@automovie/archetypes/nature`. */
  nature: typeof nature;
};

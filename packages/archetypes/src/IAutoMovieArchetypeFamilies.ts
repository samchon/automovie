import type * as animals from "./animals";
import type * as architecture from "./architecture";
import type * as furniture from "./furniture";
import type * as gym from "./gym";
import type * as music from "./music";
import type * as nature from "./nature";
import type * as props from "./props";
import type * as sport from "./sport";
import type * as vehicles from "./vehicles";
import type * as weapons from "./weapons";

/**
 * The model-producing families by their package subpaths, each the module its subpath exports.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each member is: the module behind one package subpath.
 * @evidence contracts/development/design.md#principled-representation One member per model-producing subpath, typed as that subpath's module, so a family cannot hold a producer its subpath does not export.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The type of `ARCHETYPE_FAMILIES`, read by the object gallery and the family spec; `environments` builds places, not models, and is not a member.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No string-keyed record: a missing or misspelt family fails the type check. It is an object type rather than an interface so the gallery can read it as a record of modules by name.
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

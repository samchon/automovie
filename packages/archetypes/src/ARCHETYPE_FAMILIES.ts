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
 * Every family of archetypes by the subpath that exports it, each the module of that subpath, so a reader lists the families and their producers from one export instead of importing each subpath by name: a page groups its catalogue by it, and a test checks it against the subpaths the manifest exports. A family added to the package is added here, in the order the manifest's `exports` lists its subpaths.
 */
export const ARCHETYPE_FAMILIES: Readonly<{
  props: typeof props;
  furniture: typeof furniture;
  architecture: typeof architecture;
  vehicles: typeof vehicles;
  animals: typeof animals;
  weapons: typeof weapons;
  gym: typeof gym;
  sport: typeof sport;
  music: typeof music;
  nature: typeof nature;
}> = {
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

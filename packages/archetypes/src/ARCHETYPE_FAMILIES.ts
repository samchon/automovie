import * as animals from "./animals";
import * as architecture from "./architecture";
import * as furniture from "./furniture";
import * as props from "./props";
import * as vehicles from "./vehicles";
import * as weapons from "./weapons";

/**
 * Every family of archetypes by the subpath that exports it, each the module of that subpath, so a reader lists the families and their producers from one export instead of importing each subpath by name: a page groups its catalogue by it, and a test checks it against the subpaths the manifest exports. A family added to the package is added here, in the order the README lists the families.
 */
export const ARCHETYPE_FAMILIES = {
  props,
  furniture,
  architecture,
  vehicles,
  animals,
  weapons,
} as const;

import * as animals from "./animals";
import * as architecture from "./architecture";
import * as furniture from "./furniture";
import * as props from "./props";
import * as vehicles from "./vehicles";
import * as weapons from "./weapons";

/**
 * Every family of archetypes by the subpath that exports it, each the module of that subpath, so a reader lists the families and their producers from one export instead of importing each subpath by name: a page groups its catalogue by it, and a test checks it against the subpaths the manifest exports. A family added to the package is added here, in the order the README lists the families.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds, who reads it and where a new family goes.
 * @evidence contracts/development/design.md#principled-representation One record from subpath name to that subpath's own module, `as const`, so each family keeps its producers' types.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family table; each family's module owns its producers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No producer is named here: a family is its module, and its producers are read from it.
 */
export const ARCHETYPE_FAMILIES = {
  props,
  furniture,
  architecture,
  vehicles,
  animals,
  weapons,
} as const;

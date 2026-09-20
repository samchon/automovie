import { IAutoMovieBuiltEnvironment } from "@automovie/interface";

/**
 * The elements of a building that neither a logical space nor a parent reaches.
 *
 * An element's assignment to a logical space is authored, and an exterior wall, a
 * foundation, or a structural frame belongs to no room, so leaving one unassigned
 * is correct rather than careless. Measured on one authored building, 9 of its 30
 * elements are claimed by no space, and every one of the nine is envelope or
 * vertical-transport machinery — curtain panels, a facade ladder, a lift car and
 * its counterweight — while every floor slab, partition, door and leaf is claimed.
 * The assignment is a fact about what occupies a room, not a measure of care.
 *
 * The reach path therefore belongs on the element hierarchy rather than on the
 * space tree, and that is the record's own arrangement:
 * {@link IAutoMovieBuiltEnvironment.buildings} states that ownership is total,
 * every element descending from exactly one unit's roots. A space is an index
 * over that hierarchy, so an unassigned element is not detached, only unindexed.
 *
 * What is left over is therefore small and exact. A child is listed among its
 * parent's members, and a claimed element is listed by the space that claims it,
 * so the only element nothing names is one that is a root of the hierarchy and
 * carries no space of its own. Naming anything more would list the same element
 * twice and tell the reader it hangs from nothing while the record says
 * otherwise, which is what happened when this took the compiled scene's drawn set
 * as its notion of reach: on that same building it named seven envelope pieces as
 * roots although their unit root is claimed by a space.
 *
 * A resolvable hierarchy is the precondition, which `validateBuiltEnvironment`
 * enforces by rejecting an unresolved parent and a parent cycle.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtEnvironmentUnclaimedElements` names the building elements no logical space and no parent element reaches, so authored interior and envelope state stays reachable for review instead of being addressable only by a key nobody has.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtEnvironmentUnclaimedElements` derives those roots from the element hierarchy of one building rather than from a space assignment it does not have.
 * @author Samchon
 */
export const builtEnvironmentUnclaimedElements = (
  environment: IAutoMovieBuiltEnvironment,
): string[] =>
  environment.elements
    .filter((element) => element.space === null && element.parent === null)
    .map((element) => `${environment.id}/${element.id}`);

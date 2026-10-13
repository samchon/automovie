import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";

/**
 * The elements of a building that neither a logical space nor a parent reaches.
 *
 * An element's assignment to a logical space is authored, and an exterior wall,
 * a foundation, or a structural frame belongs to no room, so leaving one
 * unassigned is correct rather than careless. Measured on one authored
 * building, 9 of its 30 elements are claimed by no space, and every one of the
 * nine is envelope or vertical-transport machinery (curtain panels, a facade
 * ladder, a lift car and its counterweight) while every floor slab, partition,
 * door and leaf is claimed. The assignment is a fact about what occupies a
 * room, not a measure of care.
 *
 * The reach path therefore belongs on the element hierarchy rather than on the
 * space tree, and that is the record's own arrangement:
 * {@link IAutoMovieBuiltEnvironment.buildings} states that ownership is total,
 * every element descending from exactly one unit's roots. A space is an index
 * over that hierarchy, so an unassigned element is not detached, only unindexed.
 *
 * What is left over is therefore small and exact. A child is listed among its
 * parent's members, and a claimed element is listed by the space that claims
 * it, so the only element nothing names is one that is a root of the hierarchy
 * and carries no space of its own. Naming anything more would list the same
 * element twice and tell the reader it hangs from nothing while the record
 * says otherwise, which is what happened when this took the compiled scene's
 * drawn set as its notion of reach: on that same building it named seven
 * envelope pieces as roots although their unit root is claimed by a space.
 *
 * A resolvable hierarchy is the precondition, which `validateBuiltEnvironment`
 * enforces by rejecting an unresolved parent and a parent cycle.
 *
 * @param environment Building record to read.
 * @returns `<environment>/<element>` node ids of every root element with no space, in record order.
 *
 * @evidence contracts/common.md#principled-implementation A root element with no `space` is the only element neither a parent's member list nor a space's index names, so a single filter on those two authored fields is exact on a record whose parent links resolve, which validation enforces.
 * @evidence contracts/common.md#clear-and-simple-design One filter and one id format, with no traversal, because the hierarchy itself already reaches every non-root element.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no element, building or role; the measured building in the documentation explains the rule and is not consulted by the code.
 * @evidence contracts/common.md#meaningful-documentation States why an unassigned element is not a defect, why reach follows the element hierarchy, exactly which elements are listed and why no others, the validation precondition, and the id format and order.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the elements with constant work each, linear in the element count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure filter over the given record that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned id list.
 * @author Samchon
 */
export const builtEnvironmentUnclaimedElements = (
  environment: IAutoMovieBuiltEnvironment,
): string[] =>
  environment.elements
    .filter(
      (element: IAutoMovieBuiltElement): boolean =>
        element.space === null && element.parent === null,
    )
    .map(
      (element: IAutoMovieBuiltElement): string =>
        `${environment.id}/${element.id}`,
    );

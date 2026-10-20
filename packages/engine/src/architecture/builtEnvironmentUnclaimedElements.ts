import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";

/**
 * Hierarchy roots that carry no logical-space assignment.
 *
 * Logical-space assignment is an authored index, so an exterior wall or foundation can correctly have no room assignment. This query filters only `parent === null && space === null`; it does not diagnose missing building-unit ownership.
 *
 * The reach path therefore belongs on the element hierarchy rather than on the
 * space tree, and that is the record's own arrangement:
 * {@link IAutoMovieBuiltEnvironment.buildings} states that ownership is total,
 * every element descending from exactly one unit's roots. A space is an index
 * over that hierarchy, so an unassigned element is not detached, only unindexed.
 *
 * Building-unit root declarations can still name returned elements. Descendants of these roots are intentionally absent from the result even when they also have no space assignment; consumers must not read this as the complete set of unassigned or unowned elements.
 *
 * A resolvable hierarchy is the precondition, which `validateBuiltEnvironment`
 * enforces by rejecting an unresolved parent and a parent cycle.
 *
 * @param environment Building record to read.
 * @returns `<environment>/<element>` node ids of every root element with no space, in record order.
 *
 * @evidence contracts/common.md#principled-implementation Applies the explicit root-and-unassigned predicate to authored fields. The answer is a logical-space indexing view; building-unit ownership is independently declared and validated and is not inferred from this result.
 * @evidence contracts/common.md#clear-and-simple-design One filter and one id format, with no traversal, because the hierarchy itself already reaches every non-root element.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no element, building or role and uses no fixture measurements; every record is judged by the same two authored null fields.
 * @evidence contracts/common.md#meaningful-documentation States why an unassigned element is not a defect, why reach follows the element hierarchy, exactly which elements are listed and why no others, the validation precondition, and the id format and order.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the elements with constant work each, linear in the element count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure filter over the given record that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned id list.
 */
export const builtEnvironmentUnclaimedElements: (
  environment: IAutoMovieBuiltEnvironment,
) => string[] = (environment: IAutoMovieBuiltEnvironment): string[] =>
  environment.elements
    .filter(
      (element: IAutoMovieBuiltElement): boolean =>
        element.space === null && element.parent === null,
    )
    .map(
      (element: IAutoMovieBuiltElement): string =>
        `${environment.id}/${element.id}`,
    );

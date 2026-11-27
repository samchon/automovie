import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";

/*
 * Hierarchy roots that carry no logical-space assignment.
 *
 * Logical-space assignment is an authored index, so an exterior wall or
 * foundation can correctly have no room assignment. This query filters only
 * `parent === null && space === null`; it does not diagnose missing
 * building-unit ownership.
 *
 * The reach path therefore belongs on the element hierarchy rather than on the
 * space tree, and that is the record's own arrangement:
 * IAutoMovieBuiltEnvironment.buildings states that ownership is total,
 * every element descending from exactly one unit's roots. A space is an index
 * over that hierarchy, so an unassigned element is not detached, only
 * unindexed.
 *
 * Building-unit root declarations can still name returned elements. Descendants
 * of these roots are intentionally absent from the result even when they also
 * have no space assignment; consumers must not read this as the complete set of
 * unassigned or unowned elements.
 *
 * A resolvable hierarchy is the precondition, which `validateBuiltEnvironment`
 * enforces by rejecting an unresolved parent and a parent cycle.
 * Parameter environment: Building record to read.
 * Returns: `<environment>/<element>` node ids of every root element with no
 * space, in record order.
 */
export function builtEnvironmentUnclaimedElements(
  environment: IAutoMovieBuiltEnvironment,
): string[] {
  return environment.elements
    .filter(
      (element: IAutoMovieBuiltElement): boolean =>
        element.space === null && element.parent === null,
    )
    .map(
      (element: IAutoMovieBuiltElement): string =>
        `${environment.id}/${element.id}`,
    );
}

import type { IAutoMovieSpatialQueryEntry } from "./IAutoMovieSpatialQueryEntry";
import { buildAutoMovieMeshQueryHierarchy } from "./buildAutoMovieMeshQueryHierarchy";

/**
 * Visit a resident box hierarchy and order its candidates like an XYZ cell walk.
 *
 * The hierarchy is the finite tree built from the owner's resident entries.
 * `overlap` keeps actual overlapping boxes. `shared-cell` retains the broader
 * legacy population whose boxes occupy a common cell, without enumerating
 * cell coordinates. Positive cell width defines ordering only in overlap mode.
 * An infinite width from extent overflow places finite coordinates in cell zero.
 *
 * Positive division and floor are monotone, so an enclosing node's cell range
 * encloses every descendant's range too. A disjoint node therefore cannot hide
 * a qualifying entry. Each tree node is visited at most once and each entry
 * occurs in one leaf; work terminates with resident population, not coordinate
 * magnitude. Candidate order is the first shared cell in XYZ order followed
 * by original ordinal, matching terminating legacy walks without key aliases.
 * Equal infinite keys use the same ordinal tie and are never incremented.
 * No triangle predicate, coordinate or contact allowance is changed.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Supplies reusable finite candidate traversal for resident geometry without absolute cell loops or geometry changes.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Preserves enclosing-box candidate populations and original-ordinal witness order while leaving geometry classification with its owner.
 */
export function collectAutoMovieSpatialQueryCandidates<
  T extends IAutoMovieSpatialQueryEntry,
>(
  hierarchy: ReturnType<typeof buildAutoMovieMeshQueryHierarchy<T>>,
  subject: IAutoMovieSpatialQueryEntry,
  cell: number,
  population: "overlap" | "shared-cell",
): T[] {
  if (!(cell > 0))
    throw new Error("Spatial candidate ordering needs a positive cell width.");
  const cellOf = (value: number): number => Math.floor(value / cell);
  const coordinate =
    population === "shared-cell" ? cellOf : (value: number) => value;
  const overlaps = (low: number[], high: number[]): boolean =>
    ![0, 1, 2].some(
      (axis) =>
        coordinate(high[axis]) < coordinate(subject.low[axis]) ||
        coordinate(low[axis]) > coordinate(subject.high[axis]),
    );
  const candidates: T[] = [];
  const pending = [hierarchy];
  while (pending.length > 0) {
    const node = pending.pop()!;
    if (!overlaps(node.low, node.high)) continue;
    if ("triangles" in node) {
      for (const entry of node.triangles)
        if (overlaps(entry.low, entry.high)) candidates.push(entry);
    } else pending.push(node.left, node.right);
  }
  return candidates.sort((a, b) => {
    for (let axis = 0; axis < 3; axis++) {
      const firstCell = Math.max(
        cellOf(subject.low[axis]),
        cellOf(a.low[axis]),
      );
      const secondCell = Math.max(
        cellOf(subject.low[axis]),
        cellOf(b.low[axis]),
      );
      if (firstCell < secondCell) return -1;
      if (firstCell > secondCell) return 1;
    }
    return a.ordinal - b.ordinal;
  });
}

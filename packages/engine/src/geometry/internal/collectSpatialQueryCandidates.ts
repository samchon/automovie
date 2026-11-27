import type {
  IAutoMovieMeshQueryHierarchy,
  IAutoMovieSpatialQueryEntry,
} from "@automovie/interface";

/*
 * Collect the hierarchy entries whose boxes can meet a subject box, ordered by
 * the first cell of an XYZ grid they share with the subject.
 *
 * `hierarchy` is the tree `buildMeshQueryHierarchy` built from the
 * owner's resident entries, and `subject` is a box in the same metre frame.
 * `overlap` keeps entries whose actual boxes overlap the subject's, boundaries
 * included. `shared-cell` keeps the wider population whose boxes occupy a
 * common grid cell of width `cell`, which lash contact reads as its contact
 * neighbourhood. In both modes the result is sorted by the first shared cell
 * index in X, then Y, then Z, and then by original ordinal, so the order is a
 * deterministic function of the geometry and not of the tree's shape.
 *
 * Cell indices are read from coordinates by division and floor, never by
 * stepping through cells, so work follows the resident population and not
 * coordinate magnitude. An infinite cell width puts every finite coordinate in
 * cell zero, and indices that overflow to the same infinity compare equal and
 * fall to the ordinal tie-break. No entry geometry, coordinate or contact
 * allowance is changed.
 * Parameter hierarchy: Tree over the resident entries.
 * Parameter subject: Box the candidates must reach.
 * Parameter cell: Positive cell width in metres for ordering and `shared-cell`.
 * Parameter population: Which entries qualify.
 * Returns: Qualifying entries by reference, in cell then ordinal order.
 */
export function collectSpatialQueryCandidates<
  T extends IAutoMovieSpatialQueryEntry,
>(
  hierarchy: IAutoMovieMeshQueryHierarchy<T>,
  subject: IAutoMovieSpatialQueryEntry,
  cell: number,
  population: "overlap" | "shared-cell",
): T[] {
  if (!(cell > 0))
    throw new Error("Spatial candidate ordering needs a positive cell width.");
  const cellOf = (value: number): number => Math.floor(value / cell);
  const coordinate: (value: number) => number =
    population === "shared-cell" ? cellOf : (value: number): number => value;
  const overlaps = (low: number[], high: number[]): boolean => {
    for (let axis: number = 0; axis < 3; axis++)
      if (
        coordinate(high[axis]!) < coordinate(subject.low[axis]!) ||
        coordinate(low[axis]!) > coordinate(subject.high[axis]!)
      )
        return false;
    return true;
  };
  const candidates: T[] = [];
  const pending: IAutoMovieMeshQueryHierarchy<T>[] = [hierarchy];
  while (pending.length > 0) {
    const node: IAutoMovieMeshQueryHierarchy<T> = pending.pop()!;
    if (!overlaps(node.low, node.high)) continue;
    if ("triangles" in node) {
      for (const entry of node.triangles)
        if (overlaps(entry.low, entry.high)) candidates.push(entry);
    } else pending.push(node.left, node.right);
  }
  return candidates.sort((a: T, b: T): number => {
    for (let axis: number = 0; axis < 3; axis++) {
      const floor: number = cellOf(subject.low[axis]!);
      const first: number = Math.max(floor, cellOf(a.low[axis]!));
      const second: number = Math.max(floor, cellOf(b.low[axis]!));
      if (first < second) return -1;
      if (first > second) return 1;
    }
    return a.ordinal - b.ordinal;
  });
}

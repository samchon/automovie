import type {
  IAutoMovieMeshQueryHierarchy,
  IAutoMovieSpatialQueryEntry,
} from "@automovie/interface";

/** A traversal and the independent shared-cell order over its original boxes. */
export namespace AutoMovieSpatialCandidates {
  /** Read qualifying entries in hierarchy order, in coordinates or cells. */
  export function read<T extends IAutoMovieSpatialQueryEntry>(
    hierarchy: IAutoMovieMeshQueryHierarchy<T>,
    subject: IAutoMovieSpatialQueryEntry,
    coordinate: (value: number) => number = identity,
  ): T[] {
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
    return candidates;
  }

  /** Compare the first shared XYZ cell, with the original ordinal as tie-break. */
  export function compare(
    subject: IAutoMovieSpatialQueryEntry,
    cell: number,
    a: IAutoMovieSpatialQueryEntry,
    b: IAutoMovieSpatialQueryEntry,
  ): number {
    for (let axis: number = 0; axis < 3; axis++) {
      const floor: number = Math.floor(subject.low[axis]! / cell);
      const first: number = Math.max(floor, Math.floor(a.low[axis]! / cell));
      const second: number = Math.max(floor, Math.floor(b.low[axis]! / cell));
      if (first < second) return -1;
      if (first > second) return 1;
    }
    return a.ordinal - b.ordinal;
  }
}

/** Actual box coordinates, with no cell expansion. */
function identity(value: number): number {
  return value;
}

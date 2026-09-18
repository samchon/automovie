import { IAutoMovieMeshCrossing } from "./IAutoMovieMeshCrossing";
import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Report every triangle of `first` that a triangle of `second` crosses.
 *
 * The result is empty when the two surfaces are disjoint or merely adjacent.
 * A returned entry names the first-mesh triangle, one second-mesh witness, and
 * whether the pair crosses transversally or lies flat in one plane. Ordering is
 * by first-mesh ordinal, so the same inputs always produce the same report.
 *
 * This answers containment-free overlap only. It does not say how deep the
 * crossing is, which surface should move, or whether a surface intersects
 * itself; the first is what `measureAutoMovieMeshClearance` supplies along a
 * chosen axis, and the last is a different question over one mesh.
 *
 * @param first Mesh whose triangles are reported.
 * @param second Mesh tested against it, in the same frame.
 * @returns One entry per crossed triangle of `first`, in ordinal order.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Supplies a direction-free crossing test composable with the axis-ordered clearance measure, without depending on any catalogue item.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports crossings against the original triangle ordinals of both meshes so a caller can map them onto the buffers it owns.
 */
export function measureAutoMovieMeshCrossings(
  first: IAutoMovieMesh,
  second: IAutoMovieMesh,
): IAutoMovieMeshCrossing[] {
  const ours = index(first);
  const theirs = index(second);
  if (ours.length === 0 || theirs.length === 0) return [];
  // One cell a little larger than the mean second-mesh triangle keeps the
  // candidate list short without letting a long triangle span many cells.
  const span =
    theirs.reduce(
      (total, triangle) =>
        total +
        Math.max(
          triangle.high[0] - triangle.low[0],
          triangle.high[1] - triangle.low[1],
          triangle.high[2] - triangle.low[2],
        ),
      0,
    ) / theirs.length;
  const cell = span > 0 ? span : 1;
  const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;
  const grid = new Map<string, Indexed[]>();
  const walk = (
    low: number[],
    high: number[],
    visit: (at: string) => void,
  ): void => {
    for (
      let x = Math.floor(low[0] / cell);
      x <= Math.floor(high[0] / cell);
      x++
    )
      for (
        let y = Math.floor(low[1] / cell);
        y <= Math.floor(high[1] / cell);
        y++
      )
        for (
          let z = Math.floor(low[2] / cell);
          z <= Math.floor(high[2] / cell);
          z++
        )
          visit(key(x, y, z));
  };
  for (const triangle of theirs)
    walk(triangle.low, triangle.high, (at) => {
      const bucket = grid.get(at);
      if (bucket === undefined) grid.set(at, [triangle]);
      else bucket.push(triangle);
    });
  const crossings: IAutoMovieMeshCrossing[] = [];
  for (const triangle of ours) {
    const candidates = new Set<Indexed>();
    walk(triangle.low, triangle.high, (at) => {
      for (const candidate of grid.get(at) ?? []) candidates.add(candidate);
    });
    let pierced: Indexed | undefined;
    let flat: Indexed | undefined;
    for (const candidate of candidates) {
      if (
        [0, 1, 2].some(
          (axis) =>
            candidate.high[axis] < triangle.low[axis] ||
            candidate.low[axis] > triangle.high[axis],
        )
      )
        continue;
      if (pierces(triangle.corners, candidate.corners)) {
        pierced = candidate;
        break;
      }
      if (
        flat === undefined &&
        sharePlaneAndOverlap(triangle.corners, candidate.corners)
      )
        flat = candidate;
    }
    const witness = pierced ?? flat;
    if (witness !== undefined)
      crossings.push({
        triangle: triangle.ordinal,
        other: witness.ordinal,
        coplanar: pierced === undefined,
      });
  }
  return crossings;
}

import { MESH_WELD_GRID } from "../constants/MESH_WELD_GRID";

/**
 * Intern finite XYZ tuples in first-occurrence order using nanometre topology-grid identity. Invalid tuple cardinality, holes and nonfinite coordinates throw.
 * Safe rounded grid indexes keep their integer labels and signed-zero convention. Larger coordinates use an axis-local exact-coordinate label: adjacent binary64 values there are farther apart than one grid cell, so distinct coordinates cannot weld.
 *
 * @evidence contracts/common.md#principled-implementation Uses Math.round on each coordinate times MESH_WELD_GRID while that grid index is safe; beyond that magnitude binary64 coordinate spacing exceeds 1e-9, so exact-coordinate identity preserves distinct cells without overflowing or rounding an unsafe grid integer. Signed zero has one canonical label.
 * @evidence contracts/common.md#clear-and-simple-design Returns one first-occurrence label table and a parallel input-vertex-to-label index list, allowing mesh topology consumers to share identical welding semantics without changing source positions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Incomplete tuples, sparse holes and nonfinite coordinates refuse instead of coercing to origin; the large-coordinate label is chosen per axis so other axes retain their ordinary sub-grid welding.
 * @evidence contracts/common.md#meaningful-documentation States finite XYZ admission and throw behavior, first-occurrence order, signed-zero convention and the exact axis label used beyond safely representable grid indexes.
 * @evidence contracts/performance.md#efficient-algorithms One hash-map lookup per input vertex gives expected O(V) time with O(V) output indexes and O(U) distinct labels for U welded vertices, avoiding pairwise neighborhood searches.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One map reuses a label for every equal quantized triple within the mesh; no result survives across calls on mutable position arrays.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The temporary map is released on return; the caller owns V integer indexes and at most V label strings, and source position storage is not retained.
 */
export function weldMeshVertices(positions: readonly number[]): {
  /** Distinct delimiter-safe grid identities in first-occurrence order. */
  labels: string[];

  /** One label ordinal per input XYZ tuple, in the original vertex order. */
  vertices: number[];
} {
  if (positions.length % 3 !== 0)
    throw new Error("Mesh welding requires complete finite XYZ tuples.");
  const labels: string[] = [];
  const welded: Map<string, number> = new Map();
  const vertices: number[] = new Array<number>(positions.length / 3);
  for (let vertex: number = 0; vertex < vertices.length; vertex++) {
    const offset: number = vertex * 3;
    const x: string = axisLabel(positions[offset]!);
    const y: string = axisLabel(positions[offset + 1]!);
    const z: string = axisLabel(positions[offset + 2]!);
    const key: string = `${x},${y},${z}`;
    let id: number | undefined = welded.get(key);
    if (id === undefined) {
      id = labels.length;
      welded.set(key, id);
      labels.push(key);
    }
    vertices[vertex] = id;
  }
  return { labels, vertices };
}

const axisLabel: (coordinate: number) => string = (
  coordinate: number,
): string => {
  if (!Number.isFinite(coordinate))
    throw new Error("Mesh welding requires complete finite XYZ tuples.");
  const rounded: number = Math.round(coordinate * MESH_WELD_GRID);
  return Number.isSafeInteger(rounded)
    ? String(rounded || 0)
    : `=${coordinate}`;
};

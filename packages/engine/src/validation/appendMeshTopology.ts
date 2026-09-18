import { IAutoMovieMesh } from "@automovie/interface";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { ViolationCollector } from "./ViolationCollector";

/**
 * Append mesh-topology violations to a collector, the shared body behind the
 * standalone {@link validateMeshTopology} and `validateModel`'s mesh check.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `appendMeshTopology` appends welded-edge topology faults at the caller's exact mesh-part path.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `appendMeshTopology` shares one incidence-and-winding calculation between model validation and the public standalone result.
 */
export const appendMeshTopology = (
  mesh: IAutoMovieMesh,
  path: string,
  collector: ViolationCollector,
  expectClosed: boolean,
): void => {
  const vertexCount = mesh.positions.length / 3;
  if (vertexCount === 0 || !Number.isInteger(vertexCount)) return;
  const indices =
    mesh.indices ?? Array.from({ length: vertexCount }, (_, i) => i);
  if (indices.length % 3 !== 0) return;
  if (
    indices.some(
      (index) => !Number.isInteger(index) || index < 0 || index >= vertexCount,
    )
  )
    return;

  const keyOf = (vertex: number): string =>
    [0, 1, 2]
      .map(
        (axis) =>
          Math.round(mesh.positions[vertex * 3 + axis]! * WELD_GRID) || 0,
      )
      .join(",");

  // Undirected edge → incident-triangle count (manifoldness); directed edge →
  // count in that traversal direction (winding consistency).
  const undirected = new Map<string, number>();
  const directed = new Map<string, number>();
  for (let i = 0; i < indices.length; i += 3) {
    const keys = [indices[i]!, indices[i + 1]!, indices[i + 2]!].map(keyOf);
    // A triangle with a repeated welded vertex (a pole ring, a collapsed cap)
    // carries no surface: skip it, exactly as the watertightness oracle does.
    if (new Set(keys).size < 3) continue;
    for (let e = 0; e < 3; ++e) {
      const from = keys[e]!;
      const to = keys[(e + 1) % 3]!;
      directed.set(`${from}|${to}`, (directed.get(`${from}|${to}`) ?? 0) + 1);
      const edge = [from, to].sort(compareCodeUnits).join("|");
      undirected.set(edge, (undirected.get(edge) ?? 0) + 1);
    }
  }

  for (const [edge, count] of undirected)
    if (count > 2)
      collector.push(
        "topology",
        `${path}.indices`,
        `a 2-manifold mesh edge is shared by at most 2 triangles, but the edge (${edge}) is shared by ${count}`,
        count,
      );

  for (const [edge, count] of directed)
    if (count > 1)
      collector.push(
        "topology",
        `${path}.indices`,
        `triangles adjacent on an edge must wind in opposite directions, but the directed edge (${edge}) appears ${count} times (a flipped triangle)`,
        count,
      );

  if (expectClosed)
    for (const [edge, count] of undirected)
      if (count === 1)
        collector.push(
          "topology",
          `${path}.indices`,
          `a closed mesh has every edge shared by 2 triangles, but the edge (${edge}) is a boundary (open) edge`,
          edge,
        );
};

/** Weld tolerance: ring seams recompute cos/sin with ~1e-16 float error. */
const WELD_GRID = 1e9;

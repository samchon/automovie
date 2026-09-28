import { MESH_WELD_GRID } from "../constants/MESH_WELD_GRID";

/**
 * Intern quantized XYZ positions in first-occurrence order. Equal integer
 * identities mean exactly equal topology-grid labels, never merely nearby
 * points. This preserves the existing Math.round and signed-zero convention.
 * The caller owns structural and finite-buffer admission.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Supplies one position-welding rule to topology admission and partition reuse.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Preserves diagnostic coordinate labels and deterministic welded identities.
 */
export function weldMeshVertices(positions: readonly number[]): {
  labels: string[];
  vertices: number[];
} {
  const labels: string[] = [];
  const welded = new Map<string, number>();
  const vertices = new Array<number>(positions.length / 3);
  for (let vertex = 0; vertex < vertices.length; vertex++) {
    const offset = vertex * 3;
    const x = Math.round(positions[offset]! * MESH_WELD_GRID) || 0;
    const y = Math.round(positions[offset + 1]! * MESH_WELD_GRID) || 0;
    const z = Math.round(positions[offset + 2]! * MESH_WELD_GRID) || 0;
    const key = `${x},${y},${z}`;
    let id = welded.get(key);
    if (id === undefined) {
      id = labels.length;
      welded.set(key, id);
      labels.push(key);
    }
    vertices[vertex] = id;
  }
  return { labels, vertices };
}

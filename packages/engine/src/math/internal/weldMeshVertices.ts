import type { IAutoMovieWeldMeshVertices } from "@automovie/interface";

import { AutoMovieEngineMeshWeldGrid } from "../../constants/AutoMovieEngineMeshWeldGrid";

/*
 * Intern finite XYZ tuples in first-occurrence order using nanometre
 * topology-grid identity. Invalid tuple cardinality, holes and nonfinite
 * coordinates throw. Safe rounded grid indexes keep their integer labels and
 * signed-zero convention. Larger coordinates use an axis-local exact-coordinate
 * label: adjacent binary64 values there are farther apart than one grid cell,
 * so distinct coordinates cannot weld.
 */
export function weldMeshVertices(
  positions: readonly number[],
): IAutoMovieWeldMeshVertices.IResult {
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
  const rounded: number = Math.round(coordinate * AutoMovieEngineMeshWeldGrid);
  return Math.abs(rounded) <= Number.MAX_SAFE_INTEGER
    ? String(rounded || 0)
    : `=${coordinate}`;
};

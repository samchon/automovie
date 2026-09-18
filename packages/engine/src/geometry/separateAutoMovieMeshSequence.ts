import { measureAutoMovieMeshClearance } from "./measureAutoMovieMeshClearance";
import { IAutoMovieMesh } from "@automovie/interface";

type Triangle = {
  points: number[][];
  vertices: number[];
  ordinal: number;
  area: number;
  bounds: number[];
};

/**
 * Separate an ordered mesh sequence along one positive local axis, retaining
 * every shape, normal and transverse coordinate. Each earlier/later pair passes
 * an axial bound or complete projected overlap. A signed minimum g imposes
 * t[later]-t[earlier] >= clearance-g. A forward longest-path pass satisfies all
 * pair constraints without an iterative collision correction or a guessed size.
 * Translations are nondecreasing before their common half-range is subtracted;
 * the first/last translations therefore balance around zero. Already separated
 * input has zero travel. Returned meshes own their buffers.
 *
 * Mesh coordinates and nonnegative clearance use metres. Input order is the
 * requested order, not an inferred spatial sort. The same ray-parallel limit as
 * measureAutoMovieMeshClearance applies; this does not pack arbitrary volumes
 * around corners or preserve an external path after separation.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Composes resident separation measurements into rigid placement of ordered meshes while retaining their authored shape.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Preserves triangle connectivity and attributes while applying a common-axis translation satisfying every measured pair constraint.
 */
export function separateAutoMovieMeshSequence(
  meshes: readonly IAutoMovieMesh[],
  axis: "x" | "y" | "z",
  clearance = 0,
): IAutoMovieMesh[] {
  const axes = depthAxes(axis);
  if (!Number.isFinite(clearance) || clearance < 0)
    throw new Error(
      "Mesh separation clearance must be finite and nonnegative.",
    );
  const intervals = meshes.map((mesh) => {
    triangles(mesh, axes);
    let minimum = Infinity,
      maximum = -Infinity;
    for (let i = axes[2]; i < mesh.positions.length; i += 3) {
      minimum = Math.min(minimum, mesh.positions[i]);
      maximum = Math.max(maximum, mesh.positions[i]);
    }
    return { minimum, maximum };
  });
  const travel = new Array<number>(meshes.length).fill(0);
  for (let later = 1; later < meshes.length; later++) {
    travel[later] = travel[later - 1];
    for (let earlier = 0; earlier < later; earlier++) {
      // Nondecreasing translations only enlarge an already-clear depth gap.
      // This conservative interval proof avoids clipping distant pairs while
      // retaining all close and overlapping pairs, including non-neighbours.
      if (intervals[later].minimum - intervals[earlier].maximum >= clearance)
        continue;
      for (const { minimum } of measureAutoMovieMeshClearance(
        meshes[later],
        meshes[earlier],
        axis,
      ))
        travel[later] = Math.max(
          travel[later],
          travel[earlier] + (clearance - minimum),
        );
    }
    if (!Number.isFinite(travel[later]))
      throw new Error("Mesh separation exceeds finite translation.");
  }
  const centre = (travel.at(-1) ?? 0) / 2;
  return meshes.map((mesh, index) => {
    const result = structuredClone(mesh);
    for (let i = axes[2]; i < result.positions.length; i += 3) {
      result.positions[i] += travel[index] - centre;
      if (!Number.isFinite(result.positions[i]))
        throw new Error("Mesh separation exceeds finite positions.");
    }
    return result;
  });
}

function depthAxes(axis: "x" | "y" | "z"): number[] {
  if (axis !== "x" && axis !== "y" && axis !== "z")
    throw new Error("Mesh clearance needs an X, Y or Z depth axis.");
  return { x: [1, 2, 0], y: [2, 0, 1], z: [0, 1, 2] }[axis];
}

function triangles(mesh: IAutoMovieMesh, axes: number[]): Triangle[] {
  const indices =
    mesh.indices ??
    Array.from({ length: mesh.positions.length / 3 }, (_, i) => i);
  if (
    mesh.positions.length % 3 !== 0 ||
    !mesh.positions.every(Number.isFinite) ||
    indices.length % 3 !== 0 ||
    indices.some(
      (i) => !Number.isInteger(i) || i < 0 || i >= mesh.positions.length / 3,
    )
  )
    throw new Error("Mesh clearance needs finite complete triangle buffers.");
  const result: Triangle[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const points = indices
      .slice(i, i + 3)
      .map((id) => axes.map((axis) => mesh.positions[3 * id + axis]));
    const area = side(points[0], points[1], points[2]);
    if (!Number.isFinite(area))
      throw new Error("Mesh clearance projected area must remain finite.");
    result.push({
      points,
      vertices: indices.slice(i, i + 3),
      ordinal: i / 3,
      area,
      bounds: [
        Math.min(...points.map((p) => p[0])),
        Math.min(...points.map((p) => p[1])),
        Math.max(...points.map((p) => p[0])),
        Math.max(...points.map((p) => p[1])),
      ],
    });
  }
  return result;
}

function side(a: number[], b: number[], p: number[]): number {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
}

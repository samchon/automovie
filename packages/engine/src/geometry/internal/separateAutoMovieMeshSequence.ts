import { IAutoMovieMesh } from "@automovie/interface";

import { measureAutoMovieMeshClearance } from "./measureAutoMovieMeshClearance";
import { triangleIndicesOf } from "./triangleIndicesOf";
import { overflowsBinary64 } from "../../math/internal/overflowsBinary64";

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
 * @throws Error for malformed triangles, non-finite coordinates or clearance,
 *   an invalid axis, or arithmetic that exceeds finite translations or
 *   positions.
 */
export function separateAutoMovieMeshSequence(
  meshes: readonly IAutoMovieMesh[],
  axis: "x" | "y" | "z",
  clearance: number = 0,
): IAutoMovieMesh[] {
  if (axis !== "x" && axis !== "y" && axis !== "z")
    throw new Error("Mesh clearance needs an X, Y or Z depth axis.");
  const depth: number = { x: 0, y: 1, z: 2 }[axis];
  if (clearance < 0)
    throw new Error(
      "Mesh separation clearance must be finite and nonnegative.",
    );
  const intervals: { minimum: number; maximum: number }[] = meshes.map(
    (mesh: IAutoMovieMesh): { minimum: number; maximum: number } => {
      triangleIndicesOf(mesh, "Mesh clearance (complete triangle buffers)");
      let minimum: number = Infinity;
      let maximum: number = -Infinity;
      for (let i: number = depth; i < mesh.positions.length; i += 3) {
        minimum = Math.min(minimum, mesh.positions[i]!);
        maximum = Math.max(maximum, mesh.positions[i]!);
      }
      return { minimum, maximum };
    },
  );
  const travel: number[] = new Array<number>(meshes.length).fill(0);
  for (let later: number = 1; later < meshes.length; later++) {
    travel[later] = travel[later - 1]!;
    for (let earlier: number = 0; earlier < later; earlier++) {
      // Nondecreasing translations only enlarge an already-clear depth gap.
      // This conservative interval proof avoids clipping distant pairs while
      // retaining all close and overlapping pairs, including non-neighbours.
      if (intervals[later]!.minimum - intervals[earlier]!.maximum >= clearance)
        continue;
      for (const { minimum } of measureAutoMovieMeshClearance(
        meshes[later]!,
        meshes[earlier]!,
        axis,
      ))
        travel[later] = Math.max(
          travel[later]!,
          travel[earlier]! + (clearance - minimum),
        );
    }
    // Accumulated finite translations can overflow binary64.
    if (overflowsBinary64(travel[later]!))
      throw new Error("Mesh separation exceeds finite translation.");
  }
  const centre: number = (travel.at(-1) ?? 0) / 2;
  return meshes.map((mesh: IAutoMovieMesh, index: number): IAutoMovieMesh => {
    const result: IAutoMovieMesh = structuredClone(mesh);
    for (let i: number = depth; i < result.positions.length; i += 3) {
      result.positions[i] += travel[index]! - centre;
      if (overflowsBinary64(result.positions[i]!))
        throw new Error("Mesh separation exceeds finite positions.");
    }
    return result;
  });
}

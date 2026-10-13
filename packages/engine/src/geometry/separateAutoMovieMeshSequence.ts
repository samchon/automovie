import { IAutoMovieMesh } from "@automovie/interface";
import { measureAutoMovieMeshClearance } from "./measureAutoMovieMeshClearance";
import { triangleIndicesOf } from "./triangleIndicesOf";
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
 * an invalid axis, or arithmetic that exceeds finite translations or positions.
 *
 * @evidence contracts/common.md#principled-implementation Each projected-overlap minimum defines a difference constraint between an earlier and later mesh; the forward longest-path pass satisfies this acyclic graph, and subtracting half the last travel preserves every relative displacement while balancing the endpoints. Axis-parallel faces remain outside the directional clearance contract.
 * @evidence contracts/common.md#clear-and-simple-design Shared triangleIndicesOf admits connectivity and measureAutoMovieMeshClearance owns projection and clipping; this function owns only axial intervals, ordered constraints and rigid buffer copies, avoiding a second projected-triangle implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The interval shortcut skips only pairs already proved clear under nondecreasing travel; no projected area is evaluated for those pairs, and malformed singleton meshes are still refused before the shortcut.
 * @evidence contracts/common.md#meaningful-documentation Describes metres, caller-defined order, balanced translations, fresh output ownership, the axis-parallel limitation and the malformed-input and overflow refusals.
 * @evidence contracts/performance.md#efficient-algorithms For M meshes and V total coordinates, interval admission and copies cost O(V), the ordered graph considers O(M squared) pairs, and only pairs without an axial separation proof invoke the indexed projected-clearance measure; travel and interval tables use O(M) space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A call places one current sequence; no results survive coordinate changes, and each earlier/later pair is measured at most once within the call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Interval and travel arrays are call-local and bounded by the mesh count; structuredClone transfers fresh attribute buffers to each returned mesh, with no retained cache or running resource.
 */
export function separateAutoMovieMeshSequence(
  meshes: readonly IAutoMovieMesh[],
  axis: "x" | "y" | "z",
  clearance: number = 0,
): IAutoMovieMesh[] {
  if (axis !== "x" && axis !== "y" && axis !== "z")
    throw new Error("Mesh clearance needs an X, Y or Z depth axis.");
  const depth: number = { x: 0, y: 1, z: 2 }[axis];
  if (!Number.isFinite(clearance) || clearance < 0)
    throw new Error(
      "Mesh separation clearance must be finite and nonnegative.",
    );
  const intervals: { minimum: number; maximum: number }[] = meshes.map((mesh: IAutoMovieMesh): { minimum: number; maximum: number } => {
    triangleIndicesOf(mesh, "Mesh clearance (complete triangle buffers)");
    for (let i: number = 0; i < mesh.positions.length; ++i)
      if (!Number.isFinite(mesh.positions[i]))
        throw new Error("Mesh clearance needs finite complete triangle buffers.");
    let minimum: number = Infinity;
    let maximum: number = -Infinity;
    for (let i: number = depth; i < mesh.positions.length; i += 3) {
      minimum = Math.min(minimum, mesh.positions[i]!);
      maximum = Math.max(maximum, mesh.positions[i]!);
    }
    return { minimum, maximum };
  });
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
    if (!Number.isFinite(travel[later]))
      throw new Error("Mesh separation exceeds finite translation.");
  }
  const centre: number = (travel.at(-1) ?? 0) / 2;
  return meshes.map((mesh: IAutoMovieMesh, index: number): IAutoMovieMesh => {
    const result: IAutoMovieMesh = structuredClone(mesh);
    for (let i: number = depth; i < result.positions.length; i += 3) {
      result.positions[i] += travel[index]! - centre;
      if (!Number.isFinite(result.positions[i]))
        throw new Error("Mesh separation exceeds finite positions.");
    }
    return result;
  });
}

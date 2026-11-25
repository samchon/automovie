import {
  IAutoMovieActionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Resolve a staged node, literal point or complete group to world metres. Node
 * and point results alias their supplied vectors. A group returns a fresh
 * centroid with each named node or formation weighted once; an empty group or
 * any absent member returns null, so resolution never changes the authored
 * group.
 *
 * Relative goals and live bones need facing, camera or rig inputs and return
 * null here. Callers validate target shapes and finite coordinates first. A
 * group naming formations requires their world-point table too.
 *
 * @param target The admitted positional target or unsupported relative/live
 *   kind.
 * @param nodes Staged node and camera positions, read without mutation.
 * @param formations Compact formation positions, each one centroid member.
 * @returns The aliased node/point vector, a fresh group centroid, or null.
 */
export function resolveTargetPoint(
  target: IAutoMovieActionTarget,
  nodes: ReadonlyMap<string, IAutoMovieVector3>,
  formations?: ReadonlyMap<string, IAutoMovieVector3>,
): IAutoMovieVector3 | null {
  if (target.kind === "node") return nodes.get(target.node) ?? null;
  if (target.kind === "point") return target.point;
  if (target.kind !== "group") return null;
  const mean: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let count: number = 0;
  function include(point: IAutoMovieVector3): void {
    ++count;
    const priorWeight: number = (count - 1) / count;
    mean.x = mean.x * priorWeight + point.x / count;
    mean.y = mean.y * priorWeight + point.y / count;
    mean.z = mean.z * priorWeight + point.z / count;
  }
  for (const id of target.nodes) {
    const point: IAutoMovieVector3 | undefined = nodes.get(id);
    if (point === undefined) return null;
    include(point);
  }
  for (const id of target.formations ?? []) {
    const point: IAutoMovieVector3 | undefined = formations?.get(id);
    if (point === undefined) return null;
    include(point);
  }
  return count === 0 ? null : mean;
}

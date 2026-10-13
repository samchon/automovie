import { IAutoMovieActionTarget, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Resolve a staged node, literal point or complete group to world metres.
 * Node and point results alias their supplied vectors. A group returns a fresh
 * centroid with each named node or formation weighted once; an empty group or
 * any absent member returns null, so resolution never changes the authored group.
 *
 * Relative goals and live bones need facing, camera or rig inputs and return
 * null here. Callers validate target shapes and finite coordinates first.
 * A group naming formations requires their world-point table too.
 *
 * @param target The admitted positional target or unsupported relative/live kind.
 * @param nodes Staged node and camera positions, read without mutation.
 * @param formations Compact formation positions, each one centroid member.
 * @returns The aliased node/point vector, a fresh group centroid, or null.
 *
 * @evidence contracts/common.md#principled-implementation Resolves identities through the supplied placement tables and computes an equal-weight running centroid using convex combinations, avoiding overflow from summing many finite coordinates; admitted target shapes and finite world vectors are premises, and ordinary floating rounding remains in the mean.
 * @evidence contracts/common.md#clear-and-simple-design Owns only staged point resolution for the actor synthesizer and film gates; bones and relative targets return null because their live rig or camera context belongs to those callers, while group membership is resolved completely before a centroid can be returned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No actor or formation is special-cased and no absent member is filtered out; the same missing lookup makes a singleton or mixed group unresolved instead of changing its centre to a surviving subset.
 * @evidence contracts/common.md#meaningful-documentation States the world frame and unit, per-kind result and aliasing, equal member weights, empty and missing-member outcomes, the finite-shape precondition and the extra context needed for relative or live targets.
 * @evidence contracts/performance.md#efficient-algorithms Node and point resolution take constant work; a group visits each named node and formation once through map lookups with constant temporary space and exits on its first absent member, without allocating intermediate member arrays.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller supplies current placement maps for one target read; no result is reused across mutable scenes or instants, and no geometry or effectful work is coordinated here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns only one local centroid vector and count during a group read; node and point answers retain no new storage, and the caller owns the fresh centroid after return.
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
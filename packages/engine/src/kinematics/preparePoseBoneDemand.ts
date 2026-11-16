import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Copy a live requested-name set into this immutable rig's parent-first output
 * indices. An omitted set selects every indexed node; unreachable names are
 * absent. The returned list is private prepared input, kept unchanged by its
 * caller, and contains no FK result or pose dependency.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States live-set snapshotting, omitted/all semantics, reachable membership, parent-first order and private unchanged ownership.
 * @evidence contracts/development/implementation.md#principled-implementation The static producer numbers rooted nodes in parent-first traversal order. Name lookup followed by numeric sorting therefore preserves that exact relative order while omitting unreachable names.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns only demand preparation; ordered joint admission and sparse ancestor FK remain in preparePoseResolutionState.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Indices come only from the supplied actual immutable rig map; no external numeric list, target result, assumed body shape or tolerance replaces name resolution.
 * @evidence contracts/development/implementation.md#efficient-algorithms K requested names cost O(K log K) time and O(K) output; omitted demand builds B indices in O(B). A prepared-demand reader pays this once instead of every FK query.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller's unchanged immutable rig fixes index/name equivalence and this call snapshots actual set membership. Later live-set edits require another preparation; ordinary unprepared reads invoke this again.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one caller-owned index array, bounded by requested/reachable population; no set, pose, source rig object, global collection, handle or task is retained.
 */
export function preparePoseBoneDemand(
  indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
  count: number,
  requested?: ReadonlySet<AutoMovieHumanoidBone>,
): readonly number[] {
  const demanded: number[] = [];
  if (requested === undefined)
    for (let index: number = 0; index < count; ++index) demanded.push(index);
  else {
    for (const name of requested) {
      const index: number | undefined = indices.get(name);
      if (index !== undefined) demanded.push(index);
    }
    demanded.sort((left: number, right: number): number => left - right);
  }
  return demanded;
}

import { IAutoMovieFilmEdit, IAutoMovieShotContract, type IAutoMovieVideoEdit } from "@automovie/interface";
import type { IProductionShotAssemblyEntry } from "./IProductionShotAssemblyEntry";

/**
 * Order each unique contracted shot by its first film placement, then append unplaced contracts in map iteration order. Subsequent placements of an already ordered shot do not cause another source evaluation here.
 *
 * @evidence contracts/common.md#principled-implementation A placed-id set admits the first known edit occurrence and a final contract-map pass appends unseen shots. Missing contracts in the edit are ignored here and diagnosed by film validation.
 * @evidence contracts/common.md#clear-and-simple-design The compilation coordinator consumes this order and tracks occurrence boundaries separately; each row retains its contract and optional original placement/index.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Repeated placements do not duplicate source execution, unknown edit ids do not fabricate contracts, and omitted graph sources still enter the unplaced remainder for their diagnostics.
 * @evidence contracts/common.md#meaningful-documentation States first-placement semantics, stable remainder order, borrowed placement references, zero-based indices and null placement meaning.
 * @evidence contracts/performance.md#efficient-algorithms One V-placement pass and one S-contract pass take O(V+S) expected set/map work with O(S) output/set storage, avoiding a sort or repeated search of the growing ordered list.
 * @evidence contracts/performance.md#reuse-equivalent-work The same placed-id set serves edit admission and remainder selection. The order is rebuilt for each mutable edit/contract snapshot with no cross-build cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned rows borrow contracts and placements and are owned by the compilation attempt; the local set expires on return. No handle or task is created and output grows with contracted shots.
 */
export const shotAssemblyOrder: (contracts: ReadonlyMap<string, IAutoMovieShotContract>, edit: IAutoMovieFilmEdit | null) => IProductionShotAssemblyEntry[] = (
  contracts: ReadonlyMap<string, IAutoMovieShotContract>,
  edit: IAutoMovieFilmEdit | null,
): IProductionShotAssemblyEntry[] => {
  const ordered: IProductionShotAssemblyEntry[] = [];
  const placed: Set<string> = new Set<string>();
  edit?.tracks.video.forEach((placement: IAutoMovieVideoEdit, placementIndex: number) : void => {
    const contract: IAutoMovieShotContract | undefined = contracts.get(placement.shot);
    if (contract === undefined || placed.has(placement.shot)) return;
    placed.add(placement.shot);
    ordered.push({
      id: placement.shot,
      contract,
      placement,
      placementIndex,
    });
  });
  for (const [id, contract] of contracts)
    if (placed.has(id) === false)
      ordered.push({ id, contract, placement: null, placementIndex: null });
  return ordered;
};

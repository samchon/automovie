import { readAutoMovieProductionProjectJson as readOwnedJson } from "./readAutoMovieProductionProjectJson";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateProductionRegistry } from "./productionProjectValidateProductionRegistry";
import { productionProjectRefreshRevision } from "./productionProjectRefreshRevision";

/**
 * Read the currently registered production ids under the active namespace fence.
 *
 * @evidence contracts/common.md#principled-implementation Refreshes root/incarnation/revision, reads the owned registry and validates its production entries before copying their code-unit-sorted ids; malformed present registry data refuses.
 * @evidence contracts/common.md#clear-and-simple-design Registry schema admission stays in its validator, while this operation exposes only a detached id array to the facade and summary reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeps validator sorting and missing-registry refusal policy without treating arbitrary read failures as an empty project or deduplicating conflicting portable id spellings.
 * @evidence contracts/common.md#meaningful-documentation States that ids are current registry observations, with production currentness checked before their acquisition rather than a cached opening list.
 * @evidence contracts/performance.md#efficient-algorithms Includes physical/revision checks, full registry read/parse/validation and an O(P) result copy; validation sorts P ids in O(P log P) and can perform O(K*P) membership work for K retired incarnation keys, in addition to id encoding.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads the registry again for each call because other production mutations can change it independently; only the opening identity expectations are shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed registry data is temporary and the copied id population transfers without a local count cap; delegated readers attempt descriptor cleanup and report failure, while this operation retains no registry cache.
 */
export function productionProjectProductionIds(state: AutoMovieProductionProjectState): string[] {
    productionProjectRefreshRevision(state);
    return [
        ...productionProjectValidateProductionRegistry(readOwnedJson(state.rootReal, state.registryPath), state.registryPath).productions,
    ];
}

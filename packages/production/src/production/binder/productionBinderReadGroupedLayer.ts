import type { Dirent } from "node:fs";
import { IAutoMovieProductionBinderAuthoredDocumentGroup } from "./IAutoMovieProductionBinderAuthoredDocumentGroup";
import { productionBinderGroupPattern } from "./productionBinderGroupPattern";
import { productionBinderReadAuthoredGroup } from "./productionBinderReadAuthoredGroup";
import { productionBinderPhysicalEntries } from "./productionBinderPhysicalEntries";
import { productionBinderNumberedOrder } from "./productionBinderNumberedOrder";

/**
 * Read scripts or screenplays through their numbered group/unit topology.
 *
 * @evidence contracts/common.md#principled-implementation Physical entry admission precedes the fixed numbered-group spelling filter, numeric/code-unit ordering and sequential complete group reads; the spelling profile is the authored scaffold's topology, not a content-specific title.
 * @evidence contracts/common.md#clear-and-simple-design Owns grouped scripts/screenplays ordering while each group reader owns its index title and unit population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No matching groups refuses and linked entries refuse before filtering; unrelated ordinary entries are omitted under the supported numbered-group profile.
 * @evidence contracts/common.md#meaningful-documentation States exact group spelling, nonempty result and sequential read/refusal behavior; matching names alone do not validate group document contents.
 * @evidence contracts/performance.md#efficient-algorithms Scans E entries, sorts G accepted names in O(G log G) comparisons and reads every group's units; all nested metadata/text costs remain part of this call.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted entry list supplies filter/order once, and one shared nonglobal group pattern drives filtering and the per-list comparator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Entry/name arrays and all completed groups remain live until returned without a fixed cap; no native handle or persistent group cache is owned here.
 */
export async function productionBinderReadGroupedLayer(layerRoot: string): Promise<IAutoMovieProductionBinderAuthoredDocumentGroup[]> {
    const entries: Dirent[] = await productionBinderPhysicalEntries(layerRoot).catch((error: unknown): never => {
        if (error instanceof Error && error.message.startsWith(layerRoot))
            throw error;
        throw new Error(`${layerRoot}: the production has no authored groups.`);
    });
    const names: string[] = entries
        .filter((entry: Dirent): boolean => entry.isDirectory() && productionBinderGroupPattern.test(entry.name))
        .map((entry: Dirent): string => entry.name)
        .sort(productionBinderNumberedOrder(productionBinderGroupPattern));
    if (names.length === 0)
        throw new Error(`${layerRoot}: the production has no authored groups.`);
    const groups: IAutoMovieProductionBinderAuthoredDocumentGroup[] = [];
    for (const name of names)
        groups.push(await productionBinderReadAuthoredGroup(layerRoot, name));
    return groups;
}

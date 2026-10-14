import type { Dirent } from "node:fs";
import * as path from "node:path";
import { IAutoMovieProductionBinderAuthoredDocument } from "./IAutoMovieProductionBinderAuthoredDocument";
import { IAutoMovieProductionBinderAuthoredDocumentGroup } from "./IAutoMovieProductionBinderAuthoredDocumentGroup";
import { productionBinderUnitPattern } from "./productionBinderUnitPattern";
import { productionBinderReadAuthoredDocument } from "./productionBinderReadAuthoredDocument";
import { productionBinderPhysicalEntries } from "./productionBinderPhysicalEntries";
import { productionBinderReadPhysicalMarkdown } from "./productionBinderReadPhysicalMarkdown";
import { productionBinderNumberedOrder } from "./productionBinderNumberedOrder";
import { productionBinderStripHeadingAnchor } from "./productionBinderStripHeadingAnchor";

/**
 * Read one group's index title and ordered current unit documents.
 *
 * @evidence contracts/common.md#principled-implementation Requires current physical index.md with an initial H1, then physical group entries filtered by the numbered-unit profile are ordered and read. The index names the group but does not enumerate or override its unit membership.
 * @evidence contracts/common.md#clear-and-simple-design Keeps index/title and unit collection together while physical Markdown reading and individual document extraction remain shared.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Any index read failure becomes the existing index-title error; empty accepted units refuse and no default title/unit is inserted.
 * @evidence contracts/common.md#meaningful-documentation Defines index-title provenance, accepted unit naming/order and sequential document acquisition, without claiming an atomic index/unit snapshot.
 * @evidence contracts/performance.md#efficient-algorithms Reads index bytes, scans E group entries, sorts U accepted unit names and performs all U document reads/transforms; total text and population drive work/storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The one admitted index supplies its title and one ordered unit list drives document reads; no prior group result bypasses current entry checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Index text, entries and U document strings coexist locally, and returned group data transfers to assembly without a fixed cap or retained watcher.
 */
export async function productionBinderReadAuthoredGroup(layerRoot: string, name: string): Promise<IAutoMovieProductionBinderAuthoredDocumentGroup> {
    const groupRoot: string = path.join(layerRoot, name);
    const indexPath: string = path.join(groupRoot, "index.md");
    const index: string = await productionBinderReadPhysicalMarkdown(indexPath).catch((): never => {
        throw new Error(`${indexPath}: a group must carry its index.md title.`);
    });
    const heading: RegExpExecArray | null = /^#[ \t]+(\S.*)(?:\n|$)/u.exec(index);
    if (heading === null)
        throw new Error(`${indexPath}: a group index must open with one H1 title.`);
    const entries: Dirent[] = await productionBinderPhysicalEntries(groupRoot);
    const names: string[] = entries
        .filter((entry: Dirent): boolean => entry.isFile() && productionBinderUnitPattern.test(entry.name))
        .map((entry: Dirent): string => entry.name)
        .sort(productionBinderNumberedOrder(productionBinderUnitPattern));
    if (names.length === 0)
        throw new Error(`${groupRoot}: a group must contain at least one unit file.`);
    const documents: IAutoMovieProductionBinderAuthoredDocument[] = [];
    for (const unit of names)
        documents.push(await productionBinderReadAuthoredDocument(path.join(groupRoot, unit)));
    return {
        title: productionBinderStripHeadingAnchor(heading[1]),
        documents,
    };
}

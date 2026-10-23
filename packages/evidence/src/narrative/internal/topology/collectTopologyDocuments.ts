import type { IEvidenceInventory } from "@wrtnlabs/evidence";

import type { NarrativeLayer } from "../../NarrativeLayer";
import type { IProductionTopologyDocument } from "./IProductionTopologyDocument";

/**
 * Reuses native heading units and logical paths from the captured population.
 *
 * @evidence contracts/common.md#principled-implementation Native H1-H4 Markdown sites supply ordered heading identities; selected layer-relative aliases supply document paths, and two captured versions with the same logical path but different digests throw.
 * @evidence contracts/common.md#clear-and-simple-design One physical-file heading index joins native units to sources, while the logical-document Map preserves authored relative identity for later topology comparisons.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only selected aliases of the requested layer enter the partition; conflicting captured bytes fail rather than selecting a preferred version.
 * @evidence contracts/common.md#meaningful-documentation The comment states native heading and captured-path reuse; document fields preserve source bytes, anchor, title, depth and offset.
 * @evidence contracts/performance.md#efficient-algorithms For h heading sites, a aliases and d documents, joins cost O(h + a), heading sorting is bounded by O(h log h) per source traversal in aggregate absent repeated physical records, and final sorting costs O(d log d); repeated source records can repeat their heading sort.
 * @evidence contracts/performance.md#reuse-equivalent-work The physical-file Map shares one heading list across aliases and each logical path is deduplicated; native source objects are retained by reference instead of reparsed or copied.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local Maps and heading lists scale with captured sites/documents; returned records keep captured sources alive under caller ownership, with no additional file handles or persistent cache.
 */
export function collectTopologyDocuments(
  inventory: IEvidenceInventory,
  layer: NarrativeLayer,
): IProductionTopologyDocument[] {
  const documents: Map<string, IProductionTopologyDocument> = new Map();
  const byFile: Map<string, IProductionTopologyDocument["headings"]> =
    new Map();
  for (const unit of inventory.units) {
    if (unit.type !== "markdown" || !/^h[1-4]$/u.test(unit.symbol)) continue;
    for (const site of unit.sites) {
      const headings: IProductionTopologyDocument["headings"] =
        byFile.get(site.file) ?? [];
      headings.push({
        level: Number(unit.symbol.slice(1)),
        title: unit.name,
        anchor: unit.identity[0],
        start: site.range.start.offset,
      });
      byFile.set(site.file, headings);
    }
  }
  for (const source of inventory.sources) {
    const headings: IProductionTopologyDocument["headings"] = (
      byFile.get(source.physicalPath) ?? []
    ).sort(
      (
        left: IProductionTopologyDocument["headings"][number],
        right: IProductionTopologyDocument["headings"][number],
      ): number => left.start - right.start,
    );
    for (const address of source.addresses) {
      const relative: string = address.relative.replaceAll("\\", "/");
      if (address.selected === false || !relative.startsWith(`${layer}/`))
        continue;
      const file: string = relative.slice(layer.length + 1);
      const previous: IProductionTopologyDocument | undefined =
        documents.get(file);
      if (previous !== undefined && previous.source.digest !== source.digest)
        throw new Error(
          `Captured narrative versions disagree at ${layer}/${file}.`,
        );
      documents.set(file, { relative: file, source, headings });
    }
  }
  return [...documents.values()].sort(
    (
      left: IProductionTopologyDocument,
      right: IProductionTopologyDocument,
    ): number =>
      left.relative < right.relative
        ? -1
        : left.relative > right.relative
          ? 1
          : 0,
  );
}

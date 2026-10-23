import type { IEvidenceInventory } from "@wrtnlabs/evidence";

import type { NarrativeLayer } from "../../NarrativeLayer";
import type { IProductionTopologyDocument } from "./IProductionTopologyDocument";

/** Reuses native heading units and logical paths from the captured population. */
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

import {
  type IEvidenceInventory,
  type IEvidenceSourceAddress,
} from "@wrtnlabs/evidence";
import path from "node:path";

import type { AuthoredLayer } from "../../AuthoredLayer";
import { AUTHORED_LAYERS } from "../AUTHORED_LAYERS";
import { bodyPathLayer } from "./bodyPathLayer";
import { withinProductionDirectory } from "./withinProductionDirectory";

/**
 * Resolves body layer identities from captured source addresses and declared selector prefixes.
 *
 * @evidence contracts/common.md#principled-implementation Both captured physical/logical source addresses and positive selector prefixes are resolved against the four body-layer directories, retaining layer identity even when a selector currently matches no file.
 * @evidence contracts/common.md#clear-and-simple-design A Set collects layer identities once; selector-prefix interpretation supplements captured sources instead of guessing pass ownership from body paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The prefix stops at supported glob metacharacters and ignores negative selectors because they cannot introduce a host; it does not inspect expected results.
 * @evidence contracts/common.md#meaningful-documentation The comment states the two identity sources; the signature makes the captured inventory and supplied canonicalizer explicit.
 * @evidence contracts/performance.md#efficient-algorithms For a captured-address count a and selector text size p, scans cost O(a + p) path operations over four fixed layers; the result Set holds at most four layers, while temporary selector/address arrays scale with input.
 * @evidence contracts/performance.md#reuse-equivalent-work The provided canonicalizer is reused for every comparison, so equivalent captured aliases use its identity; no live-filesystem result is independently cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only input-proportional temporary arrays and a maximum-four-entry result Set are owned; all are released after return except the caller-owned result.
 */
export function bodyLayers(
  root: string,
  selectedRoot: string | undefined,
  files: string[],
  inventory: IEvidenceInventory,
  canonical: (filename: string, logicalRoot?: string) => string,
): Set<(typeof AUTHORED_LAYERS)[number]> {
  const found: Set<AuthoredLayer> = new Set<(typeof AUTHORED_LAYERS)[number]>();
  for (const source of inventory.sources)
    for (const address of [
      source.physicalPath,
      ...source.addresses.map(
        (address: IEvidenceSourceAddress): string => address.absolute,
      ),
    ]) {
      const layer: AuthoredLayer | undefined = bodyPathLayer(
        root,
        address,
        canonical,
      );
      if (layer !== undefined) found.add(layer);
    }
  for (const selector of files.filter(
    (file: string): boolean => !file.startsWith("!"),
  )) {
    const portable: string = selector.replaceAll("\\", "/");
    const end: number = Math.min(
      ...["*", "?", "[", "{", "("].map((symbol: string): number => {
        const index: number = portable.indexOf(symbol);
        return index < 0 ? portable.length : index;
      }),
    );
    const prefix: string = path.resolve(
      root,
      selectedRoot?.replaceAll("\\", "/") ?? "",
      portable.slice(0, end),
    );
    for (const layer of AUTHORED_LAYERS) {
      const directory: string = path.resolve(root, "docs", "body", layer);
      if (withinProductionDirectory(root, prefix, directory, canonical))
        found.add(layer);
    }
  }
  return found;
}

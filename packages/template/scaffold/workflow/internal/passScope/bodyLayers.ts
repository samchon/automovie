import {
  type IEvidenceInventory,
  type IEvidenceSourceAddress,
} from "@wrtnlabs/evidence";
import path from "node:path";

import type { AuthoredLayer } from "../../AuthoredLayer";
import { canonicalProductionPath as canonical } from "../../canonicalProductionPath";
import { AUTHORED_LAYERS } from "../AUTHORED_LAYERS";
import { bodyPathLayer } from "./bodyPathLayer";

/** Resolves body layer identities from captured source addresses and declared selector prefixes. */
export function bodyLayers(
  root: string,
  selectedRoot: string | undefined,
  files: string[],
  inventory: IEvidenceInventory,
): Set<(typeof AUTHORED_LAYERS)[number]> {
  const found: Set<AuthoredLayer> = new Set<(typeof AUTHORED_LAYERS)[number]>();
  for (const source of inventory.sources)
    for (const address of [
      source.physicalPath,
      ...source.addresses.map(
        (address: IEvidenceSourceAddress): string => address.absolute,
      ),
    ]) {
      const layer: AuthoredLayer | undefined = bodyPathLayer(root, address);
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
    const prefix: string = canonical(
      path.resolve(
        root,
        selectedRoot?.replaceAll("\\", "/") ?? "",
        portable.slice(0, end),
      ),
    );
    for (const layer of AUTHORED_LAYERS) {
      const directory: string = canonical(
        path.resolve(root, "docs", "body", layer),
      );
      if (prefix === directory || prefix.startsWith(`${directory}/`))
        found.add(layer);
    }
  }
  return found;
}

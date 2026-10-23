import type { IEvidenceInventory } from "@wrtnlabs/evidence";

import type { NarrativeLayer } from "../../NarrativeLayer";

/** Recovers visited directories, including empty ones, from the original glob capture. */
export function collectTopologyDirectories(
  inventory: IEvidenceInventory,
  layer: NarrativeLayer,
): string[] {
  const roots: Set<string> = new Set();
  for (const source of inventory.sources)
    for (const address of source.addresses) {
      const relative: string = address.relative.replaceAll("\\", "/");
      if (address.selected === false || !relative.startsWith(`${layer}/`))
        continue;
      const absolute: string = address.absolute.replaceAll("\\", "/");
      roots.add(`${absolute.slice(0, -relative.length)}${layer}/`);
    }
  const directories: Set<string> = new Set();
  for (const dependency of inventory.dependencies) {
    if (!dependency.recursive) continue;
    const absolute: string = dependency.path.replaceAll("\\", "/");
    for (const root of roots) {
      const windows: boolean = /^[A-Za-z]:\//u.test(root);
      if (
        (windows ? absolute.toLowerCase() : absolute).startsWith(
          windows ? root.toLowerCase() : root,
        )
      )
        directories.add(absolute.slice(root.length));
    }
  }
  return [...directories]
    .filter((directory: string): boolean => directory !== "")
    .sort((left: string, right: string): number =>
      left < right ? -1 : left > right ? 1 : 0,
    );
}

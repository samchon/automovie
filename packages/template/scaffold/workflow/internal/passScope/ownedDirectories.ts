import path from "node:path";

import type { IProductionGateKey } from "../../IProductionGateKey";

/** Names the authored input directories belonging to one layer and validation pass. */
export function ownedDirectories(
  root: string,
  key: IProductionGateKey,
  edition: string,
): string[] {
  return [
    path.resolve(root, "docs/body", key.layer),
    path.resolve(root, "docs/revision", key.layer),
    ...(key.pass === "naturalness"
      ? [path.resolve(root, "docs/naturalness", key.layer)]
      : []),
    ...["files", "units"].map((carrier: string): string =>
      path.resolve(root, "docs/evidence", key.pass, carrier, key.layer),
    ),
    path.resolve(root, "docs/review", edition, key.layer),
  ];
}

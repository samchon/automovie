import path from "node:path";

import type { AuthoredLayer } from "../../AuthoredLayer";
import { AUTHORED_LAYERS } from "../AUTHORED_LAYERS";
import { withinProductionDirectory } from "./withinProductionDirectory";

/** The shared body has an exact layer even though its pass comes from claims. */
export function bodyPathLayer(
  root: string,
  filename: string,
  canonical: (filename: string, logicalRoot?: string) => string,
): (typeof AUTHORED_LAYERS)[number] | undefined {
  return AUTHORED_LAYERS.find((layer: AuthoredLayer): boolean =>
    withinProductionDirectory(
      root,
      filename,
      path.resolve(root, "docs", "body", layer),
      canonical,
    ),
  );
}

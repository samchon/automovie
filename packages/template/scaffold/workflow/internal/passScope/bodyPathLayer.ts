import path from "node:path";

import type { AuthoredLayer } from "../../AuthoredLayer";
import { canonicalProductionPath as canonical } from "../../canonicalProductionPath";
import { AUTHORED_LAYERS } from "../AUTHORED_LAYERS";

/** The shared body has an exact layer even though its pass comes from claims. */
export function bodyPathLayer(
  root: string,
  filename: string,
): (typeof AUTHORED_LAYERS)[number] | undefined {
  const target: string = canonical(filename);
  return AUTHORED_LAYERS.find((layer: AuthoredLayer): boolean => {
    const directory: string = canonical(
      path.resolve(root, "docs", "body", layer),
    );
    return target === directory || target.startsWith(`${directory}/`);
  });
}

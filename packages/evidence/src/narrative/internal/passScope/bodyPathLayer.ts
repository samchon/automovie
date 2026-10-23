import path from "node:path";

import type { AuthoredLayer } from "../../AuthoredLayer";
import { AUTHORED_LAYERS } from "../AUTHORED_LAYERS";
import { withinProductionDirectory } from "./withinProductionDirectory";

/**
 * The shared body has an exact layer even though its pass comes from claims.
 *
 * @evidence contracts/common.md#principled-implementation The first fixed layer whose body directory contains the address is found with the supplied physical/logical directory predicate; no pass is inferred from a shared body address.
 * @evidence contracts/common.md#clear-and-simple-design This helper exposes the body-layer question separately from authoredPathOwner, which owns pass-specific trees.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The four body directory names are declared production boundaries, and matching does not infer ownership from filenames or claim labels.
 * @evidence contracts/common.md#meaningful-documentation The comment states that body has a layer while claims determine its pass, including the undefined case when no directory contains it.
 * @evidence contracts/performance.md#efficient-algorithms At most four path constructions and containment checks cost O(p) in path length with a fixed number of temporaries.
 * @evidence contracts/performance.md#reuse-equivalent-work The helper reuses AUTHORED_LAYERS and the captured canonicalizer; it owns no cross-request cache whose invalidation could outlive that capture.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Paths and comparison results are call-local; the returned layer is a fixed string and no handles or retained tasks are created.
 */
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

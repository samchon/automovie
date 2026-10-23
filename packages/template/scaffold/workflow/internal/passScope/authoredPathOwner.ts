import path from "node:path";

import type { IProductionGateKey } from "../../IProductionGateKey";
import { AUTHORED_LAYERS } from "../AUTHORED_LAYERS";
import { hasNaturalness } from "../hasNaturalness";
import { withinProductionDirectory } from "./withinProductionDirectory";

/** Resolves authored input boundaries, never generated claim ownership. */
export function authoredPathOwner(
  root: string,
  filename: string,
  canonical: (filename: string, logicalRoot?: string) => string,
): IProductionGateKey | undefined {
  const within: (directory: string) => boolean = (directory: string): boolean =>
    withinProductionDirectory(root, filename, directory, canonical);
  for (const layer of AUTHORED_LAYERS)
    for (const [edition, pass] of [
      ["draft", "construction"],
      ["final", "naturalness"],
    ] as const) {
      if (pass === "naturalness" && !hasNaturalness(layer)) continue;
      const evidence: string = path.resolve(root, "docs", "evidence", pass);
      if (
        ["files", "units"].some((carrier: string): boolean =>
          within(path.resolve(evidence, carrier, layer)),
        )
      )
        return { layer, pass };
      const review: string = path.resolve(
        root,
        "docs",
        "review",
        edition,
        layer,
      );
      if (within(review)) return { layer, pass };
      if (pass === "naturalness") {
        const working: string = path.resolve(root, "docs/naturalness", layer);
        if (within(working)) return { layer, pass };
      }
    }
  for (const layer of AUTHORED_LAYERS) {
    const revision: string = path.resolve(root, "docs", "revision", layer);
    if (within(revision)) return { layer, pass: "construction" };
  }
  // Body's pass identity follows its construction claim or upstream selection.
  return undefined;
}

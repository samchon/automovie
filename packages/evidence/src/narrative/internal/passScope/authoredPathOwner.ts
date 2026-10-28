import path from "node:path";

import type { IProductionGateKey } from "../../IProductionGateKey";
import { AUTHORED_LAYERS } from "../AUTHORED_LAYERS";
import { hasNaturalness } from "../hasNaturalness";
import { withinProductionDirectory } from "./withinProductionDirectory";

/**
 * Resolves authored input boundaries, never generated claim ownership.
 *
 * @evidence contracts/common.md#principled-implementation Every supported layer is checked against detached evidence, review, working naturalness and frozen revision directories through the supplied captured canonicalizer; shared body paths intentionally have no pass owner here.
 * @evidence contracts/common.md#clear-and-simple-design The path-to-pass decision stays in one helper, while body ownership remains with the claim or upstream selection that can distinguish its pass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current naturalness ownership exists only for screenplay; retired script trees remain protected unaudited boundaries, and matching uses directory boundaries rather than consumer names.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies authored-input ownership and excludes generated claim ownership; the final comment explains why body paths return undefined.
 * @evidence contracts/performance.md#efficient-algorithms The four layers and their supported passes produce a fixed number of directory comparisons, each linear in path length, with constant-count temporary paths.
 * @evidence contracts/performance.md#reuse-equivalent-work All ownership checks share the caller-supplied canonicalizer, preserving its physical snapshot; the helper caches no result beyond that snapshot owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Constructed paths and the optional key are call-local or returned to the caller; no directory is opened and no global owner table grows.
 */
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

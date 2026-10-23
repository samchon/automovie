import path from "node:path";

import type { IProductionGateKey } from "../../IProductionGateKey";
import { canonicalProductionPath as canonical } from "../../canonicalProductionPath";
import { AUTHORED_LAYERS } from "../AUTHORED_LAYERS";
import { hasNaturalness } from "../hasNaturalness";

/** Resolves authored input boundaries, never generated claim ownership. */
export function authoredPathOwner(
  root: string,
  filename: string,
): IProductionGateKey | undefined {
  const normalized: string = canonical(filename);
  for (const layer of AUTHORED_LAYERS)
    for (const [edition, pass] of [
      ["draft", "construction"],
      ["final", "naturalness"],
    ] as const) {
      if (pass === "naturalness" && !hasNaturalness(layer)) continue;
      const evidence: string = `${canonical(path.resolve(root, "docs", "evidence", pass))}/`;
      if (
        ["files", "units"].some((carrier: string): boolean => {
          const prefix: string = `${evidence}${carrier}/${layer}`;
          return normalized === prefix || normalized.startsWith(`${prefix}/`);
        })
      )
        return { layer, pass };
      const review: string = `${canonical(path.resolve(root, "docs", "review", edition, layer))}/`;
      if (normalized === review.slice(0, -1) || normalized.startsWith(review))
        return { layer, pass };
      if (pass === "naturalness") {
        const working: string = `${canonical(path.resolve(root, "docs/naturalness", layer))}/`;
        if (
          normalized === working.slice(0, -1) ||
          normalized.startsWith(working)
        )
          return { layer, pass };
      }
    }
  for (const layer of AUTHORED_LAYERS) {
    const revision: string = `${canonical(path.resolve(root, "docs", "revision", layer))}/`;
    if (normalized === revision.slice(0, -1) || normalized.startsWith(revision))
      return { layer, pass: "construction" };
  }
  // Body's pass identity follows its construction claim or upstream selection.
  return undefined;
}

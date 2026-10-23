import type { IProductionGateKey } from "../../IProductionGateKey";
import { passId } from "../../passId";
import { AUTHORED_LAYERS } from "../AUTHORED_LAYERS";
import { hasNaturalness } from "../hasNaturalness";

/**
 * Enumerates supported authoring passes before dependency closure is resolved.
 *
 * @evidence contracts/common.md#principled-implementation The fixed layer order is crossed with construction and supported naturalness passes, using passId as the same key representation consumed by dependency resolution.
 * @evidence contracts/common.md#clear-and-simple-design A Map contains precisely the supported pass vocabulary before dependency edges are added; no separate registry or configurable pass hierarchy is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only scripts and screenplay receive naturalness entries because those layers own the expression pass; no consumer-specific key is inserted.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies enumeration before dependency closure, and the returned keys retain both layer and pass.
 * @evidence contracts/performance.md#efficient-algorithms Four layers and two candidate passes yield six entries with constant time and space independent of production length.
 * @evidence contracts/performance.md#reuse-equivalent-work A fresh mutable Map is returned for each dependency-resolution owner; shared AUTHORED_LAYERS and hasNaturalness define equivalent pass vocabulary without sharing caller mutations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The six-entry Map belongs to the caller after return and no module-level collection or resource handle is retained.
 */
export function createProductionPassKeys(): Map<string, IProductionGateKey> {
  const keys: Map<string, IProductionGateKey> = new Map();
  for (const layer of AUTHORED_LAYERS)
    for (const pass of ["construction", "naturalness"] as const) {
      if (pass === "naturalness" && !hasNaturalness(layer)) continue;
      const entry: IProductionGateKey = { layer, pass };
      keys.set(passId(entry), entry);
    }
  return keys;
}

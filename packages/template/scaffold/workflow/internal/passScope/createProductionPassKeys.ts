import type { IProductionGateKey } from "../../IProductionGateKey";
import { passId } from "../../passId";
import { AUTHORED_LAYERS } from "../AUTHORED_LAYERS";
import { hasNaturalness } from "../hasNaturalness";

/** Enumerates supported authoring passes before dependency closure is resolved. */
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

// Derive the same shared prototype inventory consumed by the GPU page.
// The public browser-safe engine kernel owns placement summaries, 1,024-slot
// chunks, current LOD metadata and canonical runtime digests. No model groups
// are passed to the kernel for tier digests: it records their absent-group
// identity honestly while the actual prototypes remain in the supplied map.
import { productionRuntimeModelId } from "@automovie/engine";
import type { IAutoMovieCompiledInstanceSet, IAutoMovieInstanceSetDesign } from "@automovie/interface";
import type { IMedievalManorScene } from "../models/IMedievalManorScene";
import { manorInstanceDefinitions } from "./manor";
import { prototypeProjectionRadius } from "./prototypeProjectionRadius";
import { compileManorInstanceSet } from "./compileManorInstanceSet";

/** Bind the current local geometry definitions to their existing runtime model identities. */
export function deriveManorInstanceInventory(entries: IMedievalManorScene["entries"]) : { sets: { compiled: IAutoMovieCompiledInstanceSet; entry: string; definition: IAutoMovieInstanceSetDesign; }[]; prototypes: { id: string; model: import("@automovie/interface").IAutoMovieModel; bounds: { min: { x: number; y: number; z: number; }; max: { x: number; y: number; z: number; }; }; }[]; singletons: { entry: string; part: string; partIndex: number; }[]; partBindings: ReturnType<typeof manorInstanceDefinitions>["partBindings"]; } {
  const inventory: ReturnType<typeof manorInstanceDefinitions> = manorInstanceDefinitions(entries), radii: Map<string, number> = new Map<string, number>();
  for (const p of inventory.prototypes) { radii.set(p.id, prototypeProjectionRadius(p.bounds)); p.model.id = productionRuntimeModelId(p.id); }
  return { ...inventory, sets: inventory.sets.map((s: { entry: string; definition: IAutoMovieInstanceSetDesign; }) : { compiled: IAutoMovieCompiledInstanceSet; entry: string; definition: IAutoMovieInstanceSetDesign; } => {
    const radius: number | undefined = radii.get(s.definition.modelRecipe);
    if (radius === undefined) throw new Error("Missing authored manor prototype: " + s.definition.modelRecipe);
    return { ...s, compiled: compileManorInstanceSet(s.definition, radius) };
  }) };
}

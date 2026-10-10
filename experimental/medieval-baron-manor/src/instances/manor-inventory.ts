// Derive the same shared prototype inventory consumed by the GPU page.
// The public browser-safe engine kernel owns placement summaries, 1,024-slot
// chunks, current LOD metadata and canonical runtime digests. No model recipes
// are declared by this mesh inventory: the kernel records their absent-recipe
// identity honestly while the actual prototypes remain in the supplied map.
import { materializeCompiledInstanceSet, productionRuntimeModelId } from "@automovie/engine";
import type { IAutoMovieCompiledInstanceSet, IAutoMovieInstanceSetDesign } from "@automovie/interface";
import type { IMedievalManorScene } from "../models/IMedievalManorScene";
import { manorInstanceDefinitions } from "./manor";

const AXES = ["x", "y", "z"] as const;
/** Same box-v1 conservative prototype radius as the original native adapter. */
export const prototypeProjectionRadius = (bounds: IAutoMovieCompiledInstanceSet["bounds"]) =>
  Math.max(.01, Math.hypot(...AXES.map(k => Math.max(Math.abs(bounds.min[k]), Math.abs(bounds.max[k])))));
/** Materialize the actual explicit-layout population through its normal engine owner. */
export function compileManorInstanceSet(definition: IAutoMovieInstanceSetDesign, projectionRadius: number): IAutoMovieCompiledInstanceSet {
  if (definition.layout.kind !== "explicit") throw new Error("Manor instances require their authored explicit placements.");
  return materializeCompiledInstanceSet({ instanceSet: definition, world: { routes: [] },
    projectionRadii: new Map([[definition.modelRecipe, projectionRadius]]) });
}
/** Bind the current local geometry definitions to their existing runtime model identities. */
export function deriveManorInstanceInventory(entries: IMedievalManorScene["entries"]) {
  const inventory = manorInstanceDefinitions(entries), radii = new Map<string, number>();
  for (const p of inventory.prototypes) { radii.set(p.id, prototypeProjectionRadius(p.bounds)); p.model.id = productionRuntimeModelId(p.id); }
  return { ...inventory, sets: inventory.sets.map(s => {
    const radius = radii.get(s.definition.modelRecipe);
    if (radius === undefined) throw new Error("Missing authored manor prototype: " + s.definition.modelRecipe);
    return { ...s, compiled: compileManorInstanceSet(s.definition, radius) };
  }) };
}

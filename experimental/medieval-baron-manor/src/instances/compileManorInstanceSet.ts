// Derive the same shared prototype inventory consumed by the GPU page.
// The public browser-safe engine kernel owns placement summaries, 1,024-slot
// chunks, current LOD metadata and canonical runtime digests. No model groups
// are passed to the kernel for tier digests: it records their absent-group
// identity honestly while the actual prototypes remain in the supplied map.
import { materializeCompiledInstanceSet } from "@automovie/engine";
import type { IAutoMovieCompiledInstanceSet, IAutoMovieInstanceSetDesign } from "@automovie/interface";

/** Materialize the actual explicit-layout population through its normal engine owner. */
export function compileManorInstanceSet(definition: IAutoMovieInstanceSetDesign, projectionRadius: number): IAutoMovieCompiledInstanceSet {
  if (definition.layout.kind !== "explicit") throw new Error("Manor instances require their authored explicit placements.");
  return materializeCompiledInstanceSet({ instanceSet: definition, world: { routes: [] },
    projectionRadii: new Map([[definition.model, projectionRadius]]) });
}

import { compiledFormationSlot } from "@automovie/engine";
import type { IAutoMovieCompiledFormation, IAutoMovieFormationSlot } from "@automovie/interface";

/**
 * Regenerate one exact slot from compact runtime parameters.
 *
 * The placement itself is the engine's. A viewer that re-derived the layout
 * arithmetic would be a second answer to the question the builder already
 * answered, and the pixels would be the second one: that is how a dressed unit
 * came to be drawn on the exact lattice its builder had deliberately broken,
 * and it is how a crowd on a rise would come to be drawn flat. What stays here
 * is only what a compiled record spells differently from a design: heroes are
 * promoted slots rather than overrides.
 *
 * @evidence requirements/formations/layouts-and-slots.md#formation-layout-selection-parameters Regenerates the compiled layout's exact slot placement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Implements deterministic slot generation and assignment for that layout.
 */
export const regenerateFormationSlot = (
  formation: IAutoMovieCompiledFormation,
  slot: number,
): IAutoMovieFormationSlot => compiledFormationSlot(formation, slot);

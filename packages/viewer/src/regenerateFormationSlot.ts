import { compiledFormationSlot } from "@automovie/engine";
import type { IAutoMovieCompiledFormation, IAutoMovieFormationSlot } from "@automovie/interface";

/**
 * Regenerate one exact slot from compact runtime parameters.
 *
 * The placement itself is the engine's. A viewer that re-derived the layout arithmetic would be a second answer to the question the builder already answered, and the pixels would be the second one: that is how a dressed unit came to be drawn on the exact lattice its builder had deliberately broken, and it is how a crowd on a rise would come to be drawn flat. What stays here is only what a compiled record spells differently from a design: heroes are promoted slots rather than overrides.
 *
 * @evidence contracts/common.md#principled-implementation Delegates one compiled formation slot to the Engine compiledFormationSlot law, including promoted-hero semantics rather than rederiving viewer layout arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design A thin representation boundary leaves placement/admission in the Engine and consumes the compiled record directly in formation batch construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No viewer-specific lattice, height or permissive fallback substitutes a refused Engine member; exact rendered appearance remains unobserved here.
 * @evidence contracts/common.md#meaningful-documentation Documents why compiled hero representation differs from design overrides and why one canonical placement law prevents divergent displayed members.
 * @evidence contracts/performance.md#efficient-algorithms Adapter work is fixed beyond the Engine slot law and returned member construction; it does not enumerate the whole formation to produce one slot.
 * @evidence contracts/performance.md#reuse-equivalent-work Each requested slot follows current compiled inputs; no viewer placement memo can disagree with changed Engine parameters.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The compiled input is borrowed and the returned value has no geometry/texture handle; batch owner later acquires and retires its native projection.
 */
export const regenerateFormationSlot: (formation: IAutoMovieCompiledFormation, slot: number) => IAutoMovieFormationSlot = (
  formation: IAutoMovieCompiledFormation,
  slot: number,
): IAutoMovieFormationSlot => compiledFormationSlot(formation, slot);

import { instanceSlot } from "@automovie/engine";
import type {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieInstanceSlot,
} from "@automovie/interface";

/**
 * Regenerate one exact instance from compact compiled parameters.
 *
 * The member law is the engine's {@link instanceSlot}, the one a compiled set's
 * bounds are measured with and a shot source's oracle answers through, so the
 * member drawn here is the member the compiled record holds. A viewer copy of
 * that law agreed on every valid record but refused less, and drew a
 * hand-edited record the engine refuses as members standing on non-finite
 * coordinates or painted with no swatch.
 *
 * Engine refusal propagates for an invalid slot, missing/inconsistent route
 * snapshot, invalid explicit prototype, nonfinite derivation or empty palette.
 * buildInstancedInstanceSet regenerates each chunk before that chunk's batch
 * construction; earlier representations or chunks may already exist and its
 * acquisition owner rolls them back. No partial handle is returned as a
 * completed set.
 */
export const regenerateInstanceSlot: (
  instanceSet: IAutoMovieCompiledInstanceSet,
  slot: number,
) => IAutoMovieInstanceSlot = (
  instanceSet: IAutoMovieCompiledInstanceSet,
  slot: number,
): IAutoMovieInstanceSlot => instanceSlot(instanceSet, slot);

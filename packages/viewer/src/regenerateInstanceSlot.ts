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
 * It therefore throws what the engine throws: a slot outside the set, a route
 * snapshot that is missing, names another route, or has no finite positive
 * length, an explicit block missing the slot or naming a prototype no choice
 * declares, and a derived non-finite value or an empty palette.
 * {@link buildInstancedInstanceSet} regenerates every chunk slot through here
 * while it builds, so such a refusal leaves that call before any batch of the
 * set exists, and a host building a shot, such as a generated project's viewer
 * runtime, fails its build with the engine's message instead of drawing the
 * set.
 */
export const regenerateInstanceSlot = (
  instanceSet: IAutoMovieCompiledInstanceSet,
  slot: number,
): IAutoMovieInstanceSlot => instanceSlot(instanceSet, slot);

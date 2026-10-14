import { instanceSlot } from "@automovie/engine";
import type {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieInstanceSlot,
} from "@automovie/interface";

/**
 * Regenerate one exact instance from compact compiled parameters.
 *
 * The member law is the engine's {@link instanceSlot}, the one a compiled set's bounds are measured with and a shot source's oracle answers through, so the member drawn here is the member the compiled record holds. A viewer copy of that law agreed on every valid record but refused less, and drew a hand-edited record the engine refuses as members standing on non-finite coordinates or painted with no swatch.
 *
 * Engine refusal propagates for an invalid slot, missing/inconsistent route snapshot, invalid explicit prototype, nonfinite derivation or empty palette. buildInstancedInstanceSet regenerates each chunk before that chunk's batch construction; earlier representations or chunks may already exist and its acquisition owner rolls them back. No partial handle is returned as a completed set.
 *
 * @evidence contracts/common.md#principled-implementation Calls the Engine instanceSlot law for one compiled member so layout, route, explicit choice, finite coordinates and palette refusal stay identical to builder/oracle behavior.
 * @evidence contracts/common.md#clear-and-simple-design This adapter keeps validation/placement in Engine; the builder regenerates each chunk before constructing that chunk's instance batches and owns rollback for earlier acquisitions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No permissive viewer copy, nonfinite coordinate or undeclared prototype is admitted to draw; the unchanged member law is not independent visual proof.
 * @evidence contracts/common.md#meaningful-documentation Documents invalid slot/route/prototype/palette cases and propagation without returning a partial set; earlier representations/chunks can already exist and their builder owns rollback.
 * @evidence contracts/performance.md#efficient-algorithms Adapter coordination is fixed and delegates actual placement/admission cost to Engine; it adds no full-set traversal for a single requested slot.
 * @evidence contracts/performance.md#reuse-equivalent-work Each slot reads current compiled parameters through the canonical law rather than reusing a separately derived viewer answer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned member records acquire no native resource and input remains borrowed; instance batch construction owns subsequent acquisition/rollback/release.
 */
export const regenerateInstanceSlot: (
  instanceSet: IAutoMovieCompiledInstanceSet,
  slot: number,
) => IAutoMovieInstanceSlot = (
  instanceSet: IAutoMovieCompiledInstanceSet,
  slot: number,
): IAutoMovieInstanceSlot => instanceSlot(instanceSet, slot);

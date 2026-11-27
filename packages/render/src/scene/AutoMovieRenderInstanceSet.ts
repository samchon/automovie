import { type IAutoMovieInstanceSetViewerObject } from "./IAutoMovieInstanceSetViewerObject.js";
import { type IBuildInstancedInstanceSetProps } from "./IBuildInstancedInstanceSetProps.js";
import { buildInstancedInstanceSet as buildInstancedInstanceSetImplementation } from "./internal/buildInstancedInstanceSet.js";
import { type IAutoMovieInstanceSlot, type IAutoMovieCompiledInstanceSet } from "@automovie/interface";
import { regenerateInstanceSlot as regenerateInstanceSlotImplementation } from "./internal/regenerateInstanceSlot.js";

/** Public operations for Auto Movie Render Instance Set. */
export namespace AutoMovieRenderInstanceSet {
  /**
   * Build one non-formation crowd, vegetation, prop, facade, or ornament set.
   *
   * Matrices, colors, scales, and numeric trait attributes are regenerated from
   * compact runtime data. No slot is promoted into a scene node: a set of a
   * hundred thousand members holds one batch per chunk, prototype and LOD tier,
   * and each member costs one instance matrix rather than one object.
   *
   * A prototype is either a portable model the builder flattens or a host-loaded
   * object; passing `prototypeObjects` is what lets a registered static glTF be
   * the prototype, and it is flattened by the same rigid path a portable model
   * takes. Rigid is the whole condition: a skinned, morphed, or multi-material
   * source mesh is refused by name rather than instanced as something else.
   * Generated prototype materials are owned and reused as white instance-only
   * variants; loaded prototype materials are borrowed and cloned before
   * whitening.
   *
   * The Medieval Manor's createManorInstanceConsumer calls this builder during
   * scene assembly and supplies a camera-update route. Its website also bakes
   * supported meshes before mounting; this source connection establishes neither
   * an observed instanced frame nor compiled-shot capture integration.
   */
  export function buildInstancedInstanceSet(input: IBuildInstancedInstanceSetProps): IAutoMovieInstanceSetViewerObject {
    return buildInstancedInstanceSetImplementation(input);
  }

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
  export function regenerateInstanceSlot(instanceSet: IAutoMovieCompiledInstanceSet, slot: number): IAutoMovieInstanceSlot {
    return regenerateInstanceSlotImplementation(instanceSet, slot);
  }
}

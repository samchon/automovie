import type { AutoMovieImportedModelProfile } from "./AutoMovieImportedModelProfile";
import type { IAutoMovieImportedHumanoidBone } from "./IAutoMovieImportedHumanoidBone";
import type { IAutoMovieImportedModelAsset } from "./IAutoMovieImportedModelAsset";
import type { IAutoMovieImportedModelLod } from "./IAutoMovieImportedModelLod";

/**
 * Compiler-sealed imported appearance facts consumed by the viewer.
 *
 * @evidence contracts/common.md#principled-implementation The viewer consumes the compiler-sealed digest closure and authoritative indices rather than inferred names.
 * @evidence contracts/common.md#clear-and-simple-design One named contract is shared by the authoring model and its existing consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration supplies no geometry, inference, fallback or runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation States profile qualification, permitted byte closure, detail ordering and authoritative mappings.
 */
export interface IAutoMovieImportedModel {
  /** Normalization profile proved from resident model bytes. */
  profile: AutoMovieImportedModelProfile;

  /** Exact manifest-owned detail members in near-to-far order. */
  lod: IAutoMovieImportedModelLod[];

  /** Every model, sidecar and proxy byte identity this binding may request. */
  assets: IAutoMovieImportedModelAsset[];

  /** Authoritative normalized humanoid slot to glTF node mapping. */
  humanoidBones: IAutoMovieImportedHumanoidBone[];
}

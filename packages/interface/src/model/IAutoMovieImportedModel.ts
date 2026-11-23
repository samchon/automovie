import type { AutoMovieImportedModelProfile } from "./AutoMovieImportedModelProfile";
import type { IAutoMovieImportedHumanoidBone } from "./IAutoMovieImportedHumanoidBone";
import type { IAutoMovieImportedModelAsset } from "./IAutoMovieImportedModelAsset";
import type { IAutoMovieImportedModelLod } from "./IAutoMovieImportedModelLod";

/** Compiler-sealed imported appearance facts consumed by the viewer. */
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

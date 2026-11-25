import type { AutoMovieImportedModelLodLevel } from "./AutoMovieImportedModelLodLevel";
import type { AutoMovieImportedModelProfile } from "./AutoMovieImportedModelProfile";
import type { IAutoMovieImportedHumanoidBone } from "./IAutoMovieImportedHumanoidBone";

/** One manifest-owned imported detail level and its sealed execution facts. */
export interface IAutoMovieImportedModelLod {
  /** Closed detail identity. */
  level: AutoMovieImportedModelLodLevel;

  /** Manifest-owned model path. */
  asset: string;

  /** SHA-256 of this level's model bytes. */
  digest: string;

  /** Normalization profile proved for this level. */
  profile: AutoMovieImportedModelProfile;

  /** Level-local authoritative humanoid mapping. */
  humanoidBones: IAutoMovieImportedHumanoidBone[];
}

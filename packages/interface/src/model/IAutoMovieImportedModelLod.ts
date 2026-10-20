import type { AutoMovieImportedModelLodLevel } from "./AutoMovieImportedModelLodLevel";
import type { AutoMovieImportedModelProfile } from "./AutoMovieImportedModelProfile";
import type { IAutoMovieImportedHumanoidBone } from "./IAutoMovieImportedHumanoidBone";

/**
 * One manifest-owned imported detail level and its sealed execution facts.
 *
 * @evidence contracts/common.md#principled-implementation The compiled byte digest and level-local mapping qualify one manifest member.
 * @evidence contracts/common.md#clear-and-simple-design One named contract is shared by the authoring model and its existing consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration supplies no geometry, inference, fallback or runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation Documents path ownership, SHA-256 identity, profile and per-level bone mapping.
 */
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

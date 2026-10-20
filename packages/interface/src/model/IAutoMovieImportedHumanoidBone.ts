import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Authoritative normalized humanoid slot and inspected skin influence.
 *
 * @evidence contracts/common.md#principled-implementation An inspected node index binds a closed humanoid slot without runtime name guessing.
 * @evidence contracts/common.md#clear-and-simple-design One named contract is shared by the authoring model and its existing consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration supplies no geometry, inference, fallback or runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation States node indexing and the limited meaning of a positive skin influence.
 */
export interface IAutoMovieImportedHumanoidBone {
  /** Normalized automovie/VRM humanoid slot. */
  bone: AutoMovieHumanoidBone;

  /** Non-negative glTF node index. */
  node: number;

  /** Positive JOINTS_0/WEIGHTS_0 influence; this establishes no pixel visibility or anatomy. */
  weighted: boolean;
}

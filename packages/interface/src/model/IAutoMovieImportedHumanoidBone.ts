import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Authoritative normalized humanoid slot and inspected skin influence.
 *
 * @evidence contracts/development/design.md#principled-representation An inspected node index binds a closed humanoid slot without runtime name guessing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named contract is shared by the authoring model and its existing consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration supplies no geometry, inference, fallback or runtime behavior.
 * @evidence contracts/development/common.md#meaningful-documentation States node indexing and the limited meaning of a positive skin influence.
 */
export interface IAutoMovieImportedHumanoidBone {
  /** Normalized automovie/VRM humanoid slot. */
  bone: AutoMovieHumanoidBone;

  /** Non-negative glTF node index. */
  node: number;

  /** Positive JOINTS_0/WEIGHTS_0 influence; this establishes no pixel visibility or anatomy. */
  weighted: boolean;
}

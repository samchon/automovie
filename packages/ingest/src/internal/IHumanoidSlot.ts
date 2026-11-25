import type { AutoMovieHumanoidBone } from "@automovie/interface";

/** One normalized humanoid slot referencing an inspected glTF node index. */
export interface IHumanoidSlot {
  /**
   * Normalized humanoid semantic slot declared or resolved by the current
   * profile.
   */
  bone: AutoMovieHumanoidBone;

  /**
   * Zero-based node index admitted against the current source document
   * inventory.
   */
  node: number;
}

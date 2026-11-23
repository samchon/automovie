import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/** Authoritative normalized humanoid slot and inspected skin influence. */
export interface IAutoMovieImportedHumanoidBone {
  /** Normalized automovie/VRM humanoid slot. */
  bone: AutoMovieHumanoidBone;

  /** Non-negative glTF node index. */
  node: number;

  /**
   * Positive JOINTS_0/WEIGHTS_0 influence; this establishes no pixel visibility
   * or anatomy.
   */
  weighted: boolean;
}

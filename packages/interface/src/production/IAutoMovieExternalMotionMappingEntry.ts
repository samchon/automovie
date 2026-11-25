import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/** Explicit source-node to target-semantic-bone mapping entry. */
export interface IAutoMovieExternalMotionMappingEntry {
  /** Stable source node identity from the inspected byte basis. */
  source: string;

  /**
   * Semantic source-rig bone assigned to the inspected node, using the shared
   * humanoid vocabulary.
   */
  target: AutoMovieHumanoidBone;
}

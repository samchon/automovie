import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Explicit source-node to target-semantic-bone mapping entry.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionMappingEntry {
  /** Stable source node identity from the inspected byte basis. */
  source: string;

  /** Target normalized humanoid bone. */
  target: AutoMovieHumanoidBone;
}

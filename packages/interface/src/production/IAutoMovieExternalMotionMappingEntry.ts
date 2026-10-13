import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Explicit source-node to target-semantic-bone mapping entry.
 *
 * @evidence contracts/common.md#principled-implementation One inspector-issued source node identity maps to one closed target humanoid bone; adoption validates node presence, unique source and target choices and exact hierarchy/rest characterization before channels are converted.
 * @evidence contracts/common.md#clear-and-simple-design The row records only correspondence, leaving rig definitions, adoption mode and translation scaling on their owning records instead of duplicating them per bone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional source display names do not drive mapping, and fuzzy aliases or repeated target assignments cannot replace the author's explicit byte-grounded correspondence.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes stable inspected source-node addressing from normalized target-semantic bone identity.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionMappingEntry {
  /** Stable source node identity from the inspected byte basis. */
  source: string;

  /** Target normalized humanoid bone. */
  target: AutoMovieHumanoidBone;
}

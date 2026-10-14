import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Explicit source-node to target-semantic-bone mapping entry.
 *
 * @evidence contracts/common.md#principled-implementation One inspector-issued node maps to a semantic bone in the authored sourceRig; adoption checks node/bone presence, one-to-one mapping and mapped hierarchy/rest agreement with its helper-TRS representation. Receiving actor-rig compatibility or retargeting occurs afterward, so target is a semantic label rather than proof this node already matches the actor's rest basis.
 * @evidence contracts/common.md#clear-and-simple-design The row records only correspondence, leaving rig definitions, adoption mode and translation scaling on their owning records instead of duplicating them per bone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional source display names do not drive mapping, and fuzzy aliases or repeated target assignments cannot replace the author's explicit byte-grounded correspondence.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes stable inspected source-node addressing from normalized target-semantic bone identity.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionMappingEntry {
  /** Stable source node identity from the inspected byte basis. */
  source: string;

  /** Semantic source-rig bone assigned to the inspected node, using the shared humanoid vocabulary. */
  target: AutoMovieHumanoidBone;
}

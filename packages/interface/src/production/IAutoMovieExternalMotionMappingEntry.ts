import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Explicit source-node to target-semantic-bone mapping entry.
 *
 * @evidence contracts/development/design.md#principled-representation One declared source-node identity maps to a semantic bone in the authored sourceRig. Node/bone presence, one-to-one mapping and rest/hierarchy agreement remain host premises after production adoption retirement; the target label does not prove compatibility with a receiving actor rig.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The row records only correspondence, leaving rig definitions, adoption mode and translation scaling on their owning records instead of duplicating them per bone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional source display names do not drive mapping, and fuzzy aliases or repeated target assignments cannot replace the author's explicit byte-grounded correspondence.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes stable inspected source-node addressing from normalized target-semantic bone identity.
 */
export interface IAutoMovieExternalMotionMappingEntry {
  /** Stable source node identity from the inspected byte basis. */
  source: string;

  /** Semantic source-rig bone assigned to the inspected node, using the shared humanoid vocabulary. */
  target: AutoMovieHumanoidBone;
}

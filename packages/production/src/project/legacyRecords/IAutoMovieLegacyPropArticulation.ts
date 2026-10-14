/**
 * Legacy project record boundary preserving historical identities and units.
 */
import type { IAutoMovieNode } from "@automovie/interface";
import type { IAutoMovieLegacyPropBinding } from "./IAutoMovieLegacyPropBinding";
import type { IAutoMovieLegacyPropProfile } from "./IAutoMovieLegacyPropProfile";

/**
 * A prop's self-declared moving parts as the v1 record wrote them.
 *
 * @evidence contracts/common.md#principled-implementation One stored articulation groups its joint nodes, tuple-free profile and historical binding; conversion lowers active driver and mapping semantics.
 * @evidence contracts/common.md#clear-and-simple-design The legacy carrier owns persistence compatibility while engine articulation remains the runtime shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Historical labels and control defaults gain no new runtime effect during conversion.
 * @evidence contracts/common.md#meaningful-documentation Members identify joint ownership, profile data and the binding's semantic-key map.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This carrier executes no algorithm; toEnginePropSpec owns conversion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates no repeated work or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The enclosing stored prop owns node, profile and binding data, with no resource acquired by this type.
 * @author Samchon
 */
export interface IAutoMovieLegacyPropArticulation {
  /**
   * The prop's internal joint nodes.
   */
  nodes: IAutoMovieNode[];

  /**
   * The declared capability over those nodes.
   */
  profile: IAutoMovieLegacyPropProfile;

  /**
   * The application of the profile onto the nodes (`boneMap`).
   */
  binding: IAutoMovieLegacyPropBinding;
}

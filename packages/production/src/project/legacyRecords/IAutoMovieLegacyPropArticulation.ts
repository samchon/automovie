/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */
import type { IAutoMovieNode, IAutoMovieProfileBinding } from "@automovie/interface";
import type { IAutoMovieLegacyPropProfile } from "./IAutoMovieLegacyPropProfile";

/**
 * A prop's self-declared moving parts as the v1 record wrote them.
 *
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
  binding: IAutoMovieProfileBinding;
}

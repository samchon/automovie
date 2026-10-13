/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */
import type { IAutoMovieModel } from "@automovie/interface";
import type { IAutoMovieLegacyPropArticulation } from "./IAutoMovieLegacyPropArticulation";

/**
 * A prop spec as the `forgeProp` tool accepts it, a crude primitive proxy with
 * rich meaning: body, affordances, self-declared articulation.
 *
 * @author Samchon
 */
export interface IAutoMovieLegacyPropSpec {
  /**
   * The scene node this prop will occupy (the staging join key).
   */
  node: string;

  /**
   * The prop model: generated, skeleton-less, primitive parts.
   */
  model: IAutoMovieModel;

  /**
   * Self-declared moving parts, or `null` for a rigid prop.
   */
  articulation: IAutoMovieLegacyPropArticulation | null;
}

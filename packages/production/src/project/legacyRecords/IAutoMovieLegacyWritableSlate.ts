/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */
import type { IAutoMovieSequence } from "@automovie/interface";
import type { IAutoMovieLegacyStoredSlate } from "./IAutoMovieLegacyStoredSlate";

/**
 * Writable slate the v1 store committed.
 *
 * @author Samchon
 */
export interface IAutoMovieLegacyWritableSlate extends IAutoMovieLegacyStoredSlate {
  /**
   * Assembled film, or null before CUT has committed.
   */
  film: IAutoMovieSequence | null;
}

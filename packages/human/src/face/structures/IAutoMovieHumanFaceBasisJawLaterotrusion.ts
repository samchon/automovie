import type { IAutoMovieHumanFaceBasisJawTranslation } from "./IAutoMovieHumanFaceBasisJawTranslation";

/**
 * The two sideways mandibular translations, one channel per side.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisJawLaterotrusion {
  /** Translation toward the subject's left. */
  left: IAutoMovieHumanFaceBasisJawTranslation;
  /** Translation toward the subject's right. */
  right: IAutoMovieHumanFaceBasisJawTranslation;
}

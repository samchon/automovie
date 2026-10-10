import type { IAutoMovieHumanBodyBasisDocument } from "./IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "./IAutoMovieHumanBodyBuild";
import type { IHumanBodyPreparedBuild } from "./IHumanBodyPreparedBuild";

/**
 * Evaluate a complete body, or prepare its exterior for person composition.
 *
 * The callable remains the normal complete body consumer. Person composition
 * prepares the same admitted skin and pose first, forms the joined exterior,
 * then completes the anatomical assembly against that one authority.
 *
 * @author Samchon
 */
export interface IHumanBodyBasisBuilder {
  /** Build the complete body with its own rest exterior authority. */
  (document: IAutoMovieHumanBodyBasisDocument): IAutoMovieHumanBodyBuild;

  /**
   * Complete the same construction with original layer refusal observations.
   * This explicitly inspectable result is not an accepted editor state.
   */
  construct(document: IAutoMovieHumanBodyBasisDocument): IAutoMovieHumanBodyBuild;

  /** Prepare exterior and pose so a person can determine its complete exterior first. */
  prepare(document: IAutoMovieHumanBodyBasisDocument): IHumanBodyPreparedBuild;
}

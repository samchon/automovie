import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A bilateral pair of head points a rule found on one skin, right (-X) and
 * left (+X).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadPair {
  /** The right-side point (-X), metres. */
  right: IAutoMovieVector3;

  /** The left-side point (+X), metres. */
  left: IAutoMovieVector3;
}

import type { IAutoMovieHumanFaceLowerLashPopulation } from "../anatomy/lash/IAutoMovieHumanFaceLowerLashPopulation";

/**
 * The lower lash row's profile for each eye.
 *
 * Each side takes an explicit shaft count and the lower profile, whose angles
 * use the lower row's mirrored live globe-to-root frame and whose bounds are a stated convention.
 * Count is independent of the upper row and zero emits no shafts on that side.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLowerLashPair {
  /** Lower lash profile of the anatomical left eye. */
  left: IAutoMovieHumanFaceLowerLashPopulation;

  /** Lower lash profile of the anatomical right eye. */
  right: IAutoMovieHumanFaceLowerLashPopulation;
}

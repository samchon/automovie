import type { IAutoMovieHumanFaceLidSections } from "./IAutoMovieHumanFaceLidSections";

/** Bilateral coarse lid-section identity; source blink, squint and gaze keep their existing motion owners.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEyelids {
  /** Anatomical left section identity on its publisher-qualified shared skin cage. */
  left?: IAutoMovieHumanFaceLidSections;
  /** Anatomical right section identity, independent of the left controls. */
  right?: IAutoMovieHumanFaceLidSections;
}

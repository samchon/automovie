import type { IAutoMovieHumanFaceUpperLashPopulation } from "../anatomy/lash/IAutoMovieHumanFaceUpperLashPopulation";

/**
 * The upper lash row's profile for each eye.
 *
 * Each side takes one explicit population: strand count and maximum centreline length,
 * launch elevation, curl, fan, root radius, taper and per-strand variation,
 * within that profile's authoring envelopes. Count is not card density or a
 * measured follicle count; zero emits no shafts on that side.
 * Angles use the attached population's live globe-to-root frame, whose axes
 * follow the registered skin row and current ocular owner. Length and radius
 * retain millimetres.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceUpperLashPair {
  /** Lash profile of the anatomical left eye. */
  left: IAutoMovieHumanFaceUpperLashPopulation;

  /** Lash profile of the anatomical right eye. */
  right: IAutoMovieHumanFaceUpperLashPopulation;
}

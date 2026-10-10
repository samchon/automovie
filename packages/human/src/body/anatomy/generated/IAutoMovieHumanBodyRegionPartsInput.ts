import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyAnatomicalMeasurements";

/**
 * What a region's part resolver reads: the document's anatomy, if
 * any, and the compiled source basis.
 *
 * Document admission preserves anatomical measurements and registered raw
 * observations before this carrier reaches a region resolver. A consumer
 * without anatomical input
 * (the shape-weight body editor) omits `targets` and receives each part's
 * source reason without inventing an age, stature or mass; completeness of a
 * document stays with document admission. The basis lets a resolver state that a
 * defining landmark or tissue boundary is absent from the source.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyRegionPartsInput {
  /** Admitted document anatomy, including registered observations; omitted without anatomy. */
  readonly targets?: IAutoMovieHumanBodyAnatomicalMeasurements;

  /** The compiled source basis the exterior was built from. */
  readonly basis: IAutoMovieHumanBodyBasis;
}

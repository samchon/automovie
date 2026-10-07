import type { IAutoMovieModel } from "@automovie/interface";
import type { IAutoMovieHumanFaceBasisDocument } from "./IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceConstruction } from "./IAutoMovieHumanFaceConstruction";

/** One face geometry owner with ordinary admission and explicit construction inspection.
 *
 * @evidence contracts/common.md#principled-implementation Both entries use one construction stage and its original admission conditions.
 * @evidence contracts/common.md#clear-and-simple-design One callable retains normal admission and exposes explicit construction inspection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Construction reports refusals while the ordinary callable still throws before publication.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes ordinary admission from inspectable construction.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisBuilder {
  /** Build and publish only a model that satisfies every existing admission condition. */
  (document: IAutoMovieHumanFaceBasisDocument): IAutoMovieModel;

  /** Construct every requested part and report admission without pretending a refusal is success. */
  construct(document: IAutoMovieHumanFaceBasisDocument): IAutoMovieHumanFaceConstruction;
}

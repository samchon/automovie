import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasisDocument } from "./IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceConstruction } from "./IAutoMovieHumanFaceConstruction";

/** One face geometry owner with ordinary admission and explicit construction inspection.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisBuilder {
  /** Build and publish only a model that satisfies every existing admission condition. */
  (document: IAutoMovieHumanFaceBasisDocument): IAutoMovieModel;

  /** Construct every requested part and report admission without pretending a refusal is success. */
  construct(
    document: IAutoMovieHumanFaceBasisDocument,
  ): IAutoMovieHumanFaceConstruction;
}

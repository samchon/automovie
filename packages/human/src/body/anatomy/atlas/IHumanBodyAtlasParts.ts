import type { IAutoMovieModel } from "@automovie/interface";

/**
 * Separate static atlas parts and diagnostic materials appended by the body
 * builder before resident-model admission.
 *
 * @author Samchon
 */
export interface IHumanBodyAtlasParts {
  /** Posed static parts with independent anatomical identities. */
  parts: IAutoMovieModel["parts"];

  /** A separate diagnostic finish per part preserves export correspondence. */
  materials: IAutoMovieModel["materials"];
}

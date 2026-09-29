import type { IAutoMovieHumanBodyAnatomicalResolution } from "./IAutoMovieHumanBodyAnatomicalResolution";
import type { IAutoMovieHumanBodyGeneratedPart } from "./IAutoMovieHumanBodyGeneratedPart";

/**
 * A named internal part resolved with validation or explicitly unavailable.
 *
 * Distributing over the generated-part union binds `id`, tissue material and
 * successful value together, so a right femur cannot answer as left deltoid.
 * Availability remains per part; absent imaging never silently creates bone.
 * @author Samchon
 */
export type IAutoMovieHumanBodyPartResolution<
  Part extends IAutoMovieHumanBodyGeneratedPart = IAutoMovieHumanBodyGeneratedPart,
> = Part extends IAutoMovieHumanBodyGeneratedPart
  ? IAutoMovieHumanBodyAnatomicalResolution<Part["id"], Part>
  : never;

import type { IAutoMovieHumanBodyAnatomicalResolution } from "./IAutoMovieHumanBodyAnatomicalResolution";
import type { IAutoMovieHumanBodyGeneratedPart } from "./IAutoMovieHumanBodyGeneratedPart";
import type { AutoMovieHumanBodyPartId } from "../identity/AutoMovieHumanBodyPartId";

/**
 * A named internal part resolved with validation or explicitly unavailable.
 *
 * Distributing over the generated-part union binds `id`, tissue material and
 * successful value together, so a right femur cannot answer as left deltoid.
 * Availability remains per part; absent imaging never silently creates bone.
 * @author Samchon
 */
export type IAutoMovieHumanBodyPartResolution<
  Id extends AutoMovieHumanBodyPartId = AutoMovieHumanBodyPartId,
> = Id extends AutoMovieHumanBodyPartId
  ? IAutoMovieHumanBodyAnatomicalResolution<
      Id,
      Extract<IAutoMovieHumanBodyGeneratedPart, { readonly id: Id }>
    >
  : never;

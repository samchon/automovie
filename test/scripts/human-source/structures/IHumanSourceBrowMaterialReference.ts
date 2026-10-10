import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasisDocument";

/** One actual normal-consumer input and its completed shape-only reference.
 * Both bootstrap omission and explicit populations retain the same public
 * resolver meanings. Reference geometry has already applied persistent relief
 * and source replay, in canonical head-frame metres.
 * @author Samchon
 */
export interface IHumanSourceBrowMaterialReference {
  /** Public numerical input; supplied profile values are never changed. */
  document: IAutoMovieHumanFaceBasisDocument;

  /** Completed reference arrays in the same native surface order as the basis. */
  positions: ReadonlyMap<string, readonly number[]>;
}

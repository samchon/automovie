import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasisDocument";

/**
 * A publisher-owned final face and its explicit numerical qualification context.
 * Registration mutates this parsed face's metadata, never its geometry or the
 * caller's numerical document. The face must already have its final optical
 * support, station correspondence and endpoint frame.
 *
 * @author Samchon
 */
export interface IHumanSourceAttachmentRegistrationInput {
  /** Final same-generation source face owned by the publisher. */
  basis: IAutoMovieHumanFaceBasis;

  /** Normal consumer input witnessing support; it supplies no clinical norm. */
  document: IAutoMovieHumanFaceBasisDocument;
}

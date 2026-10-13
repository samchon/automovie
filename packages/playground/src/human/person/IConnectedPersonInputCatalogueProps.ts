import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import type { IAutoMovieHumanPersonHeadShapeSource } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadShapeSource";

/**
 * Inputs of `createConnectedPersonInputCatalogue`: the owners' descriptors
 * the catalogue copies.
 *
 * @author Samchon
 */
export interface IConnectedPersonInputCatalogueProps {
  /** The head partition view; its shape channels carry their own envelopes. */
  face: IAutoMovieHumanFaceBasis;

  /** The body source, whose existing material finishes are listed without duplicating derived skin colour. */
  body?: IAutoMovieHumanBodyBasis;

  /** Current document supplying existing hair populations for sparse named styling. */
  person?: IAutoMovieHumanPersonDocument;

  /** Channels the face does not edit: body-driven and aliased ones. */
  excluded: ReadonlySet<string>;

  /** The registered head traits of the generation, when it has any. */
  headShape?: IAutoMovieHumanPersonHeadShapeSource;
}

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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Supplies the head view whose channels and registered traits the catalogue lists.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Names the channels the face does not edit so the catalogue omits them.
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

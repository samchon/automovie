import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import type { IAutoMovieHumanPersonHeadShapeSource } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadShapeSource";

/**
 * Inputs of `createConnectedPersonInputCatalogue`: the owners' descriptors the catalogue copies. Face shape channels retain source envelopes, excluded ids remove body-driven aliases, optional head registration contributes authored traits, and current person populations select sparse hair descriptors. These descriptors inform controls; admission remains with each numerical owner.
 *
 * @evidence contracts/common.md#principled-implementation The catalogue borrows the current generation's channel/trait authority and current document populations, preserving owner bounds, units, default provenance and exclusions.
 * @evidence contracts/common.md#clear-and-simple-design These inputs separate source metadata and document population selection from catalogue transport and complete-person admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing owner bounds remain absent and excluded body-driven channels are not independently offered as face shape controls.
 * @evidence contracts/common.md#meaningful-documentation The comment names channel exclusions, optional registration, sparse populations and the metadata-versus-admission boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface implements no metadata traversal or population enumeration algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source and person references declare no retained catalogue or geometry-cache equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed numerical bases, person data and excluded ids acquire no worker or rendering resources.
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

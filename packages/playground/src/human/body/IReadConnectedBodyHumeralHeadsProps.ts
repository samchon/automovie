import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanBodyBuild,
  IAutoMovieHumanBodySimpleWhole,
} from "@automovie/human";

/**
 * Inputs of `readConnectedBodyHumeralHeads`: the body basis, the whole-person
 * stature and volume readers, the body document, its build and the contact
 * reading of that build's skin.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries what the humeral-head reading needs from one evaluated body.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Names the build, contacts and population readers the reading consumes.
 * @author Samchon
 */
export interface IReadConnectedBodyHumeralHeadsProps {
  /** The body basis the build was evaluated against. */
  basis: IAutoMovieHumanBodyBasis;

  /** Whole-person stature and volume readers for the simple projection. */
  whole: IAutoMovieHumanBodySimpleWhole;

  /** The evaluated body document; its shape and humeral-head radii are read. */
  document: IAutoMovieHumanBodyBasisDocument;

  /** The body build of that document. */
  built: IAutoMovieHumanBodyBuild;

  /** The self-crossings of that build's skin; a crossed skin has no inside. */
  crossings: readonly IAutoMovieModelCrossing[];
}

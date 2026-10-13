import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanBodyBuild,
  IAutoMovieHumanBodySimpleWhole,
} from "../../index";

/**
 * Inputs of `readConnectedBodyHumeralHeads`: the body basis, the whole-person
 * stature and volume readers, the body document, its build and the contact
 * reading of that build's skin.
 *
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

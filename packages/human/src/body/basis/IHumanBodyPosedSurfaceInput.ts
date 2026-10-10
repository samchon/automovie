import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { skinHumanBodySurface } from "./skinHumanBodySurface";

/**
 * The actual shaped skin, bone transforms and matching rest/lean suppliers for one performed surface. No source or document is mutated.
 *
 * @author Samchon
 */
export interface IHumanBodyPosedSurfaceInput {
  /** Shaped source positions, metres. */
  shaped: number[];

  /** Existing rest-to-posed transform map. */
  transforms: Parameters<typeof skinHumanBodySurface>[3];

  /** Matching document-rest positions, or null when filtering/sag is inactive. */
  rest: number[] | null;

  /** Lazily evaluate the matching lean shape. */
  lean: () => number[];

  /** Existing admitted numerical document. */
  document: IAutoMovieHumanBodyBasisDocument;
}

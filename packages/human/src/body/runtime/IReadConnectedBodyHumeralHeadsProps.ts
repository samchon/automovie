import type { IAutoMovieModelCrossing } from "@automovie/engine";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodySimpleWhole } from "../structures/IAutoMovieHumanBodySimpleWhole";

/**
 * Inputs for humeral-head fits from one body's source generation and evaluation. Basis, whole-person readers, document, build and contacts must describe that same construction; the type does not validate their cross-object identity. Inputs are borrowed for the synchronous query and treated as read-only.
 *
 * @evidence contracts/common.md#principled-implementation Shared source, evaluated document and posed build supply radius inputs and skin, while contacts determine whether containment is attempted; matching generation is a caller premise.
 * @evidence contracts/common.md#clear-and-simple-design One props record makes the shared body/person query's source and observation dependencies explicit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contact absence is only the query's prerequisite, and these references do not establish anatomical registration or clinical validity.
 * @evidence contracts/common.md#meaningful-documentation The prose gives same-evaluation and borrowed-input requirements, with members distinguishing source, shape and posed contact authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input schema executes no projection or skin query.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Actual sharing of capped-skin work belongs to the numerical reader.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type does not retain borrowed source or construction inputs beyond the owning query.
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

  /** Contact instrument results for this same posed skin; any recorded crossing prevents this containment query. */
  crossings: readonly IAutoMovieModelCrossing[];
}

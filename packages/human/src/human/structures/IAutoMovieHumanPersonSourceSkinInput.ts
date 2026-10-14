import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";

/**
 * One evaluation of a final face skin: the face model after the face owner's final contact result, and the performed body build it rides.
 *
 * @evidence contracts/common.md#principled-implementation The evaluated face and performed body are paired after face contact, so the final skin evaluator reads the same body build used for placement.
 * @evidence contracts/common.md#clear-and-simple-design Only face model and body build cross this per-evaluation seam; invariant basis and neck metadata remain in the compiled evaluator inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The face model is the actual contact result, not a substitute neutral face introduced to hide an unresolved contact.
 * @evidence contracts/common.md#meaningful-documentation Members state that the face is evaluated after contact and that the body is already performed.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Model and build references specify operands without selecting the final skin algorithm or allocating new coordinates.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Per-call face and body inputs declare no equivalence cache; their source-skin closure owns repeated invariant work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowing evaluated model and build records acquires no handles; this interface itself keeps no running evaluation.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceSkinInput {
  /** The evaluated face model, after its final contact result. */
  face: IAutoMovieModel;

  /** The performed body build. */
  body: IAutoMovieHumanBodyBuild;
}

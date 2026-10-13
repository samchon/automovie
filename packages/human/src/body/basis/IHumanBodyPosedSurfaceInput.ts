import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { skinHumanBodySurface } from "./skinHumanBodySurface";

/**
 * The actual shaped skin, bone transforms and matching rest/lean suppliers for one performed surface. No source or document is mutated.
 *
 * @evidence contracts/common.md#principled-implementation Shaped positions, matching rest/lean suppliers and one rest-to-posed frame map carry the same document evaluation into performed surface processing.
 * @evidence contracts/common.md#clear-and-simple-design One internal carrier groups pose/filter dependencies while skinning and sag remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rest and lean arrays must share source order and document provenance; mixing another shape's supplier would violate the consumer's premise.
 * @evidence contracts/common.md#meaningful-documentation Members give meter positions, inactive rest-null meaning, lazy lean evaluation and admitted document ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Posed-surface input typing performs no skinning, filtering or sag computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Lazy suppliers expose possible reuse while their owning builder decides shape/document equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed arrays and callbacks acquire no performed-surface buffer or evaluation task in this schema.
 * @author Samchon
 */
export interface IHumanBodyPosedSurfaceInput {
  /** Shaped source positions, metres. */
  shaped: number[];

  /** Existing rest-to-posed transform map. */
  transforms: Parameters<typeof skinHumanBodySurface>[3];

  /** Matching document-rest positions, or null when filtering/sag is inactive. */
  rest: number[] | null;

  /**
   * Lazily evaluate the matching lean shape in the same source vertex order.
   *
   * @evidence contracts/common.md#principled-implementation The posed-surface owner requests this matching lean skin only for an active sag stage, alongside the same document's rest skin.
   * @evidence contracts/common.md#clear-and-simple-design A zero-argument supplier binds the already selected surface while the body builder owns shape evaluation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The lean response is an authored exterior proxy and cannot establish measured tissue softness or contact validity.
   * @evidence contracts/common.md#meaningful-documentation Returned coordinates are source-ordered metres for the same admitted document and selected sag surface.
   * @evidence contracts/performance.md#efficient-algorithms The supplying builder evaluates the lean shape on first use; subsequent requests for that surface return its stored positions.
   * @evidence contracts/performance.md#reuse-equivalent-work The callback binds the builder's surface-index cache rather than creating a second lean evaluation in the sag consumer.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback borrows its preparation's lean cache; returned arrays and captured preparation remain resident only while their consumers retain them.
   */
  lean: () => number[];

  /** Existing admitted numerical document. */
  document: IAutoMovieHumanBodyBasisDocument;
}

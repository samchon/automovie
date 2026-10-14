import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { createHumanBodyAppearance } from "./appearance/createHumanBodyAppearance";
import type { evaluateHumanBodyShape } from "./evaluateHumanBodyShape";
import type { skinHumanBodySurface } from "./skinHumanBodySurface";

/**
 * Evaluation state of one document consumed by the existing surface/material projector. Every callback belongs to that same document and source.
 *
 * @evidence contracts/common.md#principled-implementation One document's shaped skin, frame map, lazy rest/lean evaluations and site colors preserve common source order for material projection.
 * @evidence contracts/common.md#clear-and-simple-design The carrier groups existing geometry, motion and appearance outputs while their owning evaluators remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Callbacks and colors must belong to the same document/source; an unrelated rest or lean shape cannot satisfy performed filtering.
 * @evidence contracts/common.md#meaningful-documentation Members identify admitted document, posed-mode meaning, lazy evaluator scope and appearance-owned colors.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Surface-parts input typing performs no material splitting or performed filtering.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Lazy rest/lean suppliers declare reuse opportunities whose identity and invalidation remain builder-owned.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed projection inputs acquire no material cache, rest buffer or active skinning task.
 * @author Samchon
 */
export interface IHumanBodySurfacePartsInput {
  /** Admitted document whose appearance and motion are evaluated. */
  document: IAutoMovieHumanBodyBasisDocument;

  /** Shaped source skin and joint landmarks. */
  shaped: ReturnType<typeof evaluateHumanBodyShape>;

  /** Whether performed filtering, sag and relief are active. */
  posed: boolean;

  /** Existing world rest/posed frame map. */
  transforms: Parameters<typeof skinHumanBodySurface>[3];

  /**
   * Lazily evaluate the same document's rest geometry.
   *
   * @evidence contracts/common.md#principled-implementation Performed filtering and joint relief read the document's shaped neutral geometry supplied by the existing body builder.
   * @evidence contracts/common.md#clear-and-simple-design One zero-argument supplier returns complete surfaces and landmarks for consumers sharing that preparation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rest geometry must match the shaped source revision; its reuse does not prove filtering or relief is physiological.
   * @evidence contracts/common.md#meaningful-documentation The result has the shape evaluator's source order and metre frame and is borrowed rather than a fresh copy on every call.
   * @evidence contracts/performance.md#efficient-algorithms An unposed preparation returns its existing shaped result; a posed preparation performs one neutral shape evaluation on first demand.
   * @evidence contracts/performance.md#reuse-equivalent-work The builder's restOnce slot shares that result across filtering, relief and material consumers of the same preparation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The preparation retains at most one rest result until its captured consumers become unreachable, with no external task or handle.
   */
  restAll: () => ReturnType<typeof evaluateHumanBodyShape>;

  /**
   * Lazily evaluate a source surface's matching lean skin.
   *
   * @evidence contracts/common.md#principled-implementation The supplying builder applies the selected surface's declared lean channel overrides to the same document shape and returns its source-ordered positions.
   * @evidence contracts/common.md#clear-and-simple-design A surface index selects one lazy result while pose/sag consumers retain their existing geometry owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Consumers must request a declared sag surface; the lean override is an authored proxy rather than independently measured tissue geometry.
   * @evidence contracts/common.md#meaningful-documentation The index belongs to this basis's surface array and the borrowed result contains metre positions in that surface's original vertex order.
   * @evidence contracts/performance.md#efficient-algorithms First use evaluates the complete lean shape then retains the selected surface; later requests use the preparation's map lookup.
   * @evidence contracts/performance.md#reuse-equivalent-work The same indexed cache serves sag and overlay thickness instead of evaluating a lean shape separately for each consumer.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Requested surface arrays remain in the preparation-local map; discarded whole-shape temporaries and unrequested lean surfaces are not cached by this supplier.
   */
  leanOf: (index: number) => number[];

  /** Existing appearance owner's evaluated site colours. */
  coloured: ReturnType<
    ReturnType<typeof createHumanBodyAppearance>
  >["coloured"];
}

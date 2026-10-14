import type { IAutoMovieHumanFaceDocument } from "./IAutoMovieHumanFaceDocument";

/**
 * A validated initial document/model pair and its asynchronous rebuild owner.
 *
 * The editor copies documents and treats models as opaque immutable results.
 * The caller owns worker cancellation and renderer resources. An optional
 * synchronous, nonreentrant publisher runs inside the generation-checked
 * commit before its pair/history assignment, with no intervening await. It
 * must finish refusal checks before mutating the displayed result; the editor
 * cannot roll back arbitrary external effects. Omission leaves publication
 * with the caller after a successful request. An optional disposer releases a
 * successfully returned candidate that is superseded or refused by publication
 * before commit; it must preserve resources shared with the displayed or
 * newer model. Omission leaves that
 * release with the caller, as in existing editor integrations.
 *
 * @evidence contracts/common.md#principled-implementation A caller-validated initial pair and asynchronous admission builder support generation-checked document/model/history commits, with optional synchronous publication and stale/refused-candidate disposal at the same boundary.
 * @evidence contracts/common.md#clear-and-simple-design Generic document/model ownership keeps numerical admission, external publication and renderer lifetime as explicit injected callbacks rather than editor-internal scene work.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the latest request may commit; the editor cannot undo arbitrary external effects, so publication must refuse before mutation and preserve its nonreentrancy premise.
 * @evidence contracts/common.md#meaningful-documentation The comment states owned copies, caller cancellation/renderer ownership, synchronous publication order and optional disposal obligations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This props schema executes no asynchronous build, history traversal or retirement algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Callback injection defines no model cache or request equivalence; the editor owns generation authority separately.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The integration owns callback/renderer/worker lifetimes and optional candidate cleanup; the declaration creates no resources itself.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEditorProps<
  Model,
  Document = IAutoMovieHumanFaceDocument,
> {
  /** Initially validated settings; the editor keeps its own copy. */
  document: Document;

  /** Immutable renderer-owned result of the initial settings. */
  model: Model;

  /**
   * Admit and rebuild an owned document copy without publishing it.
   *
   * @evidence contracts/common.md#principled-implementation Receives the editor's owned candidate copy and returns the integration's admitted immutable model independently of scene publication.
   * @evidence contracts/common.md#clear-and-simple-design One asynchronous document-to-model boundary serves edits, reset, restoration and history without embedding a renderer in the editor.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Initial validation and numerical admission are caller premises; a callback must not publish a candidate before generation authority is checked.
   * @evidence contracts/common.md#meaningful-documentation The comment states admission, copied input and absent publication; the Promise carries the actual result/error.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The signature selects no numerical builder algorithm or scheduling strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It specifies a common operation boundary but no caching/effect equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The integration owns build work and cancellation; returned models transfer under the editor's publication/disposal contract.
   */
  build: (document: Document) => Promise<Model>;

  /**
   * Publish synchronously without reentering the editor; finish refusal checks before live mutation.
   *
   * @evidence contracts/common.md#principled-implementation Joins display publication to the latest generation's synchronous commit before document/model/history assignment.
   * @evidence contracts/common.md#clear-and-simple-design An optional model-only effect leaves document/history mutation with the editor and scene ownership with the integration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No intervening await or reentrant edit may invalidate commit authority, and external mutation cannot be rolled back after a publication exception.
   * @evidence contracts/common.md#meaningful-documentation The comment states synchronous/nonreentrant execution and refusal-before-mutation obligations.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback signature executes no scene commit algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Publication is an integration effect and is not declared equivalent across repeated models.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scene/model resources remain integration-owned; the signature starts no task or handle.
   */
  publish?: (model: Model) => void;

  /**
   * Release a superseded or publication-refused result while retaining shared live resources.
   *
   * @evidence contracts/common.md#principled-implementation Receives a successfully returned candidate that lost commit authority or whose publication refused, without retiring the still-committed model.
   * @evidence contracts/common.md#clear-and-simple-design Optional model-only cleanup is separate from worker cancellation and current-scene ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cleanup must preserve resources shared with displayed/newer models; omission leaves that responsibility with the integration rather than pretending release occurred.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies stale/refused candidates and retained shared-live resources.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback declaration chooses no GPU/resource retirement algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The contract defines candidate cleanup, not deduplicated disposal or shared-resource identity tracking.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Actual safe retirement belongs to the integration's disposer; the editor signature itself owns no renderer handles.
   */
  dispose?: (model: Model) => void;
}

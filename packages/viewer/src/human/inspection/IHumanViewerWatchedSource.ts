import type { IHumanViewerBasisFiles } from "./IHumanViewerBasisFiles.js";
import type { IHumanViewerGenerationFiles } from "./IHumanViewerGenerationFiles.js";
import type { IHumanViewerSourceRevisions } from "./IHumanViewerSourceRevisions.js";

/**
 * The source owner as watching uses it: what to watch and how an edit maps to a revision.
 *
 * @evidence contracts/common.md#principled-implementation Watched inputs, published basis views and import-graph revisions identify the source boundaries an edit can invalidate.
 * @evidence contracts/common.md#clear-and-simple-design The source owner supplies paths and revision operations while the subscription owns event batching.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source reachability and published-file identities decide affected revisions rather than document-specific exceptions.
 * @evidence contracts/common.md#meaningful-documentation Names input/example files, watched paths, normalization, basis refresh and the shared revision owner.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Watched inputs, published basis views and import-graph revisions identify the source boundaries an edit can invalidate.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The source owner supplies paths and revision operations while the subscription owns event batching.
 * @author Samchon
 */
export interface IHumanViewerWatchedSource {
  /**
   * Directory of hand-written inputs; an edit there rereads the catalogue.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Directory of hand-written inputs; an edit there rereads the catalogue. Watched inputs, published basis views and import-graph revisions identify the source boundaries an edit can invalidate.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Directory of hand-written inputs; an edit there rereads the catalogue. The source owner supplies paths and revision operations while the subscription owns event batching.
   */
  inputsDirectory: string;

  /**
   * Source directories whose reached files move revisions.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Source directories whose reached files move revisions. Watched inputs, published basis views and import-graph revisions identify the source boundaries an edit can invalidate.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Source directories whose reached files move revisions. The source owner supplies paths and revision operations while the subscription owns event batching.
   */
  watched: readonly string[];

  /**
   * Published bases; an edit refreshes their digests.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Published bases; an edit refreshes their digests. Watched inputs, published basis views and import-graph revisions identify the source boundaries an edit can invalidate.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Published bases; an edit refreshes their digests. The source owner supplies paths and revision operations while the subscription owns event batching.
   */
  basisFiles: IHumanViewerBasisFiles;

  /**
   * Published person generation views; an edit rereads the catalogue.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Published person generation views; an edit rereads the catalogue. Watched inputs, published basis views and import-graph revisions identify the source boundaries an edit can invalidate.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Published person generation views; an edit rereads the catalogue. The source owner supplies paths and revision operations while the subscription owns event batching.
   */
  generationFiles: IHumanViewerGenerationFiles;

  /**
   * Published face subjects.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Published face subjects. Watched inputs, published basis views and import-graph revisions identify the source boundaries an edit can invalidate.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Published face subjects. The source owner supplies paths and revision operations while the subscription owns event batching.
   */
  documentsFile: string;

  /**
   * The generation's subject people; an edit rereads the catalogue.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-document The generation's subject people; an edit rereads the catalogue. Watched inputs, published basis views and import-graph revisions identify the source boundaries an edit can invalidate.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document The generation's subject people; an edit rereads the catalogue. The source owner supplies paths and revision operations while the subscription owns event batching.
   */
  subjectPeopleFile: string;

  /**
   * Playground body examples; an edit rereads the catalogue.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Playground body examples; an edit rereads the catalogue. Watched inputs, published basis views and import-graph revisions identify the source boundaries an edit can invalidate.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Playground body examples; an edit rereads the catalogue. The source owner supplies paths and revision operations while the subscription owns event batching.
   */
  bodyExamplesFile: string;

  /**
   * Normalizes a path to forward slashes.
   *
   * @evidence contracts/common.md#principled-implementation Path normalization provides forward-slash spelling used by the source revision graph.
   * @evidence contracts/common.md#clear-and-simple-design The source owner supplies one normalization operation to watcher consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Normalization does not rewrite file bytes or infer source authority from a subject name.
   * @evidence contracts/common.md#meaningful-documentation Defines the normalized path spelling returned for an input file.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Path normalization provides forward-slash spelling used by the source revision graph.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The source owner supplies one normalization operation to watcher consumers.
   */
  slash: (file: string) => string;

  /**
   * Recomputes the published basis digests.
   *
   * @evidence contracts/common.md#principled-implementation Basis refresh recomputes the published digest authority before the edit batch is hashed.
   * @evidence contracts/common.md#clear-and-simple-design The published source owner retains basis reading and digest storage.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refreshing a digest does not manufacture a valid unpublished or unreadable basis.
   * @evidence contracts/common.md#meaningful-documentation Names the publication digest refresh operation.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Basis refresh recomputes the published digest authority before the edit batch is hashed.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The published source owner retains basis reading and digest storage.
   */
  refreshBases: () => void;

  /**
   * The revision owner.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The revision owner. Watched inputs, published basis views and import-graph revisions identify the source boundaries an edit can invalidate.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The revision owner. The source owner supplies paths and revision operations while the subscription owns event batching.
   */
  revisions: IHumanViewerSourceRevisions;
}

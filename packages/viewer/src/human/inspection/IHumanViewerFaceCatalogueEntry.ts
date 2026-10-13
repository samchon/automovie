import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";

import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * A face catalogue entry as the page reads it: the wire entry with its
 * document typed. The page passes it to its domain owner, which admits it.
 *
 * @evidence contracts/common.md#principled-implementation The domain discriminant pairs the document with its own runtime.
 * @evidence contracts/common.md#meaningful-documentation Names the narrowed members.
 *
 * @evidence contracts/common.md#clear-and-simple-design The shared wire catalogue is narrowed only at face domain and its Human face document type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The face discriminator identifies the existing Face runtime without creating a second admission schema.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document The domain discriminant pairs the document with its own runtime.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document The face discriminator identifies the existing Face runtime without creating a second admission schema.
 *
 * @author Samchon
 */
export interface IHumanViewerFaceCatalogueEntry extends IHumanViewerCatalogueEntry {
  /**
   * Always `face`.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Pairs the narrowed face document with the existing Face owner rather than a inferred name-based builder.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Pairs the narrowed face document with the existing Face owner rather than a inferred name-based builder.
   */
  domain: "face";

  /**
   * The face document.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Retains the original Human Face document for owner admission and deterministic replay.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Retains the original Human Face document for owner admission and deterministic replay.
   */
  document: IAutoMovieHumanFaceBasisDocument;
}

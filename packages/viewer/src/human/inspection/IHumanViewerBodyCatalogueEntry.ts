import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * A body catalogue entry as the page reads it: the wire entry with its
 * document typed. The page passes it to its domain owner, which admits it.
 *
 * @evidence contracts/common.md#principled-implementation The domain discriminant pairs the document with its own runtime.
 * @evidence contracts/common.md#meaningful-documentation Names the narrowed members.
 *
 * @evidence contracts/common.md#clear-and-simple-design The shared catalogue wire shape is narrowed only at body domain and document fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The body discriminator chooses the existing Body runtime, while schema admission remains with that owner.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-document The domain discriminant pairs the document with its own runtime.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document The body discriminator chooses the existing Body runtime, while schema admission remains with that owner.
 *
 * @author Samchon
 */
export interface IHumanViewerBodyCatalogueEntry extends IHumanViewerCatalogueEntry {
  /**
   * Always `body`.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Pairs this narrowed catalogue document with the Body runtime that owns its admission.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Pairs this narrowed catalogue document with the Body runtime that owns its admission.
   */
  domain: "body";

  /**
   * The body document.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Preserves the original Body document shape rather than projecting it into a viewer-specific numerical schema.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Preserves the original Body document shape rather than projecting it into a viewer-specific numerical schema.
   */
  document: IAutoMovieHumanBodyBasisDocument;
}

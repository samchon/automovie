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
 * @author Samchon
 */
export interface IHumanViewerFaceCatalogueEntry extends IHumanViewerCatalogueEntry {
  /** Always `face`. */
  domain: "face";

  /** The face document. */
  document: IAutoMovieHumanFaceBasisDocument;
}

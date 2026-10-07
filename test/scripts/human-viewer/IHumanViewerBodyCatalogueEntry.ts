import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";

/**
 * A body catalogue entry as the page reads it: the wire entry with its
 * document typed. The page passes it to its domain owner, which admits it.
 *
 * @evidence contracts/common.md#principled-implementation The domain discriminant pairs the document with its own runtime.
 * @evidence contracts/common.md#meaningful-documentation Names the narrowed members.
 * @author Samchon
 */
export interface IHumanViewerBodyCatalogueEntry extends IHumanViewerCatalogueEntry {
  /** Always `body`. */
  domain: "body";

  /** The body document. */
  document: IAutoMovieHumanBodyBasisDocument;
}

import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";

import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";

/**
 * A face catalogue entry as the page reads it: the wire entry with its
 * document typed. The page passes it to its domain owner, which admits it.
 *
 * @evidence contracts/common.md#principled-implementation The domain discriminant pairs the document with its own runtime.
 * @evidence contracts/common.md#meaningful-documentation Names the narrowed members.
 * @author Samchon
 */
export interface IHumanViewerFaceCatalogueEntry extends IHumanViewerCatalogueEntry {
  /** Always `face`. */
  domain: "face";

  /** The face document. */
  document: IAutoMovieHumanFaceBasisDocument;
}

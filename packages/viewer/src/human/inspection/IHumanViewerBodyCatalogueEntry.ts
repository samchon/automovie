import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * A body catalogue entry as the page reads it: the wire entry with its
 * document typed. The page passes it to its domain owner, which admits it.
 *
 * @author Samchon
 */
export interface IHumanViewerBodyCatalogueEntry extends IHumanViewerCatalogueEntry {
  /** Always `body`. */
  domain: "body";

  /** The body document. */
  document: IAutoMovieHumanBodyBasisDocument;
}

import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";

import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * A face catalogue entry as the page reads it: the wire entry with its
 * document typed. The page passes it to its domain owner, which admits it.
 *
 * @author Samchon
 */
export interface IHumanViewerFaceCatalogueEntry extends IHumanViewerCatalogueEntry {
  /** Always `face`. */
  domain: "face";

  /** The face document. */
  document: IAutoMovieHumanFaceBasisDocument;
}

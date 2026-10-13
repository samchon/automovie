import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * A person catalogue entry as the page reads it: the wire entry with its
 * document typed. The page passes it to its domain owner, which admits it.
 *
 * @author Samchon
 */
export interface IHumanViewerPersonCatalogueEntry extends IHumanViewerCatalogueEntry {
  /** Always `person`. */
  domain: "person";

  /** The person document. */
  document: IAutoMovieHumanPersonDocument;
}

import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";

/**
 * A person catalogue entry as the page reads it: the wire entry with its
 * document typed. The page passes it to its domain owner, which admits it.
 *
 * @evidence contracts/common.md#principled-implementation The domain discriminant pairs the document with its own runtime.
 * @evidence contracts/common.md#meaningful-documentation Names the narrowed members.
 * @author Samchon
 */
export interface IHumanViewerPersonCatalogueEntry extends IHumanViewerCatalogueEntry {
  /** Always `person`. */
  domain: "person";

  /** The person document. */
  document: IAutoMovieHumanPersonDocument;
}

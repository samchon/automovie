import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * A person catalogue entry as the page reads it: the wire entry with its
 * document typed. The page passes it to its domain owner, which admits it.
 *
 * @evidence contracts/common.md#principled-implementation The domain discriminant pairs the document with its own runtime.
 * @evidence contracts/common.md#meaningful-documentation Names the narrowed members.
 *
 * @evidence contracts/common.md#clear-and-simple-design The shared catalogue wire entry is narrowed only at Person domain and its existing Human Person document type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Composition admission remains with the Person owner rather than being inferred from its separately typed face and body.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority The domain discriminant pairs the document with its own runtime.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Composition admission remains with the Person owner rather than being inferred from its separately typed face and body.
 *
 * @author Samchon
 */
export interface IHumanViewerPersonCatalogueEntry extends IHumanViewerCatalogueEntry {
  /**
   * Always `person`.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Pairs the composed document with the Person owner rather than inferring admission from its separate parts.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Pairs the composed document with the Person owner rather than inferring admission from its separate parts.
   */
  domain: "person";

  /**
   * The person document.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Keeps the original Human Person document for combined owner admission and deterministic composition.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Keeps the original Human Person document for combined owner admission and deterministic composition.
   */
  document: IAutoMovieHumanPersonDocument;
}

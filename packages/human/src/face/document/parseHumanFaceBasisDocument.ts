import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import { admit } from "./admit";
import { assertTextSize } from "./assertTextSize";

/**
 * Load compact connected-basis edits without resolving an asset or photograph.
 * Schema and finite-number admission precede worker allocation in the browser.
 * The compiled basis separately owns channel names, ranges and model admission.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Loads independent numerical edits while refusing unknown fields and invalid scalar values.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Admits the compact document schema without changing its basis identity or supplied controls.
 */
export function parseHumanFaceBasisDocument(
  text: string,
): IAutoMovieHumanFaceBasisDocument {
  assertTextSize(text);
  return admit(JSON.parse(text));
}

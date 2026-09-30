import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import { admitHumanFaceBasisDocument } from "./admitHumanFaceBasisDocument";

/**
 * Load compact connected-basis edits without resolving an asset or photograph.
 * Schema and finite-number admission precede worker allocation in the browser.
 * The compiled basis separately owns channel names, ranges and model admission.
 */
export function parseHumanFaceBasisDocument(
  text: string,
): IAutoMovieHumanFaceBasisDocument {
  assertTextSize(text);
  return admitHumanFaceBasisDocument(JSON.parse(text));
}

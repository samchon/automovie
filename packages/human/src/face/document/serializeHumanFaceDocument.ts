import type { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import { assertFinite } from "./assertFinite";
import { parseHumanFaceDocument } from "./parseHumanFaceDocument";

/**
 * Save only the replay document, not a mesh cache, screenshot or source image.
 * Parsing the serialized representation applies the same schema admission as
 * load, so optional values that JSON omits do not become new runtime settings.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Preserves portable independently replayable face settings for save/load.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Keeps the source basis, controls and explicit overrides together.
 */
export function serializeHumanFaceDocument(
  document: IAutoMovieHumanFaceDocument,
): string {
  assertFinite(document);
  const text = JSON.stringify(document, null, 2);
  parseHumanFaceDocument(text);
  return text;
}

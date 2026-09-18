import type { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import { parseHumanFaceDocument } from "./parseHumanFaceDocument";

/**
 * Save only the replay document, not a mesh cache, screenshot or source image.
 * Parsing the serialized representation applies the same schema admission as
 * load, so optional values that JSON omits do not become new runtime settings.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Preserves portable independently replayable face settings for save/load.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Keeps version, source basis, controls and explicit overrides together.
 */
export function serializeHumanFaceDocument(
  document: IAutoMovieHumanFaceDocument,
): string {
  assertFinite(document);
  const text = JSON.stringify(document, null, 2);
  parseHumanFaceDocument(text);
  return text;
}

function assertFinite(value: unknown, ancestors = new Set<object>()): void {
  if (typeof value === "number" && !Number.isFinite(value))
    throw new Error("Face document numbers must be finite.");
  if (value !== null && typeof value === "object") {
    if (ancestors.has(value))
      throw new Error("Face documents cannot contain cyclic references.");
    ancestors.add(value);
    for (const item of Object.values(value)) assertFinite(item, ancestors);
    ancestors.delete(value);
  }
}

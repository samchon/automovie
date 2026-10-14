import type { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import { assertFinite } from "./assertFinite";
import { parseHumanFaceDocument } from "./parseHumanFaceDocument";

/**
 * Save only the replay document, not a mesh cache, screenshot or source image.
 * Parsing the serialized representation applies the same schema admission as
 * load, so optional values that JSON omits do not become new runtime settings.
 *
 * @evidence contracts/common.md#principled-implementation Recursive finite/cycle admission precedes JSON, and parsing the actual escaped formatted result reapplies load schema, text envelope and immutable-detail restrictions. Source geometry stays replay data rather than a generated mesh/likeness claim.
 * @evidence contracts/common.md#clear-and-simple-design Standard serialization and the existing parser form one load/save boundary; no separate schema or asset fetch is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite values cannot silently save as null and JSON-omitted optional fields are judged through actual load semantics. Invalid/oversize output refuses, with no screenshot/image/model-cache substitution.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes editable replay data from caches/images and explains actual serialized re-admission, optional omission and unchanged input ownership.
 * @evidence contracts/performance.md#efficient-algorithms Full finite traversal, JSON formatting and parse/schema/detail validation follow actual source/override populations and output length; reparsing allocates a second document but is required to judge emitted representation rather than just memory state.
 * @evidence contracts/performance.md#reuse-equivalent-work Saving reuses the loader's rules and text envelope; each mutable document's emitted representation must be admitted anew, with no cached save success.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the formatted string transfers; reparsed validation data becomes collectible and this serializer owns no file handle, async job or retained mesh cache.
 */
export function serializeHumanFaceDocument(
  document: IAutoMovieHumanFaceDocument,
): string {
  assertFinite(document);
  const text: string = JSON.stringify(document, null, 2);
  parseHumanFaceDocument(text);
  return text;
}

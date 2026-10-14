import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { legacyImporterInvalidLegacyImportJsonError } from "./legacyImporterInvalidLegacyImportJsonError";

/**
 * Parse bytes through the duplicate-aware structured JSON owner and convert parse refusal into the import-specific error carrying file context and the original cause.
 *
 * @evidence contracts/common.md#principled-implementation The canonical structured parser owns duplicate-key and JSON syntax admission; the import wrapper adds the record path needed by applied-state refusal handling.
 * @evidence contracts/common.md#clear-and-simple-design Keeps parsing separate from schema/semantic admission and uses one import-specific error class for malformed persisted state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed bytes do not become a usable record. If String(error) succeeds, the import Error retains the original cause beside its file-attributed message; an arbitrary nonconvertible failure can instead escape during that formatting.
 * @evidence contracts/common.md#meaningful-documentation States strict duplicate-aware parsing, file context, conditional cause wrapping and the separate schema boundary; it neither totalizes thrown values nor validates the returned tree's application shape.
 * @evidence contracts/performance.md#efficient-algorithms Parsing follows J input bytes and decoded JSON population, with wrapper message storage following path/error text length; parser limits and work remain with its canonical owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the shared structured parser but does not cache parsed objects across mutable byte inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns parsed caller-owned data or one import Error; it retains no descriptor and byte acquisition belongs to the surrounding reader.
 */
export const legacyImporterParseJson: (bytes: Uint8Array, file: string) => unknown = (bytes: Uint8Array, file: string): unknown => {
  try {
    return parseAutoMovieStructuredJson({ record: file, bytes });
  } catch (error) {
    throw new legacyImporterInvalidLegacyImportJsonError(
      `Invalid JSON "${file}": ${String(error)}`,
      { cause: error },
    );
  }
};

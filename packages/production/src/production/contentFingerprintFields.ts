import type { IAutoMovieFingerprintField } from "./IAutoMovieFingerprintField";
import type { IAutoMovieProductionContentInput } from "./IAutoMovieProductionContentInput";
import { normalizeAutoMovieSource } from "./contentIdentity";
import { isTypeScriptSourcePath } from "./productionBuildDiagnostics";

/**
 * Project declared content into ordered identity fields with explicit absent bytes.
 *
 * Null bytes produce absent fields. Inventory-marked TypeScript source strips a leading BOM and normalizes CR/CRLF under strict UTF-8; other content keeps its borrowed byte array unchanged. Input order and path spelling participate, and invalid source encoding propagates.
 *
 * @evidence contracts/common.md#principled-implementation Source-only normalization preserves meaningful whitespace while treating supported checkout BOM/EOL differences as equivalent. The inventory supplies paths, source flags and byte admission; this projection does not read files or validate unique ownership.
 * @evidence contracts/common.md#clear-and-simple-design One content policy serves timed and library fingerprints, with extension recognition and strict normalization owned by their existing helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing content is explicit rather than an empty present file. Binary/non-source content is not normalized, and duplicate input paths are neither collapsed nor silently repaired here.
 * @evidence contracts/common.md#meaningful-documentation Documents null-versus-empty bytes, selective normalization, order-sensitive identity, strict decoding and borrowed-versus-new payload ownership.
 * @evidence contracts/performance.md#efficient-algorithms For C inputs, allocation is O(C); marked TypeScript payloads additionally traverse/copy their full source bytes, while other payloads are reused directly. The eventual field encoder hashes all payload and label bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Non-source byte arrays are reused within this attempt; normalized source outputs are new. No cross-call cache assumes mutable input arrays still contain equivalent bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned fields can retain original binary arrays or fresh normalized buffers until fingerprint consumers release them. No file/task is opened and declared byte population is not capped here.
 */
export function contentFingerprintFields(
  inputs: readonly IAutoMovieProductionContentInput[]
): IAutoMovieFingerprintField[] { return inputs.map((content: IAutoMovieProductionContentInput): IAutoMovieFingerprintField => ({
    role: `content:${content.path}`,
    kind: content.bytes === null ? "absent" : "file",
    payload:
      content.bytes === null
        ? new Uint8Array()
        : content.source && isTypeScriptSourcePath(content.path)
          ? normalizeAutoMovieSource(content.bytes)
          : content.bytes,
  })); }

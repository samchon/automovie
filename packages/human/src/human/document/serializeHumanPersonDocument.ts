import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../../body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import { admitHumanPersonDocument } from "./admitHumanPersonDocument";

/**
 * Admit the actual person record and optional host source, then serialize with two-space JSON indentation and check the loader's 16,777,216 UTF-16-code-unit envelope. This prevents admitted numeric fields from silently becoming JSON null. The check runs after formatting allocation and guarantees the shared text envelope, not source availability or arbitrary downstream behavior. Caller records remain unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Exact person/anatomy finite admission precedes deterministic JSON formatting, and the same envelope owner admits the saved text for loading.
 * @evidence contracts/common.md#clear-and-simple-design One saver composes established record and text owners with standard JSON formatting; no independent schema or migration is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid numerical records refuse before JSON null substitution and oversize output is rejected without truncation; admission uses the supplied actual host authority.
 * @evidence contracts/common.md#meaningful-documentation Prose states admission timing, two-space formatting, UTF-16 envelope after allocation and unchanged-input ownership.
 * @evidence contracts/performance.md#efficient-algorithms Admission and serialization follow actual record/output size; the final stored-length check is constant-time and does not avoid the formatted allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each mutable document/source pair is admitted and formatted anew, with no stale serialization cache or request coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the owned JSON string escapes; temporary generated diagnostics follow failure lifetime and no document/source task is retained.
 */
export function serializeHumanPersonDocument(
  document: IAutoMovieHumanPersonDocument,
  bodySource?: IAutoMovieHumanBodyAnatomicalAssembly,
): string {
  const text: string = JSON.stringify(
    admitHumanPersonDocument(document, bodySource),
    null,
    2,
  );
  assertTextSize(text);
  return text;
}

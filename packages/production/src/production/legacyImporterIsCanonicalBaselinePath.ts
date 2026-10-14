import { IAutoMovieLegacyOwnedDirectoryBaseline } from "@automovie/interface";

/**
 * Require a slash-separated strict child of the specified baseline root with no backslash, empty, dot or parent segment. Runtime baseline admission separately establishes the root's closed path value.
 *
 * @evidence contracts/common.md#principled-implementation A rooted prefix plus per-segment checks makes the recorded child path canonical under the supported relative-path representation.
 * @evidence contracts/common.md#clear-and-simple-design One predicate supplies both directory and file baseline checks, leaving sorting and population consistency to their parent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No path resolution normalizes an escaping input into admission; this predicate itself performs no physical ancestry observation.
 * @evidence contracts/common.md#meaningful-documentation States descendant form, forbidden segments and the difference between lexical admission and filesystem identity.
 * @evidence contracts/performance.md#efficient-algorithms Prefix, backslash and segment checks take O(P) path characters and O(P) temporary split-string storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the canonical path rule across baseline populations without caching mutable record validity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a boolean and opens no file, directory or lease; split segments expire with the call.
 */
export const legacyImporterIsCanonicalBaselinePath: (value: string, expectedPath: IAutoMovieLegacyOwnedDirectoryBaseline["path"]) => boolean = (
  value: string,
  expectedPath: IAutoMovieLegacyOwnedDirectoryBaseline["path"],
): boolean =>
  value.startsWith(`${expectedPath}/`) &&
  value.includes("\\") === false &&
  value
    .split("/")
    .every(
      (segment: string): boolean => segment.length !== 0 && segment !== "." && segment !== "..",
    );

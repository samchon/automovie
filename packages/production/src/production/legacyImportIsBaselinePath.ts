import { IAutoMovieLegacyOwnedDirectoryBaseline } from "@automovie/interface";
import { legacyImportIsCanonicalRelativePath } from "./legacyImportIsCanonicalRelativePath";

/**
 * A required root/ prefix and legacy relative spelling admit strict descendants of the specified baseline root.
 *
 * @evidence contracts/common.md#principled-implementation A required root/ prefix and legacy relative spelling admit strict descendants of the specified baseline root.
 * @evidence contracts/common.md#clear-and-simple-design Directory and file baseline predicates share lexical containment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Prefix admission does not resolve symlinks or authenticate physical directories.
 * @evidence contracts/common.md#meaningful-documentation States that the root itself is not a child entry and input text is preserved.
 * @evidence contracts/performance.md#efficient-algorithms Prefix comparison and O(L) spelling admission dominate work/storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the legacy spelling owner for each current value/root pair.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean returns; neither path nor root is retained.
 */
export const legacyImportIsBaselinePath: (value: string, root: IAutoMovieLegacyOwnedDirectoryBaseline["path"]) => boolean = (value: string, root: IAutoMovieLegacyOwnedDirectoryBaseline["path"]): boolean => value.startsWith(`${root}/`) && legacyImportIsCanonicalRelativePath(value);

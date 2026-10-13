import type { AutoMovieContractFamily } from "./AutoMovieContractFamily";
import type { IAutoMovieSharedContractReference } from "./IAutoMovieSharedContractReference";

/**
 * The first path component identifies a bundled family; language routes use their second component.
 *
 * @evidence contracts/common.md#principled-implementation The first path component identifies a bundled family; language routes use their second component.
 * @evidence contracts/common.md#clear-and-simple-design Shared route lookup reads family independently from domain and basename.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The cast relies on the bundled inventory; arbitrary caller paths are not admitted by this helper.
 * @evidence contracts/common.md#meaningful-documentation The family vocabulary distinguishes discovery, naturalness, obligations, principles and upstream duties.
 * @evidence contracts/performance.md#efficient-algorithms One split scans the path and handles the supported language prefix; the inventory itself has a fixed supported size.
 * @evidence contracts/performance.md#reuse-equivalent-work No cached classification is shared; callers reuse the canonical inventory objects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No retained registry is created by this extraction.
 */
export function contractFamily(contract: IAutoMovieSharedContractReference): AutoMovieContractFamily {
  const segments: string[] = contract.file.split("/");
  return (
    segments[0] === "language" ? segments[1] : segments[0]
  ) as AutoMovieContractFamily;
}

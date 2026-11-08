import { IAutoMovieRenderTargetAsset } from "@automovie/interface";

import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

/** Assets shorthand: pair paths with digests already proved elsewhere.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Sort own asset paths by code units and pair each with its supplied digest; sealing later admits nonblank paths, duplicate-free identity and exact SHA spellings.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This shorthand owns deterministic asset ordering without resolving files or calculating bytes already proved by the caller.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only own keys are read, preserving arbitrary path spellings; no filename or expected digest is substituted and this adapter is not a byte-integrity validator.
 * @evidence contracts/development/common.md#meaningful-documentation Docs identify paths paired with previously proved digests and caller ownership of fresh returned records.
 * @evidence contracts/development/implementation.md#efficient-algorithms A assets require O(A log A) comparison sorting and O(A) output, including path-length comparison costs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Digest values are reused as supplied; no asset read or hash repeats here, and changed input records require a new ordered list.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the resulting array/records; local key storage is released and no file handle or asynchronous asset task is opened.
 */
export const autoMovieRenderTargetAssets: (
  entries: Readonly<Record<string, string>>,
) => IAutoMovieRenderTargetAsset[] = (
  entries: Readonly<Record<string, string>>,
): IAutoMovieRenderTargetAsset[] =>
  Object.keys(entries)
    .sort(compareAutoMovieRenderIds)
    .map((path: string): { path: string; digest: string } => ({
      path,
      digest: entries[path]!,
    }));

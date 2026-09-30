/**
 * Whether the browser build of `@automovie/human` is at least as new as the
 * source it was built from.
 *
 * The playground dev server hands the page the browser build (`lib/browser`),
 * not the source, and it never rebuilds it. A frame captured after a source
 * edit therefore shows the old code, and a feature the edit added reads as
 * absent. The check compares times only: the newest modification of any
 * source file against the modification of the browser entry. A missing build
 * is stale. Equal times are fresh, because a build finishes after its inputs
 * were last written and a coarse file system can round both to one instant.
 *
 * @param sourceNewestMs Newest modification time of the package's source, milliseconds since the epoch, or `null` when it has no source files.
 * @param builtAtMs Modification time of the browser entry, or `null` when it does not exist.
 * @returns `fresh` and, when it is not, the reason to print.
 */
export function judgeViewerFreshness(
  sourceNewestMs: number | null,
  builtAtMs: number | null,
): { fresh: boolean; reason: string } {
  if (builtAtMs === null)
    return {
      fresh: false,
      reason:
        "The browser build of @automovie/human does not exist; run pnpm --filter @automovie/human build.",
    };
  if (sourceNewestMs !== null && sourceNewestMs > builtAtMs)
    return {
      fresh: false,
      reason:
        "@automovie/human source is newer than its browser build; run pnpm --filter @automovie/human build.",
    };
  return { fresh: true, reason: "" };
}

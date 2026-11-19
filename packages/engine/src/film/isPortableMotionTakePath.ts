/**
 * Recognize a production-relative POSIX path portable to Windows and POSIX hosts.
 *
 * Each slash-separated component must be nonempty and may not contain Windows-forbidden punctuation or control bytes, end with a dot or space, or name a Windows device. This is a syntax check; the host decides filesystem availability and physical confinement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the accepted syntax and the separate filesystem responsibilities.
 * @evidence contracts/development/implementation.md#principled-implementation Reads one relative path component at a time; empty components reject absolute paths and repeated separators, while the Windows rules also reject dot and parent segments.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Shares the syntax predicate between film artifact admission and the installed filesystem host.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Applies one portable syntax on both hosts without normalizing or rewriting an authored path.
 * @evidence contracts/development/implementation.md#efficient-algorithms Scans the path and checks each separated component in linear time and temporary path-sized space.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Evaluates one input path independently and retains no results.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Examines a string and returns only a boolean.
 */
export function isPortableMotionTakePath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value
      .split("/")
      .every(
        (segment: string): boolean =>
          segment.length !== 0 &&
          !/[<>:"\\|?*\u0000-\u001f]|[. ]$/u.test(segment) &&
          !/^(?:CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])(?:\.|$)/iu.test(
            segment,
          ),
      )
  );
}

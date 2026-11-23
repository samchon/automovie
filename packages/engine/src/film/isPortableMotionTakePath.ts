/**
 * Recognize a production-relative POSIX path portable to Windows and POSIX
 * hosts.
 *
 * Each slash-separated component must be nonempty and may not contain
 * Windows-forbidden punctuation or control bytes, end with a dot or space, or
 * name a Windows device. This is a syntax check; the host decides filesystem
 * availability and physical confinement.
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

/**
 * Windows reserved device names, matched case-insensitively against a stem's
 * first dot-separated segment, because Windows reserves them with any
 * extension.
 */
const WINDOWS_RESERVED_NAMES: ReadonlySet<string> = new Set<string>([
  "con",
  "prn",
  "aux",
  "nul",
  "com1",
  "com2",
  "com3",
  "com4",
  "com5",
  "com6",
  "com7",
  "com8",
  "com9",
  "lpt1",
  "lpt2",
  "lpt3",
  "lpt4",
  "lpt5",
  "lpt6",
  "lpt7",
  "lpt8",
  "lpt9",
]);

/**
 * A file-system-safe stem for a render target's default frame directory and
 * output video name, always exactly one path component.
 *
 * Every run of characters outside `A-Z a-z 0-9 _ . -` becomes one `_`, which
 * also replaces every space, and trailing dots are removed because Windows
 * strips them when it writes a name. An empty result, including `.` and `..`,
 * becomes `render`, so `renders/<stem>` can never name the parent directory. A
 * stem whose first dot-separated segment is a Windows device name, such as
 * `con` or `nul.mp4`, gains a leading `_`. Distinct targets may share a stem,
 * such as `a/b` and `a_b`; callers that need distinct paths must keep their
 * targets distinct after this mapping.
 */
export const renderPathStem: (target: string) => string = (
  target: string,
): string => {
  const cleaned: string = target
    .replace(/[^A-Za-z0-9_.-]+/g, "_")
    .replace(/\.+$/, "");
  if (cleaned.length === 0) return "render";
  const base: string = cleaned.split(".")[0]!.toLowerCase();
  return WINDOWS_RESERVED_NAMES.has(base) ? `_${cleaned}` : cleaned;
};

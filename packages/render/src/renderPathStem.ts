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
 * strips them when it writes a name. An empty result, including `.` and `..`, becomes `render`,
 * so `renders/<stem>` can never name the parent directory. A stem whose first
 * dot-separated segment is a Windows device name, such as `con` or `nul.mp4`,
 * gains a leading `_`. Distinct targets may share a stem, such as `a/b` and
 * `a_b`; callers that need distinct paths must keep their targets distinct
 * after this mapping.
 *
 * @evidence contracts/common.md#principled-implementation The allowed set contains no path separator, so the result is one component on POSIX and Windows, and the remaining hazards are the two names made of legal characters that mean a directory, `.` and `..`, Windows' trailing-dot stripping, its trailing-space stripping being unreachable because no space survives the character mapping, and its reserved device names, each handled by its own rule.
 * @evidence contracts/common.md#clear-and-simple-design The sequence render plan and the production project's output naming both derive paths from target ids through this one function, so a frame directory and its video agree on the stem.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reserved-name list is the Windows device-name contract, a real platform difference, and no target id is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc states the character mapping, the trailing-character rule and why, the empty-result fallback, the device-name prefix, and that the mapping is not injective.
 * @evidence contracts/performance.md#efficient-algorithms Two regular-expression passes and one split are linear in the target length, and the device-name check is a constant-time set lookup.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call maps one short id, cheaper than caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function returns a new string and retains nothing; the device-name set is a fixed module constant.
 * @author Samchon
 */
export const renderPathStem: (target: string) => string = (target: string): string => {
  const cleaned: string = target
    .replace(/[^A-Za-z0-9_.-]+/g, "_")
    .replace(/\.+$/, "");
  if (cleaned.length === 0) return "render";
  const base: string = cleaned.split(".")[0]!.toLowerCase();
  return WINDOWS_RESERVED_NAMES.has(base) ? `_${cleaned}` : cleaned;
};

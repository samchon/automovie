import path from "node:path";

/**
 * Expresses a directory as an Evidence reference root of one production.
 *
 * Native Evidence resolves a Markdown reference root against the directory of
 * the configuration file, which is the production location, and accepts `..`
 * segments, so a shared tree outside the production is reached by a relative
 * path such as `../../../.agents/skills`. Separators are portable so the same
 * configuration reads alike on every platform.
 *
 * @param location Absolute production directory holding `evidence.config.ts`.
 * @param directory Absolute directory the root must reach.
 * @returns The `/`-separated relative root, or `.` for the production itself.
 *
 * @evidence contracts/development/implementation.md#principled-implementation `path.relative` between two absolute directories gives the path native Evidence resolves back against the configuration directory; replacing `\` with `/` keeps Windows output portable. Directories on different Windows drives have no relative path, and Node then returns the absolute target, which passes through unchanged.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function owns the location-to-root rule for the engineering defaults and both story contract owners, instead of repeating the relative-and-normalize steps at each reference.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No root is special-cased; an empty relative path becomes `.` because an empty root names no directory.
 * @evidence contracts/development/implementation.md#efficient-algorithms One relative-path computation and one replacement, linear in the path lengths.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure path computation coordinates no work across requests.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the returned string outlives the call.
 * @evidence contracts/development/common.md#meaningful-documentation States how native Evidence resolves the result, the portable separators, the parameters and the `.` result.
 */
export function createReferenceRoot(
  location: string,
  directory: string,
): string {
  const relative: string = path
    .relative(location, directory)
    .replaceAll("\\", "/");
  return relative === "" ? "." : relative;
}

import path from "node:path";

/*
 * Expresses a directory as an Evidence reference root of one production.
 *
 * Native Evidence resolves a Markdown reference root against the directory of
 * the configuration file, which is the production location, and accepts `..`
 * segments, so a shared tree outside the production is reached by a relative
 * path such as `../../../.agents/skills`. Separators are portable so the same
 * configuration reads alike on every platform.
 * Parameter location: Absolute production directory holding `evidence.config.ts`.
 * Parameter directory: Absolute directory the root must reach.
 * Returns: The `/`-separated relative root, or `.` for the production itself.
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

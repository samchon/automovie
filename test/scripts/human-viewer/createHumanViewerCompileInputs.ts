import path from "node:path";

/**
 * Which file events can change the human compile: an edit to a file the last
 * compile read (its transformed sources, import ends, configs and probed
 * resolution candidates), any file added or removed under the package's
 * source (membership), and the package configuration. Before the first
 * compile every event under the package counts. Other watched files (viewer
 * screens, other packages, inputs, outputs) never withdraw a compile, so an
 * unrelated save cannot replace the modules a page is still loading.
 *
 * @evidence contracts/common.md#principled-implementation A compile is withdrawn only by a change to what it read or may read.
 * @evidence contracts/common.md#clear-and-simple-design One owner holds the last compile's inputs and answers for each event.
 * @evidence contracts/common.md#meaningful-documentation States what counts, the membership rule and the state before the first compile.
 */
export function createHumanViewerCompileInputs(
  human: string,
  extra: readonly string[],
) {
  const normalize = (file: string): string =>
    path.resolve(file).replaceAll("\\", "/").toLowerCase();
  const source = normalize(path.join(human, "src")) + "/";
  const root = normalize(human) + "/";
  const configs = new Set(extra.map(normalize));
  let read: Set<string> | null = null;
  return {
    /** Record the files the last successful compile read, already normalized by the compile process. */
    compiled: (keys: readonly string[]): void => {
      read = new Set(keys);
    },

    /** Whether this file event can change the compile. */
    affects: (file: string, event: string): boolean => {
      const name = normalize(file);
      if (configs.has(name)) return true;
      if (read === null) return name.startsWith(root);
      if (read.has(name)) return true;
      return event !== "update" && name.startsWith(source);
    },
  };
}

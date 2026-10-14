import path from "node:path";

import { normalizeHumanViewerCompilePath } from "./normalizeHumanViewerCompilePath.js";

/**
 * Which file events can change the human compile: an edit to a file the last compile read (its transformed sources, import ends, configs and probed resolution candidates), any file added or removed under the package's source (membership), and the package configuration. Before the first compile every event under the package counts. Recorded compiler dependencies count even when they belong to another package; unrelated watched files absent from that read set and the configured inputs do not withdraw a compile merely because they were saved.
 *
 * @evidence contracts/common.md#principled-implementation The last compiler read set, configured inputs and source membership classify events that can invalidate this compiler; initial admission includes the package root.
 * @evidence contracts/common.md#clear-and-simple-design One nullable read set separates precompile admission from known-input and source-membership checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Compiler publication and events share a path normalizer that preserves distinct POSIX case; lexical keys do not certify symbolic-link equivalence.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes initial admission, read dependencies, added or removed members and unrelated watcher events.
 * @evidence contracts/performance.md#efficient-algorithms Updating the read set takes linear work in compiler inputs; each event performs path normalization, expected constant-time set lookups and prefix checks.
 * @evidence contracts/performance.md#reuse-equivalent-work A successful compile replaces the entire previous read set; matching includes recorded cross-package dependencies, configured inputs and human source membership, while unrelated unrecorded source owners remain outside it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One read set and fixed configured-input set remain with the server compiler; replacement drops the prior set, and there is no independent entry cap beyond the compiler input graph.
 */
export function createHumanViewerCompileInputs(
  human: string,
  extra: readonly string[],
): {
  compiled: (keys: readonly string[]) => void;
  affects: (file: string, event: string) => boolean;
} {
  const source: string =
    normalizeHumanViewerCompilePath(path.join(human, "src")) + "/";
  const root: string = normalizeHumanViewerCompilePath(human) + "/";
  const configs: Set<string> = new Set(
    extra.map(normalizeHumanViewerCompilePath),
  );
  let read: Set<string> | null = null;
  return {
    /** Record the files the last successful compile read, already normalized by the compile process. */
    compiled: (keys: readonly string[]): void => {
      read = new Set(keys);
    },

    /** Whether this file event can change the compile. */
    affects: (file: string, event: string): boolean => {
      const name: string = normalizeHumanViewerCompilePath(file);
      if (configs.has(name)) return true;
      if (read === null) return name.startsWith(root);
      if (read.has(name)) return true;
      return event !== "update" && name.startsWith(source);
    },
  };
}

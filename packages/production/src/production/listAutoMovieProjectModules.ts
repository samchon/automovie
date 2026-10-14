import path from "node:path";

/**
 * Select the loaded module ids that are one project's own code.
 *
 * A module under the project root and outside every `node_modules` directory
 * is treated as authored project code; installed package generations are
 * outside this eviction policy and assumed stable for the running host. Evicting
 * exactly this selection before a gate run makes an edit the code that runs,
 * and the source evaluation reads exactly this selection after the run to learn
 * which project files the answer executed. When both sides use this one
 * predicate, the modules one side evicts are the modules the other accounts for.
 *
 * @evidence contracts/common.md#principled-implementation Uses native path.relative to distinguish descendants from the exact parent or parent-segment prefix, excluding exact node_modules segments. runAutoMovieProductionBuild evicts these IDs and source evaluation accounts for the same selected project closure.
 * @evidence contracts/common.md#clear-and-simple-design One lexical module-selection policy serves pre-run eviction and post-run dependency observation; loader ownership and filesystem path admission remain outside this helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Descendant filenames beginning with two dots are not mistaken for parent traversal. Loaded IDs are assumed absolute native paths; modules outside the project and installed-package mutations are not accounted for by this project-only policy.
 * @evidence contracts/common.md#meaningful-documentation States selection order, segment boundaries, callers and the stable-package premise; it neither resolves symlinks nor proves authored Node effects deterministic.
 * @evidence contracts/performance.md#efficient-algorithms For K loaded IDs with total path length L, one filtering pass computes relative paths and scans segments in O(L) time, retaining O(S) result references for S selected IDs and only the current path's temporary segments.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every call receives a fresh loader-key population and project root; caching selection would require comparing that same population and would hide newly loaded modules without eliminating its scan.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new ordered array of existing ID strings and retains no loader state, file handle or task; eviction and cache lifetime belong to the build host.
 */
export function listAutoMovieProjectModules(props: {
  /** Absolute project root. */
  root: string;

  /** Absolute ids of every currently loaded module. */
  loaded: readonly string[];
}): string[] {
  return props.loaded.filter((id: string): boolean => {
    const relative: string = path.relative(props.root, id);
    return (
      relative !== "" &&
      relative !== ".." &&
      relative.startsWith(`..${path.sep}`) === false &&
      path.isAbsolute(relative) === false &&
      relative.split(path.sep).includes("node_modules") === false
    );
  });
}

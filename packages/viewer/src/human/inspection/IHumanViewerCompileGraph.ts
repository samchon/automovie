/**
 * The import graph and compiler inputs the human compile reports, all paths relative to the human package. Every file named here is watched, so an edit to a type-only dependency or a config still invalidates the build.
 *
 * @evidence contracts/common.md#principled-implementation Mirrors compiler-reported import edges, globals, configs and optional resolution candidates/inputs used to compose the watched compile population.
 * @evidence contracts/common.md#clear-and-simple-design Keeps compiler dependency facts in one transport record so compile-human.mts owns one complete watch-list normalization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type-only dependencies and configs are included when reported; absent optional adapter fields cannot establish complete future resolver behavior.
 * @evidence contracts/common.md#meaningful-documentation Names paths relative to the Human package and distinguishes probes from actual input reads; graph reporting is not numerical or visual admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This graph record performs no traversal; its consumer flattens edges/probes and deduplicates watch paths in input-sized work.
 * @evidence contracts/performance.md#reuse-equivalent-work The compiled generation reuses its reported watch set until invalidation; changes to reached sources/config/membership require a new compile.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Edge and path arrays grow with reported compiler inputs without a separate cap; they retain no native watcher or file descriptor.
 *
 * @author Samchon
 */
export interface IHumanViewerCompileGraph {
  /** Import edges, from a file to the files it imports. */
  edges: Record<string, string[]>;

  /** Global declaration files. */
  globals: string[];

  /** Configuration files the compile read. */
  configs: string[];

  /** Candidate resolution paths probed per import, when reported. */
  candidates?: Record<string, string[]>;

  /** Other files module resolution read, when reported. */
  resolutionInputs?: string[];
}

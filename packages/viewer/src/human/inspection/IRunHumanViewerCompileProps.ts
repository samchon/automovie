/**
 * Where the human compile runs and writes.
 *
 * @evidence contracts/common.md#principled-implementation Compile configuration names the viewer script, Human package root and output directory for one isolated whole-package transform process.
 * @evidence contracts/common.md#clear-and-simple-design Three directory inputs keep process invocation configuration separate from transformed-file and source-graph results.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The compile targets the actual Human package rather than replacing failed modules with fixture or mock output.
 * @evidence contracts/common.md#meaningful-documentation Members identify compile-human.ts location, the package being compiled and the output-file directory.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Directory configuration chooses no compiler transform or output parsing algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Unique output files isolate overlapping compiles; this props shape declares no transformed-result equivalence cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources These directory strings own no child process or output-file handle; runHumanViewerCompile owns invocation and cleanup.
 *
 * @author Samchon
 */
export interface IRunHumanViewerCompileProps {
  /** The viewer script directory holding `compile-human.ts`. */
  directory: string;

  /** The human package directory to compile. */
  human: string;

  /** Directory for the compile output file. */
  outputDirectory: string;
}

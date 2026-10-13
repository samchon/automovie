import { IAutoMovieCompiledShotSource } from "./IAutoMovieCompiledShotSource";

/**
 * One compiled shot paired with the caller-supplied revision used to qualify inspection answers.
 *
 * @evidence contracts/common.md#principled-implementation Subject description and structural diff read resident compiled records and propagate this revision into their results; production supplies the current compile or content identity at its inspection boundary.
 * @evidence contracts/common.md#clear-and-simple-design A revision and compiled value provide one reusable inspection input without embedding project storage or rendering state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This pure data pair does not independently prove that revision matches bytes or current project state; caller admission owns freshness rather than the presence of a revision string.
 * @evidence contracts/common.md#meaningful-documentation Defines compiled artifact ownership and the caller-supplied revision qualification used by inspection results.
 * @author Samchon
 */
export interface IAutoMovieSubjectArtifact {
  /** Stable content or compile revision of {@link compiled}. */
  revision: string;

  /** Fully compiled shot data inspected by the engine. */
  compiled: IAutoMovieCompiledShotSource;
}

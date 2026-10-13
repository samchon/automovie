/**
 * One synthetic project-root-relative Markdown source.
 *
 * @author Samchon
 */
export interface IAutoMovieInstructionMarkdownSource {
  /** Project-root-relative POSIX path. */
  path: string;

  /** Exact Markdown bytes. */
  content: string;
}

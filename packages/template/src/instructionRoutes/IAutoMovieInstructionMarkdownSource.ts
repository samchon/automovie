/**
 * One synthetic project-root-relative Markdown source.
 *
 * @evidence requirements/agent-authoring/capability-discovery.md#agent-topic-document-discovery Represents one addressable instruction source for deterministic route validation.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Keeps validation independent of the host filesystem when callers already own the candidate publication.
 * @author Samchon
 */
export interface IAutoMovieInstructionMarkdownSource {
  /** Project-root-relative POSIX path. */
  path: string;

  /** Exact Markdown bytes. */
  content: string;
}

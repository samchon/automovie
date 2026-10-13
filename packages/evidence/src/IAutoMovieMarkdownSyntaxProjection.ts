import type { IAutoMovieEvidenceSyntaxAnnotation } from "./IAutoMovieEvidenceSyntaxAnnotation";


/** Line-preserving Markdown views used by graph and reader validation.
 *
 * @evidence contracts/common.md#principled-implementation Visible line text and live-comment annotations share original document addresses.
 * @evidence contracts/common.md#clear-and-simple-design One projection serves syntax readers and structural admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Comments and code are blanked structurally without grading authored prose.
 * @evidence contracts/common.md#meaningful-documentation Members state live comment carriers and reader-visible line exclusions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased projection shape owns no buffer or handle; projectAutoMovieMarkdownSyntax creates visible-line and annotation arrays whose retained text belongs to the result caller.
 *
 * @author Samchon
 */
export interface IAutoMovieMarkdownSyntaxProjection {

  /** Evidence declarations carried by live HTML comments. */
  annotations: readonly IAutoMovieEvidenceSyntaxAnnotation[];

  /** Reader-visible lines with comments, fenced examples, and indented code blanked. */
  visibleLines: readonly string[];
}

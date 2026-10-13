


/** One evidence declaration read only from a native carrier.
 *
 * @evidence contracts/common.md#principled-implementation Host and original start/end lines address one joined native evidence declaration.
 * @evidence contracts/common.md#clear-and-simple-design One carrier row supports structural validators independent from graph selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only admitted comments produce these rows; arbitrary source-shaped strings are not represented as evidence.
 * @evidence contracts/common.md#meaningful-documentation Members state host ownership, original one-based line bounds and joined tag text.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased annotation shape retains no state itself; parseAutoMovieEvidenceSyntax creates host/text/line rows and transfers their array to the inspecting caller without transferring filesystem handles or tasks.
 *
 * @author Samchon
 */
export interface IAutoMovieEvidenceSyntaxAnnotation {

  /** Markdown heading or TypeScript documentation block that owns the row. */
  host: string;

  /** One-based source line where the declaration begins. */
  line: number;

  /** One-based source line containing the end of a wrapped declaration. */
  endLine: number;

  /** Joined declaration text beginning with its `@evidence` tag. */
  text: string;
}

/** A named admission refusal on an actually constructed geometry result.
 *
 * @evidence contracts/common.md#principled-implementation The admission owner and original cause identify an actual refusal of constructed geometry.
 * @evidence contracts/common.md#clear-and-simple-design A two-string result carries responsibility and cause; admission aggregation and geometry inspection remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Recording a failure changes neither the caller's original condition nor the rejected geometry to obtain acceptance.
 * @evidence contracts/common.md#meaningful-documentation The declaration and members identify the existing owner and unchanged cause rather than inventing a generic pass status.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Named construction failure pair is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Named construction failure pair specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Named construction failure pair acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 *
 * @author Samchon
 */
export interface IAutoMovieHumanConstructionFailure {
  /** Existing admission owner whose condition refused. */
  owner: string;

  /** Original reported cause, without changing the caller or geometry. */
  cause: string;
}

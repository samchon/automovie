/**
 * Regenerated witness of one nonzero source endpoint on one eye component.
 *
 * Only movements the producer actually regenerated are enrolled. A relevant
 * nonzero target without a witness is refused; zero-effect endpoints are
 * checked directly instead.
 *
 * @evidence contracts/common.md#principled-implementation Active eye/component and centre-landmark movements compare their exact sparse rows to the producer-enrolled endpoint witness; mathematically zero source rows pass the separate direct check.
 * @evidence contracts/common.md#clear-and-simple-design Endpoint name, component rows and pivot rows remain separate domains under the containing eye support.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An active relevant nonzero endpoint without matching rows refuses; a data-defined zero is not a clinical zero and source registration supplies no universal shape-motion qualification.
 * @evidence contracts/common.md#meaningful-documentation Native vertex versus landmark sparse-row ownership identifies the two exact comparisons and unchanged displacement units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The witness implements no endpoint selection or row filtering.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Persisted source rows do not implement evaluated-shape caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-owned sparse arrays create no posed eye buffers or tasks.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOpticalSupportTarget {
  /** Existing endpoint identity from the basis target domain. */
  id: string;

  /** Exact native sparse (vertex, dx, dy, dz) rows for this component. */
  surfaceRows: number[];

  /** Exact sparse landmark rows for the named eye's rigid centre landmark. */
  pivotRows: number[];
}

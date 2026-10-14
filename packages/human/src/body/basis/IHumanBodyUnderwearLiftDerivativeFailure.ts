/**
 * Located absence of an analytic derivative; never an acceptance override.
 *
 * @evidence contracts/common.md#principled-implementation Nullable component/source locations and an explicit domain or representability reason preserve why a lift derivative is unavailable.
 * @evidence contracts/common.md#clear-and-simple-design One failure carrier supports both triangle-corner and vertex-normal causes without manufacturing a replacement gradient.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing derivatives never override acceptance or authorize frozen-normal substitutes; absent locations remain null rather than invented indices.
 * @evidence contracts/common.md#meaningful-documentation Members identify local triangle/vertex, original cut correspondence and the actual preventing cause.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Derivative-failure typing performs no analytic differentiation or geometry-domain test.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Located failure metadata coordinates no reusable derivative result across candidate states.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar failure locations/reasons retain no failed solver task or derivative buffer.
 * @author Samchon
 */
export interface IHumanBodyUnderwearLiftDerivativeFailure {
  /** Component-local triangle, or null when a vertex-level normal fails. */
  triangle: number | null;

  /** Component-local vertex, or null when no corner owns the failure. */
  vertex: number | null;

  /** Original cut vertex when a local vertex is available. */
  sourceVertex: number | null;

  /** Actual domain or representability failure that prevented the derivative. */
  reason: string;
}

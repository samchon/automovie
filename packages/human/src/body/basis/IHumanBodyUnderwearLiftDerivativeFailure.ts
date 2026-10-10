/**
 * Located absence of an analytic derivative; never an acceptance override.
 *
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

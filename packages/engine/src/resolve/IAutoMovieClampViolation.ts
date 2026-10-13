/**
 * One component of a channel value that exceeded its bound and was clamped.
 *
 * @author Samchon
 */
export interface IAutoMovieClampViolation {
  /** Index of the offending component within the channel value vector. */
  component: number;

  /** Which bound was crossed. */
  bound: "min" | "max";

  /** The bound value the component was clamped to. */
  limit: number;

  /** The component's value before clamping. */
  actual: number;
}

/**
 * One forwarded operation observed by the caller-owned filesystem adapter. Argument values are borrowed, not deep snapshots; the owning unit checks operation routing only.
 *
 * @author Samchon
 */
export interface ITestFileSystemCall {
  /** String form of the property whose function was invoked. */
  operation: string;

  /** Arguments passed to that invocation; nested caller-owned values remain shared. */
  arguments: readonly unknown[];
}

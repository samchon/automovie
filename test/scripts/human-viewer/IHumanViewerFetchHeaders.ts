/**
 * The response headers a viewer client reads.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the one operation read.
 * @author Samchon
 */
export interface IHumanViewerFetchHeaders {
  /** A header's value, or null when absent. */
  get(name: string): string | null;
}

import type { IHumanViewerFetchHeaders } from "./IHumanViewerFetchHeaders";

/**
 * The part of an HTTP response a viewer client reads.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member read.
 * @author Samchon
 */
export interface IHumanViewerFetchResponse {
  /** Whether the status is 2xx. */
  ok: boolean;

  /** HTTP status code. */
  status: number;

  /** Response headers. */
  headers: IHumanViewerFetchHeaders;

  /** The body parsed as JSON. */
  json(): Promise<unknown>;

  /** The body bytes. */
  arrayBuffer(): Promise<ArrayBuffer>;
}

import type { IHumanViewerConstructionPartsResponse } from "./IHumanViewerConstructionPartsResponse";
import type { IHumanViewerPartEntry } from "./IHumanViewerPartEntry";

/**
 * The normal parts route preserves its preview array and adds a named
 * construction envelope carrying the owner's admission report. The client
 * returns mesh names from either representation without discarding the raw
 * construction report supplied by the HTTP route.
 *
 * @evidence contracts/common.md#clear-and-simple-design One response union names both supported operations for the producer and client.
 * @evidence contracts/common.md#meaningful-documentation States the existing array and explicit construction-envelope boundary.
 */
export type HumanViewerPartsResponse =
  | IHumanViewerPartEntry[]
  | IHumanViewerConstructionPartsResponse;

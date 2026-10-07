import type { HumanViewerAddress } from "./HumanViewerAddress";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue";
import type { IHumanViewerWarming } from "./IHumanViewerWarming";
import type { createHumanViewerQueue } from "./createHumanViewerQueue";

/**
 * The server state one warm pass over a source revision reads.
 *
 * @evidence contracts/common.md#clear-and-simple-design The server supplies its state through accessors; the pass holds none of it.
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface IWarmHumanViewerRevisionProps {
  /** Source revision to warm. */
  revision: string;

  /** The current catalogue. */
  inventory: () => IHumanViewerCatalogue;

  /** The generation the page can draw now. */
  readyRevision: () => string;

  /** Thumbnail file of a render query, or null when the query names no published document. */
  thumbnailFile: (search: string) => string | null;

  /** Draw one address on the resident page. */
  capture: (address: HumanViewerAddress) => Promise<Buffer>;

  /** The server's GPU queue. */
  queue: ReturnType<typeof createHumanViewerQueue>;

  /** Progress record `/health` reports. */
  warming: IHumanViewerWarming;
}

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Page } from "playwright";

import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import type { createHumanViewerCapture } from "./createHumanViewerCapture";
import type { createHumanViewerCaptureLifetime } from "./createHumanViewerCaptureLifetime";
import type { createHumanViewerQueue } from "./createHumanViewerQueue";
import type { createHumanViewerThumbnailStore } from "./createHumanViewerThumbnailStore";

/**
 * One request to a GPU route and the host state those routes use. State that
 * changes while the server runs is passed as accessors and read when used.
 *
 * @evidence contracts/common.md#clear-and-simple-design The host keeps page, generation and catalogue; the routes read them and own only request handling.
 * @evidence contracts/common.md#meaningful-documentation Names every input of the GPU routes.
 * @author Samchon
 */
export interface IServeHumanViewerCaptureProps {
  /** Parsed request URL. */
  url: URL;

  /** The request. */
  request: IncomingMessage;

  /** Its response. */
  response: ServerResponse;

  /** Answers with a JSON value. */
  json: (value: unknown) => void;

  /** Repository root, for measured pose files. */
  root: string;

  /** The GPU request queue. */
  queue: ReturnType<typeof createHumanViewerQueue>;

  /** Current catalogue. */
  inventory: () => HumanViewerCatalogue;

  /** Source generation the page has ready, empty while none is. */
  readyRevision: () => string;

  /** Renderer string of the page. */
  renderer: () => string;

  /** The resident GPU page. */
  page: () => Page;

  /** Dispatch ownership against renderer failure. */
  lifetime: ReturnType<typeof createHumanViewerCaptureLifetime>;

  /** The capture owner. */
  capture: ReturnType<typeof createHumanViewerCapture>;

  /** Waits until the page has a ready generation again. */
  settle: () => Promise<void>;

  /** Stored thumbnails, current and stale. */
  thumbnails: ReturnType<typeof createHumanViewerThumbnailStore>;

  /** Thumbnail file of a bulk render query, or null when it has none. */
  thumbnailFile: (search: string) => string | null;
}

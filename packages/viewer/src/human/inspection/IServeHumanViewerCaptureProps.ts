import type { IncomingMessage, ServerResponse } from "node:http";
import type { Page } from "playwright";

import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { createHumanViewerCapture } from "./createHumanViewerCapture.js";
import type { createHumanViewerCaptureLifetime } from "./createHumanViewerCaptureLifetime.js";
import type { createHumanViewerQueue } from "./createHumanViewerQueue.js";
import type { createHumanViewerThumbnailStore } from "./createHumanViewerThumbnailStore.js";

/**
 * One request to a GPU route and the host state those routes use. State that changes while the server runs is passed as accessors and read when used.
 *
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

  /**
   * Application-owned camera-pose example directory; file stems are admitted by the pose query adapter.
   */
  cameraPosesDirectory: string;

  /** The GPU request queue. */
  queue: ReturnType<typeof createHumanViewerQueue>;

  /** Current catalogue. */
  inventory: () => IHumanViewerCatalogue;

  /**
   * Demand admission for an explicitly requested document without settling unrelated inputs.
   */
  settleDocument?: (doc: string) => Promise<IHumanViewerCatalogue>;

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

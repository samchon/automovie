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
 * @evidence contracts/common.md#principled-implementation GPU routes read current catalogue, page and source authority through accessors at request time.
 * @evidence contracts/common.md#clear-and-simple-design The host owns queue, renderer lifetime, capture and thumbnail storage; the route borrows those owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Demand settlement can target one requested document without declaring unrelated inputs ready or relabelling stale captures.
 * @evidence contracts/common.md#meaningful-documentation Documents HTTP bindings, selected-document settlement, generation accessors and capture/thumbnail ownership.
 * @author Samchon
 */
export interface IServeHumanViewerCaptureProps {
  /** Parsed request URL. */
  url: URL;

  /** The request. */
  request: IncomingMessage;

  /** Its response. */
  response: ServerResponse;

  /**
   * Answers with a JSON value.
   *
   * @evidence contracts/common.md#principled-implementation Capture-route JSON output sends the route's own response value.
   * @evidence contracts/common.md#clear-and-simple-design The HTTP host owns serialization through one borrowed response operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A metadata response does not establish a completed GPU frame.
   * @evidence contracts/common.md#meaningful-documentation Defines the JSON response callback for this capture request.
   */
  json: (value: unknown) => void;

  /**
   * Application-owned camera-pose example directory; file stems are admitted by the pose query adapter.
   */
  cameraPosesDirectory: string;

  /** The GPU request queue. */
  queue: ReturnType<typeof createHumanViewerQueue>;

  /**
   * Current catalogue.
   *
   * @evidence contracts/common.md#principled-implementation Catalogue access reads the host's current inventory when GPU handling needs it.
   * @evidence contracts/common.md#clear-and-simple-design The route uses an accessor rather than retaining a snapshot across source changes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An old catalogue is not silently substituted for current document authority.
   * @evidence contracts/common.md#meaningful-documentation Names the current catalogue accessor.
   */
  inventory: () => IHumanViewerCatalogue;

  /**
   * Demand admission for an explicitly requested document without settling unrelated inputs.
   *
   * @evidence contracts/common.md#principled-implementation Targeted settlement awaits the requested document's actual admission and returns its catalogue.
   * @evidence contracts/common.md#clear-and-simple-design The host retains admission scheduling while the route specifies only one document.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The request does not wait for or certify unrelated input populations.
   * @evidence contracts/common.md#meaningful-documentation Defines optional demand settlement for the explicit document address.
   */
  settleDocument?: (doc: string) => Promise<IHumanViewerCatalogue>;

  /**
   * Source generation the page has ready, empty while none is.
   *
   * @evidence contracts/common.md#principled-implementation The generation accessor reports the revision the page can draw, or an empty value before readiness.
   * @evidence contracts/common.md#clear-and-simple-design Readiness stays with the page owner and is queried at route use time.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A serving source digest is not substituted for the page's drawable revision.
   * @evidence contracts/common.md#meaningful-documentation Documents the ready-generation value and pre-readiness empty state.
   */
  readyRevision: () => string;

  /**
   * Renderer string of the page.
   *
   * @evidence contracts/common.md#principled-implementation Renderer access forwards the actual renderer string recorded for the page.
   * @evidence contracts/common.md#clear-and-simple-design The host owns device observation while the route borrows its reading.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The accessor does not invent a hardware renderer from process or HTTP readiness.
   * @evidence contracts/common.md#meaningful-documentation Defines the resident page's renderer description.
   */
  renderer: () => string;

  /**
   * The resident GPU page.
   *
   * @evidence contracts/common.md#principled-implementation Page access returns the currently owned resident GPU page.
   * @evidence contracts/common.md#clear-and-simple-design The browser owner retains page lifetime while capture routes borrow its handle.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The route cannot select an unrelated session's page as its renderer.
   * @evidence contracts/common.md#meaningful-documentation Names the current resident GPU page accessor.
   */
  page: () => Page;

  /** Dispatch ownership against renderer failure. */
  lifetime: ReturnType<typeof createHumanViewerCaptureLifetime>;

  /** The capture owner. */
  capture: ReturnType<typeof createHumanViewerCapture>;

  /**
   * Waits until the page has a ready generation again.
   *
   * @evidence contracts/common.md#principled-implementation Settlement waits for the page owner's ready generation before capture continues.
   * @evidence contracts/common.md#clear-and-simple-design The host retains generation lifecycle while the route awaits one readiness operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An elapsed wait does not authorize cancellation or replace actual page readiness.
   * @evidence contracts/common.md#meaningful-documentation Defines the wait for a drawable page generation.
   */
  settle: () => Promise<void>;

  /** Stored thumbnails, current and stale. */
  thumbnails: ReturnType<typeof createHumanViewerThumbnailStore>;

  /**
   * Thumbnail file of a bulk render query, or null when it has none.
   *
   * @evidence contracts/common.md#principled-implementation Thumbnail lookup derives a path from the requested bulk-render search or returns null.
   * @evidence contracts/common.md#clear-and-simple-design The thumbnail owner retains key and persistence policy outside request handling.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unkeyed query stays null rather than using an unrelated cached picture.
   * @evidence contracts/common.md#meaningful-documentation Defines render-query lookup and the no-thumbnail result.
   */
  thumbnailFile: (search: string) => string | null;
}

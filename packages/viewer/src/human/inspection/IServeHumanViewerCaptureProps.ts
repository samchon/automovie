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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review GPU routes read current catalogue, page and source authority through accessors at request time.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The host owns queue, renderer lifetime, capture and thumbnail storage; the route borrows those owners.
 * @author Samchon
 */
export interface IServeHumanViewerCaptureProps {
  /**
   * Parsed request URL.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Parsed request URL. GPU routes read current catalogue, page and source authority through accessors at request time.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Parsed request URL. The host owns queue, renderer lifetime, capture and thumbnail storage; the route borrows those owners.
   */
  url: URL;

  /**
   * The request.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review The request. GPU routes read current catalogue, page and source authority through accessors at request time.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The request. The host owns queue, renderer lifetime, capture and thumbnail storage; the route borrows those owners.
   */
  request: IncomingMessage;

  /**
   * Its response.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Its response. GPU routes read current catalogue, page and source authority through accessors at request time.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Its response. The host owns queue, renderer lifetime, capture and thumbnail storage; the route borrows those owners.
   */
  response: ServerResponse;

  /**
   * Answers with a JSON value.
   *
   * @evidence contracts/common.md#principled-implementation Capture-route JSON output sends the route's own response value.
   * @evidence contracts/common.md#clear-and-simple-design The HTTP host owns serialization through one borrowed response operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A metadata response does not establish a completed GPU frame.
   * @evidence contracts/common.md#meaningful-documentation Defines the JSON response callback for this capture request.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Capture-route JSON output sends the route's own response value.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The HTTP host owns serialization through one borrowed response operation.
   */
  json: (value: unknown) => void;

  /**
   * Application-owned camera-pose example directory; file stems are admitted by the pose query adapter.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Application-owned camera-pose example directory; file stems are admitted by the pose query adapter. GPU routes read current catalogue, page and source authority through accessors at request time.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Application-owned camera-pose example directory; file stems are admitted by the pose query adapter. The host owns queue, renderer lifetime, capture and thumbnail storage; the route borrows those owners.
   */
  cameraPosesDirectory: string;

  /**
   * The GPU request queue.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The GPU request queue. GPU routes read current catalogue, page and source authority through accessors at request time.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The GPU request queue. The host owns queue, renderer lifetime, capture and thumbnail storage; the route borrows those owners.
   */
  queue: ReturnType<typeof createHumanViewerQueue>;

  /**
   * Current catalogue.
   *
   * @evidence contracts/common.md#principled-implementation Catalogue access reads the host's current inventory when GPU handling needs it.
   * @evidence contracts/common.md#clear-and-simple-design The route uses an accessor rather than retaining a snapshot across source changes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An old catalogue is not silently substituted for current document authority.
   * @evidence contracts/common.md#meaningful-documentation Names the current catalogue accessor.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Catalogue access reads the host's current inventory when GPU handling needs it.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The route uses an accessor rather than retaining a snapshot across source changes.
   */
  inventory: () => IHumanViewerCatalogue;

  /**
   * Demand admission for an explicitly requested document without settling unrelated inputs.
   *
   * @evidence contracts/common.md#principled-implementation Targeted settlement awaits the requested document's actual admission and returns its catalogue.
   * @evidence contracts/common.md#clear-and-simple-design The host retains admission scheduling while the route specifies only one document.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The request does not wait for or certify unrelated input populations.
   * @evidence contracts/common.md#meaningful-documentation Defines optional demand settlement for the explicit document address.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Targeted settlement awaits the requested document's actual admission and returns its catalogue.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The host retains admission scheduling while the route specifies only one document.
   */
  settleDocument?: (doc: string) => Promise<IHumanViewerCatalogue>;

  /**
   * Source generation the page has ready, empty while none is.
   *
   * @evidence contracts/common.md#principled-implementation The generation accessor reports the revision the page can draw, or an empty value before readiness.
   * @evidence contracts/common.md#clear-and-simple-design Readiness stays with the page owner and is queried at route use time.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A serving source digest is not substituted for the page's drawable revision.
   * @evidence contracts/common.md#meaningful-documentation Documents the ready-generation value and pre-readiness empty state.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale The generation accessor reports the revision the page can draw, or an empty value before readiness.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Readiness stays with the page owner and is queried at route use time.
   */
  readyRevision: () => string;

  /**
   * Renderer string of the page.
   *
   * @evidence contracts/common.md#principled-implementation Renderer access forwards the actual renderer string recorded for the page.
   * @evidence contracts/common.md#clear-and-simple-design The host owns device observation while the route borrows its reading.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The accessor does not invent a hardware renderer from process or HTTP readiness.
   * @evidence contracts/common.md#meaningful-documentation Defines the resident page's renderer description.
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-runtime-identity Renderer access forwards the actual renderer string recorded for the page.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-capture-runtime-identity The host owns device observation while the route borrows its reading.
   */
  renderer: () => string;

  /**
   * The resident GPU page.
   *
   * @evidence contracts/common.md#principled-implementation Page access returns the currently owned resident GPU page.
   * @evidence contracts/common.md#clear-and-simple-design The browser owner retains page lifetime while capture routes borrow its handle.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The route cannot select an unrelated session's page as its renderer.
   * @evidence contracts/common.md#meaningful-documentation Names the current resident GPU page accessor.
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Page access returns the currently owned resident GPU page.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation The browser owner retains page lifetime while capture routes borrow its handle.
   */
  page: () => Page;

  /**
   * Dispatch ownership against renderer failure.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Dispatch ownership against renderer failure. GPU routes read current catalogue, page and source authority through accessors at request time.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Dispatch ownership against renderer failure. The host owns queue, renderer lifetime, capture and thumbnail storage; the route borrows those owners.
   */
  lifetime: ReturnType<typeof createHumanViewerCaptureLifetime>;

  /**
   * The capture owner.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review The capture owner. GPU routes read current catalogue, page and source authority through accessors at request time.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The capture owner. The host owns queue, renderer lifetime, capture and thumbnail storage; the route borrows those owners.
   */
  capture: ReturnType<typeof createHumanViewerCapture>;

  /**
   * Waits until the page has a ready generation again.
   *
   * @evidence contracts/common.md#principled-implementation Settlement waits for the page owner's ready generation before capture continues.
   * @evidence contracts/common.md#clear-and-simple-design The host retains generation lifecycle while the route awaits one readiness operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An elapsed wait does not authorize cancellation or replace actual page readiness.
   * @evidence contracts/common.md#meaningful-documentation Defines the wait for a drawable page generation.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Settlement waits for the page owner's ready generation before capture continues.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The host retains generation lifecycle while the route awaits one readiness operation.
   */
  settle: () => Promise<void>;

  /**
   * Stored thumbnails, current and stale.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Stored thumbnails, current and stale. GPU routes read current catalogue, page and source authority through accessors at request time.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Stored thumbnails, current and stale. The host owns queue, renderer lifetime, capture and thumbnail storage; the route borrows those owners.
   */
  thumbnails: ReturnType<typeof createHumanViewerThumbnailStore>;

  /**
   * Thumbnail file of a bulk render query, or null when it has none.
   *
   * @evidence contracts/common.md#principled-implementation Thumbnail lookup derives a path from the requested bulk-render search or returns null.
   * @evidence contracts/common.md#clear-and-simple-design The thumbnail owner retains key and persistence policy outside request handling.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unkeyed query stays null rather than using an unrelated cached picture.
   * @evidence contracts/common.md#meaningful-documentation Defines render-query lookup and the no-thumbnail result.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-output-naming Thumbnail lookup derives a path from the requested bulk-render search or returns null.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The thumbnail owner retains key and persistence policy outside request handling.
   */
  thumbnailFile: (search: string) => string | null;
}

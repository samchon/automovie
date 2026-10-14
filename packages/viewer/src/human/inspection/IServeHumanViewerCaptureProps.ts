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
 * @evidence contracts/common.md#principled-implementation GPU-route dependencies bind the real response and capture lifetime to accessors for current catalogue, ready source generation and resident page.
 * @evidence contracts/common.md#clear-and-simple-design The route composes host-owned scheduling, capture, readiness and thumbnail services without retaining stale copies of mutable server state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit document admission stays separate from unrelated inputs; stale thumbnails are marked stale and generation-changed captures are refused.
 * @evidence contracts/common.md#meaningful-documentation Comments describe accessor freshness, selected-document settlement, camera-example ownership and dispatch ownership during renderer failure.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The route-props shape chooses no GPU capture, PNG composition or thumbnail pruning algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Thumbnail services key reuse by revision and document authority while current-state accessors prevent sharing frames across a changed generation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The server owns page, queue and capture lifetime; the adapter borrows them and holds its client binding until guarded task settlement, whose host reports do not independently measure OS/GPU termination.
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

  /**
   * Serialize and end this request's HTTP response with a JSON value.
   *
   * @evidence contracts/common.md#principled-implementation JSON response writing publishes the route's actual metadata or refusal through the request's HTTP response.
   * @evidence contracts/common.md#clear-and-simple-design The server supplies serialization so GPU routes compose values without owning another response-formatting layer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied value comes from current route state rather than a fixture-specific response body.
   * @evidence contracts/common.md#meaningful-documentation The member documents both JSON serialization and ending this response.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This response-writer signature chooses no JSON encoder or socket-buffering algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Writing one client's response is an individual effect that cannot be shared with another matching request.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The callback borrows the request's response; the HTTP server owns transport completion and cleanup.
   */
  json: (value: unknown) => void;

  /**
   * Application-owned camera-pose example directory; file stems are admitted by the pose query adapter.
   */
  cameraPosesDirectory: string;

  /** The GPU request queue. */
  queue: ReturnType<typeof createHumanViewerQueue>;

  /**
   * Return the latest published catalogue whenever the route checks source or document authority.
   *
   * @evidence contracts/common.md#principled-implementation Reading the latest catalogue detects inventory changes while queued or asynchronous capture work was running.
   * @evidence contracts/common.md#clear-and-simple-design An accessor avoids retaining one stale inventory snapshot in long-lived route dependencies.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The route does not assume the request's initially observed revision remains current through final response writing.
   * @evidence contracts/common.md#meaningful-documentation The comment specifies fresh published catalogue access at authority checks.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This accessor chooses no catalogue rebuilding or document lookup algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work The server shares its published catalogue until an input/source/admission update replaces it; callers re-read the accessor after awaited effects.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The catalogue remains server-owned; this read acquires no resident or worker handle.
   */
  inventory: () => IHumanViewerCatalogue;

  /**
   * Demand admission for an explicitly requested document without settling unrelated inputs.
   *
   * @evidence contracts/common.md#principled-implementation Selected-document settlement waits for that input's sidecars and owner verdict before GPU route admission.
   * @evidence contracts/common.md#clear-and-simple-design Optional selection settlement keeps request-specific readiness with catalogue ownership instead of scanning every unrelated candidate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The requested descriptor still requires its owner's verdict; unrelated failing inputs do not force guessed acceptance or global waiting.
   * @evidence contracts/common.md#meaningful-documentation The comment defines explicit-document admission and exclusion of unrelated-input settlement.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This capability specifies no selected-file indexing or admission scheduling implementation.
   * @evidence contracts/performance.md#reuse-equivalent-work The catalogue owner can reuse current stamped input facts and matching-key admission while the route awaits only its selected document.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Selected admission tasks remain with their background owners until settled; the route borrows the resulting catalogue.
   */
  settleDocument?: (doc: string) => Promise<IHumanViewerCatalogue>;

  /**
   * Return the page's current ready-source authority, or an empty string while none can draw.
   *
   * @evidence contracts/common.md#principled-implementation Ready-source authority identifies the page generation that can draw, separately from the server's desired inventory revision.
   * @evidence contracts/common.md#clear-and-simple-design A fresh readiness accessor lets routes compare generation identity before and after asynchronous capture phases.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty readiness is not replaced with a claim that the desired source generation has already displayed.
   * @evidence contracts/common.md#meaningful-documentation The member documents page authority and the empty-string no-drawable-generation state.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This readiness read selects no generation-witness or renderer observation algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work Capture output is accepted only under unchanged selected ready authority; inventory mismatch is labeled stale rather than current.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The authority string borrows residency state without taking ownership of the active browser page.
   */
  readyRevision: () => string;

  /**
   * Return the renderer identity reported by the resident page for capture metadata.
   *
   * @evidence contracts/common.md#principled-implementation Renderer metadata comes from the resident page's actual context report rather than from configured launch flags.
   * @evidence contracts/common.md#clear-and-simple-design The route borrows residency's reported renderer text; the capture owner and startup use judgeViewerRenderer for classification. Independent hardware and displayed-image observation remain separate obligations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A requested hardware backend is not substituted for the renderer actually observed by the page.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies observed renderer identity and its capture-metadata use.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The renderer-string accessor implements no GPU capability probe or rendering algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Renderer metadata does not establish equality of frame contents or source-generation authority.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reading an identity string owns no WebGL context and leaves renderer lifetime with the page.
   */
  renderer: () => string;

  /**
   * Return the current resident GPU page, including a replacement after renderer failure.
   *
   * @evidence contracts/common.md#principled-implementation Current-page access follows residency replacement so capture operations do not deliberately target a known failed page.
   * @evidence contracts/common.md#clear-and-simple-design The route asks for the page when dispatching instead of retaining a browser object captured at server startup.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A physically dead renderer is not reused merely because an old page reference remains available.
   * @evidence contracts/common.md#meaningful-documentation The comment specifies current resident access across renderer replacements.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This page accessor chooses no browser relaunch or CDP operation strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Sharing the resident page requires queue/lifetime ownership; retrieving the same page alone does not permit concurrent capture effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Residency owns browser/page closure; routes borrow the returned page only through guarded capture-lifetime operations.
   */
  page: () => Page;

  /** Dispatch ownership against renderer failure. */
  lifetime: ReturnType<typeof createHumanViewerCaptureLifetime>;

  /** The capture owner. */
  capture: ReturnType<typeof createHumanViewerCapture>;

  /**
   * Wait until a source generation can draw again, or reject an unrecoverable readiness failure.
   *
   * @evidence contracts/common.md#principled-implementation Generation settlement waits for actual page readiness after a source transition before another guarded GPU capture is attempted.
   * @evidence contracts/common.md#clear-and-simple-design Readiness waiting stays with the host, while the GPU route accounts for time spent waiting and retry limits.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A wait does not fabricate a successful capture or suppress an unrecoverable source/readiness error.
   * @evidence contracts/common.md#meaningful-documentation The member documents drawable-generation completion and rejection when readiness cannot recover.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This settlement capability specifies no browser polling frequency or source-generation scheduling algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A prior generation's settled state cannot satisfy a wait after that authority was replaced.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The route awaits readiness under its client/capture guards, leaving page generation tasks and cleanup with the host.
   */
  settle: () => Promise<void>;

  /** Stored thumbnails, current and stale. */
  thumbnails: ReturnType<typeof createHumanViewerThumbnailStore>;

  /**
   * Resolve a supported bulk-render query to its current thumbnail path, or null when the query has no thumbnail key.
   *
   * @evidence contracts/common.md#principled-implementation Thumbnail path resolution maps only supported render queries to revision/document-keyed storage, keeping uncachable queries explicit as null.
   * @evidence contracts/common.md#clear-and-simple-design The host owns thumbnail key construction while routes choose current cache, stale fallback or live capture.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported capture queries are not assigned a convenient thumbnail belonging to another view or document.
   * @evidence contracts/common.md#meaningful-documentation The member defines supported-query path resolution and the null no-thumbnail-key outcome.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This resolver signature chooses no query normalization or thumbnail digest algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work Current thumbnails require matching query, source revision and document key; stale fallback is reported separately by the store.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Resolving a path retains no PNG bytes or file stream; serving and thumbnail writing own subsequent I/O.
   */
  thumbnailFile: (search: string) => string | null;
}

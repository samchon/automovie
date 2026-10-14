import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { IHumanViewerWarming } from "./IHumanViewerWarming.js";
import type { createHumanViewerQueue } from "./createHumanViewerQueue.js";

/**
 * The server state one warm pass over a source revision reads.
 *
 * @evidence contracts/common.md#principled-implementation Revision warming combines a named source target with fresh catalogue/readiness accessors, revision-keyed thumbnail paths and the existing GPU queue.
 * @evidence contracts/common.md#clear-and-simple-design Host services own rendering and storage, while warmHumanViewerRevision constructs standard warm queries and forwards progress to its shared record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only published supported documents enter warming and source changes withdraw the pass rather than storing old output as newly current.
 * @evidence contracts/common.md#meaningful-documentation Comments define the target revision, current owner accessors, nullable thumbnail paths, captured PNG bytes and shared health progress.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Revision-warm props choose no published-document filter, capture or PNG serialization algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Thumbnail path identity combines the current inventory revision, document key and supported query before the host decides stored-result reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources These bindings borrow the server's queue, page capture and warming record without acquiring independent browser resources.
 *
 * @author Samchon
 */
export interface IWarmHumanViewerRevisionProps {
  /** Source revision to warm. */
  revision: string;

  /**
   * Return the current catalogue used to choose published warm documents.
   *
   * @evidence contracts/common.md#principled-implementation Warm-document selection reads the host's published catalogue rather than a separately maintained example list.
   * @evidence contracts/common.md#clear-and-simple-design Catalogue discovery remains host-owned while revision warming selects its supported entries.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Warming does not manufacture drawable entries for pending or refused descriptors missing from the published list.
   * @evidence contracts/common.md#meaningful-documentation The member identifies the current catalogue and its warm-document selection purpose.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This inventory query chooses no publication or document-enumeration algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work The host shares its current catalogue snapshot until source/input/admission publication replaces it; the pass owns its selected target revision.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowing catalogue metadata acquires no numerical resident, browser page or storage stream.
   */
  inventory: () => IHumanViewerCatalogue;

  /**
   * Return the page's current drawable source authority for warm-pass withdrawal.
   *
   * @evidence contracts/common.md#principled-implementation Revision warming uses actual page readiness to stop submitting items when its selected source generation is no longer drawable.
   * @evidence contracts/common.md#clear-and-simple-design The ready-source query is supplied by residency instead of inferred from catalogue revision alone.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Desired inventory authority does not certify that the resident page already runs or can draw that code.
   * @evidence contracts/common.md#meaningful-documentation The comment states current drawable source authority and its withdrawal use.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This readiness accessor selects no generation-replacement or hardware-admission implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A previous page's readiness cannot authorize continued warming after its generation was withdrawn.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ready authority is borrowed text and carries no page-generation lifetime handle.
   */
  readyRevision: () => string;

  /**
   * Thumbnail file of a render query, or null when the query names no published document.
   *
   * @evidence contracts/common.md#principled-implementation Supported render queries map to current revision/document-keyed thumbnail files; unavailable query authority remains null.
   * @evidence contracts/common.md#clear-and-simple-design The host resolves storage keys while the revision warmer uses only the resulting path or absence.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unsupported query is not redirected to an unrelated document's thumbnail or an unmarked older source image.
   * @evidence contracts/common.md#meaningful-documentation The comment defines render-query lookup and null for a query without a published supported document.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This path resolver specifies no query parser or thumbnail digest algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work Path equality is useful only under the host's source/document/query key policy; stale-revision fallback remains a distinct display result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A resolved filename owns no image buffer or stream and leaves disk-file retention with thumbnail storage.
   */
  thumbnailFile: (search: string) => string | null;

  /**
   * Draw one admitted address on the resident page and return its completed PNG bytes.
   *
   * @evidence contracts/common.md#principled-implementation Capture uses the existing product page and its completed-frame checks for the exact warm address.
   * @evidence contracts/common.md#clear-and-simple-design The revision warmer receives PNG bytes while the capture owner retains source proof, model residency and renderer error handling.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Warming does not substitute an expected image or accept a generation-changed frame as current capture output.
   * @evidence contracts/common.md#meaningful-documentation The member documents admitted address capture and completed PNG-buffer delivery.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The capture signature chooses no rendering, readback or PNG encoding implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The capture mutates one shared page and runs under the host queue; cached-thumbnail equivalence is checked before scheduling it.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The capture owner holds renderer dispatch until settlement and the caller owns returned PNG bytes through the awaited thumbnail write.
   */
  capture: (address: HumanViewerAddress) => Promise<Buffer>;

  /** The server's GPU queue. */
  queue: ReturnType<typeof createHumanViewerQueue>;

  /** Progress record `/health` reports. */
  warming: IHumanViewerWarming;
}

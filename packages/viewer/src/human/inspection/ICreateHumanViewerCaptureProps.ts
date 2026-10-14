import type { Page } from "playwright";

import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { createHumanViewerCaptureLifetime } from "./createHumanViewerCaptureLifetime.js";
import type { createHumanViewerStageWatch } from "./createHumanViewerStageWatch.js";

/**
 * The host state one capture reads. Each member is read at capture time because the page, renderer, generation and catalogue all change while the server runs.
 *
 * @evidence contracts/common.md#principled-implementation Capture reads current page, reported renderer and revision authority, then runs room/page/trim through supplied lifetime and stage owners.
 * @evidence contracts/common.md#clear-and-simple-design Keeps GPU capture orchestration separate from catalogue, source-generation, renderer recovery and heap-accounting responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reported renderer classification and nonempty readiness are admission checks, not independent hardware or appearance proof; changed generation discards the frame.
 * @evidence contracts/common.md#meaningful-documentation Identifies live callbacks, borrowed page, independent stage/lifetime ownership and measured room estimates rather than guaranteed physical memory release.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record executes no capture; its consumer performs one document lookup, actual numerical/GPU work, PNG decode and build-record pruning.
 * @evidence contracts/performance.md#reuse-equivalent-work Live source readings are intentionally repeated across asynchronous phases; capture effects are not shared merely because address or revision strings match.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns page and supplied services; capture tasks stay owned until settlement, while telemetry retains one render and latest last-catalogue document/domain records.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerCaptureProps {
  /**
   * The resident GPU page.
   *
   * @evidence contracts/common.md#principled-implementation Returns the existing Playwright page used by readHumanViewerCapture to call the actual viewer capture bridge.
   * @evidence contracts/common.md#clear-and-simple-design Keeps browser selection and launch outside capture telemetry and PNG decoding.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A page reference does not certify its loaded source or display; revision and renderer admission are checked separately.
   * @evidence contracts/common.md#meaningful-documentation Reads the current page during dispatch; the caller must supply a live owned page rather than a stale startup reference.
   * @evidence contracts/performance.md#efficient-algorithms One page lookup precedes bridge evaluation; browser capture and encoding dominate rather than this handle access.
   * @evidence contracts/performance.md#reuse-equivalent-work The browser page is reused by the host; a source generation change still invalidates the individual frame even on the same page.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned handle is borrowed and is not closed by capture; page retirement belongs to the host and dispatched work remains under capture lifetime.
   */
  page: () => Page;

  /**
   * Renderer string, empty while the page starts.
   *
   * @evidence contracts/common.md#principled-implementation Supplies the page's reported WebGL renderer string for nonempty and judgeViewerRenderer classification before capture.
   * @evidence contracts/common.md#clear-and-simple-design Exposes the existing renderer observation without making the capture service query a second graphics context.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A classifier-approved string is not independent hardware observation; gl.RENDERER fallback can omit unmasked device identity.
   * @evidence contracts/common.md#meaningful-documentation Empty text produces a starting refusal; the existing classifier may refuse software renderer text, while visual validity still needs actual display observation.
   * @evidence contracts/performance.md#efficient-algorithms String trimming and classification scale with renderer text length; no mesh or image scan occurs in this callback contract.
   * @evidence contracts/performance.md#reuse-equivalent-work The host can reuse its observed renderer description, but readiness and generation are checked independently for every capture.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only a borrowed string is returned; context lifetime and recovery remain with the page owner and this reading acquires no GPU resource.
   */
  renderer: () => string;

  /**
   * What the server is doing while it starts, for the refusal a capture gets meanwhile.
   *
   * @evidence contracts/common.md#principled-implementation Reads the current startup explanation used when renderer or ready-source authority is absent.
   * @evidence contracts/common.md#clear-and-simple-design Keeps human-readable startup cause with the host state rather than encoding it in revision strings.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The reason describes observed startup state; it cannot turn missing readiness into success or an elapsed-age timeout.
   * @evidence contracts/common.md#meaningful-documentation The capture includes this text in HumanViewerStartingError so callers can distinguish temporary startup from domain admission failure.
   * @evidence contracts/performance.md#efficient-algorithms One text read occurs on a refusal branch; capture performs no retry loop or catalogue scan to obtain it.
   * @evidence contracts/performance.md#reuse-equivalent-work The callback refreshes the explanation at refusal time rather than reusing a fixed launch message after state changed.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The reason is retained only by its returned error/caller; browser processes and startup tasks remain owned by the host.
   */
  startup: () => string;

  /**
   * Source generation the page has ready, empty while none is.
   *
   * @evidence contracts/common.md#principled-implementation Reads the source generation the page currently reports ready and compares it across capture and final trimming.
   * @evidence contracts/common.md#clear-and-simple-design Separates loaded-code authority from the server inventory's latest source revision.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty authority refuses immediately; a changed value discards the mixed frame rather than labeling it current.
   * @evidence contracts/common.md#meaningful-documentation This is page readiness evidence, not geometry or hardware proof; the consumer preserves the selected value across asynchronous phases.
   * @evidence contracts/performance.md#efficient-algorithms A fixed number of string reads/comparisons surrounds capture; their cost follows revision length rather than model size.
   * @evidence contracts/performance.md#reuse-equivalent-work Same-generation state is compared at each boundary because retaining a pre-dispatch value alone cannot prove current source after awaits.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback returns scalar authority and owns no compilation hold; generation/window and page lifetime remain supplied services.
   */
  readyRevision: () => string;

  /**
   * The catalogue revision the ready page itself reports, which a capture checks it is still showing.
   *
   * @evidence contracts/common.md#principled-implementation Provides the ready page's catalogue revision to readHumanViewerCapture, which checks that the page is showing the requested inventory authority.
   * @evidence contracts/common.md#clear-and-simple-design Keeps document catalogue identity separate from loaded-code readyRevision.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A server inventory revision cannot substitute for the page's actual reported catalogue; bridge checks may reject mismatched state.
   * @evidence contracts/common.md#meaningful-documentation Called at page dispatch so the bridge receives the current page-owned catalogue token, not the initial inventory snapshot's token.
   * @evidence contracts/performance.md#efficient-algorithms One revision read accompanies bridge evaluation; actual show and PNG work remain with the viewer page.
   * @evidence contracts/performance.md#reuse-equivalent-work The page can keep its current catalogue token, but every dispatch reads it again after prior room-making awaits.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned string retains no page handle; the host owns catalogue replacement and bridge lifetime.
   */
  pageRevision: () => string;

  /**
   * Current catalogue.
   *
   * @evidence contracts/common.md#principled-implementation Returns the server's current catalogue for document domain selection and current-source edit timing.
   * @evidence contracts/common.md#clear-and-simple-design Supplies existing source inventory rather than making GPU capture enumerate disk documents itself.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The consumer keeps its initial captured catalogue for build-record pruning and separately rereads current revision before consuming edit timing.
   * @evidence contracts/common.md#meaningful-documentation Documents and revision are borrowed snapshot facts; this callback does not imply every listed document has already been rendered.
   * @evidence contracts/performance.md#efficient-algorithms Access cost belongs to the inventory owner; the consumer scans documents once to find the domain and once to collect current ids for pruning.
   * @evidence contracts/performance.md#reuse-equivalent-work The initial snapshot is reused for domain and retained-build membership; later revision access intentionally refreshes source authority.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Catalogue documents have input-sized population with host replacement ownership; capture retains only latest records for ids in its last captured catalogue.
   */
  inventory: () => IHumanViewerCatalogue;

  /** Dispatch ownership against renderer failure. */
  lifetime: ReturnType<typeof createHumanViewerCaptureLifetime>;

  /**
   * Attempt to reduce the renderer's heap after a capture; non-evictable residents and borrowed workers can leave it above the limit.
   *
   * @evidence contracts/common.md#principled-implementation Runs the host's existing post-capture heap trimming under capture lifetime and stage tracking.
   * @evidence contracts/common.md#clear-and-simple-design Keeps renderer budget policy outside frame telemetry while awaiting its actual completion before final revision admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Trimming does not guarantee immediate garbage collection or physical GPU release; a rejection remains a capture failure with its cause.
   * @evidence contracts/common.md#meaningful-documentation Called after page capture inside its queue ownership; source authority is checked again after the trim promise settles.
   * @evidence contracts/performance.md#efficient-algorithms Cost depends on measured heap and selected resident evictions; the capture adds one awaited trim phase rather than scanning resources itself.
   * @evidence contracts/performance.md#reuse-equivalent-work Each capture preserves this effectful budget operation; equal frames or keys do not justify skipping physical retirement work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned task remains owned until settlement; heap/cache owners retain failed physical retirements rather than treating logical eviction as release.
   */
  trim: () => Promise<void>;

  /**
   * Make room for a capture of this domain before it runs.
   *
   * @evidence contracts/common.md#principled-implementation Asks the existing heap owner to prepare predicted transient capacity for the selected face/body/person domain before page capture.
   * @evidence contracts/common.md#clear-and-simple-design Uses the catalogue-selected domain to delegate accounting policy without duplicating numerical model construction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A room estimate is not a reserved GPU allocation or proof of later capacity; failed preparation refuses before dispatch.
   * @evidence contracts/common.md#meaningful-documentation The consumer calls this only when the requested document has a known initial catalogue domain, under lifetime and room-stage ownership.
   * @evidence contracts/performance.md#efficient-algorithms Budget inspection and eviction costs belong to the heap owner and its retained residents; this callback receives one closed-set domain.
   * @evidence contracts/performance.md#reuse-equivalent-work Domain peak observations may inform the next estimate, but each requested capture still executes the needed room-making effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The task remains tracked until it settles; resident/cache retirement is owned by the heap service, not by this type or a speculative model.
   */
  makeRoom: (domain: "face" | "body" | "person") => Promise<void>;

  /**
   * Learn the room a capture of this domain took.
   *
   * @evidence contracts/common.md#principled-implementation Records the heap owner's observed capture peak for the initial catalogue domain after the page reply.
   * @evidence contracts/common.md#clear-and-simple-design Returns measured room feedback to the existing budget owner rather than fitting a second capture estimator.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The update occurs before final source/trim checks, so it records observed resource use even if the frame is later discarded.
   * @evidence contracts/common.md#meaningful-documentation The domain identifies the prior room request; this void notification is measurement feedback, not admission or a physical release guarantee.
   * @evidence contracts/performance.md#efficient-algorithms Updates one domain observation; heap measurement cost belongs to the host, with no document scan required by this signature.
   * @evidence contracts/performance.md#reuse-equivalent-work Recorded domain peaks may be reused for subsequent room estimates; no captured geometry or PNG is cached by this callback.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The budget owner retains its bounded domain estimates; the callback retains no frame bytes or new task once the synchronous update returns.
   */
  learnRoom: (domain: "face" | "body" | "person") => void;

  /**
   * The existing capture-stage owner, reporting each actual stage and progress observation without an elapsed-age cancellation limit.
   */
  stages: ReturnType<typeof createHumanViewerStageWatch>;
}

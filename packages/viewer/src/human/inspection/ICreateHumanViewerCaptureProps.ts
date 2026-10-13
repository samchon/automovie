import type { Page } from "playwright";

import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { createHumanViewerCaptureLifetime } from "./createHumanViewerCaptureLifetime.js";
import type { createHumanViewerStageWatch } from "./createHumanViewerStageWatch.js";

/**
 * The host state one capture reads. Each member is read at capture time
 * because the page, renderer, generation and catalogue all change while the
 * server runs.
 *
 * @evidence contracts/common.md#clear-and-simple-design The host keeps its state; the capture owner reads it through these accessors.
 * @evidence contracts/common.md#meaningful-documentation States why every member is an accessor.
 *
 * @evidence contracts/common.md#principled-implementation Live page, ready revision and catalogue accessors let a capture compare its selected generation against the owner after drawing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Heap preparation, capture lifetime and trim are the supplied owners rather than document-specific memory guesses.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Live page, ready revision and catalogue accessors let a capture compare its selected generation against the owner after drawing.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Heap preparation, capture lifetime and trim are the supplied owners rather than document-specific memory guesses.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerCaptureProps {
  /**
   * The resident GPU page.
   *
   * @evidence contracts/common.md#principled-implementation Capture reads the host's current resident GPU page at execution time.
   * @evidence contracts/common.md#clear-and-simple-design Page lifetime stays with residency and is borrowed by the capture owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The accessor does not substitute a screenshot fixture or start another renderer.
   * @evidence contracts/common.md#meaningful-documentation The returned page is the one against which current revision and renderer checks apply.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Capture reads the host's current resident GPU page at execution time.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The returned page is the one against which current revision and renderer checks apply.
   */
  page: () => Page;

  /**
   * Renderer string, empty while the page starts.
   *
   * @evidence contracts/common.md#principled-implementation The current device string is read before hardware-only capture admission.
   * @evidence contracts/common.md#clear-and-simple-design Device state belongs to the host rather than the capture's own cached copy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty string remains startup state and a software device is refused by the capture owner.
   * @evidence contracts/common.md#meaningful-documentation The contract identifies the device string and its empty startup representation.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The current device string is read before hardware-only capture admission.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The contract identifies the device string and its empty startup representation.
   */
  renderer: () => string;

  /**
   * What the server is doing while it starts, for the refusal a capture gets meanwhile.
   *
   * @evidence contracts/common.md#principled-implementation The current startup phase supplies the cause of a capture's temporary refusal.
   * @evidence contracts/common.md#clear-and-simple-design The phase is borrowed from the startup owner without driving its transitions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A pending startup explanation does not manufacture readiness or permit an age-based restart.
   * @evidence contracts/common.md#meaningful-documentation The string explains what the server is doing while capture cannot yet run.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The current startup phase supplies the cause of a capture's temporary refusal.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The string explains what the server is doing while capture cannot yet run.
   */
  startup: () => string;

  /**
   * Source generation the page has ready, empty while none is.
   *
   * @evidence contracts/common.md#principled-implementation The accessor identifies the actual source generation the page can draw now.
   * @evidence contracts/common.md#clear-and-simple-design Readiness remains distinct from the host's current catalogue revision.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed newer build cannot replace the retained page generation's identity.
   * @evidence contracts/common.md#meaningful-documentation An empty result means no drawable source generation is ready.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The accessor identifies the actual source generation the page can draw now.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach An empty result means no drawable source generation is ready.
   */
  readyRevision: () => string;

  /**
   * The catalogue revision the ready page itself reports, which a capture checks it is still showing.
   *
   * @evidence contracts/common.md#principled-implementation The page's own reported catalogue revision supplies the capture's display identity check.
   * @evidence contracts/common.md#clear-and-simple-design The page reading is kept separate from the server's elected ready-generation label.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Capture cannot use a later catalogue revision as proof the page loaded it.
   * @evidence contracts/common.md#meaningful-documentation The value is the revision the ready page itself reports while showing the frame.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The page's own reported catalogue revision supplies the capture's display identity check.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The value is the revision the ready page itself reports while showing the frame.
   */
  pageRevision: () => string;

  /**
   * Current catalogue.
   *
   * @evidence contracts/common.md#principled-implementation Capture reads the live catalogue used to identify the selected document's domain.
   * @evidence contracts/common.md#clear-and-simple-design Catalogue state remains owned by publication and is borrowed when the capture begins.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown document membership cannot trigger a guessed domain-specific reserve.
   * @evidence contracts/common.md#meaningful-documentation The result is the current full inventory, not a cached catalogue from construction time.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Capture reads the live catalogue used to identify the selected document's domain.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The result is the current full inventory, not a cached catalogue from construction time.
   */
  inventory: () => IHumanViewerCatalogue;

  /**
   * Dispatch ownership against renderer failure.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Binds dispatched capture work to the actual renderer-failure settlement owner rather than an elapsed deadline.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Binds dispatched capture work to the actual renderer-failure settlement owner rather than an elapsed deadline.
   */
  lifetime: ReturnType<typeof createHumanViewerCaptureLifetime>;

  /**
   * Keep the renderer's heap under its limit after a capture.
   *
   * @evidence contracts/common.md#principled-implementation The supplied heap owner releases non-displayed residents after capture inside the GPU queue slot.
   * @evidence contracts/common.md#clear-and-simple-design Capture delegates memory policy instead of duplicating release selection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The shown resident is preserved by the page eviction owner rather than cancelled by capture age.
   * @evidence contracts/common.md#meaningful-documentation The promise completes the post-capture heap trim and propagates its actual failure.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The supplied heap owner releases non-displayed residents after capture inside the GPU queue slot.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The promise completes the post-capture heap trim and propagates its actual failure.
   */
  trim: () => Promise<void>;

  /**
   * Make room for a capture of this domain before it runs.
   *
   * @evidence contracts/common.md#principled-implementation The heap owner reserves measured transient room for the selected face, body or Person build before drawing.
   * @evidence contracts/common.md#clear-and-simple-design Per-domain room policy is delegated to the existing trim owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The operation uses measured reserve growth rather than special sizes for named documents.
   * @evidence contracts/common.md#meaningful-documentation The promise completes preparation before numerical build and GPU capture begin.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The heap owner reserves measured transient room for the selected face, body or Person build before drawing.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The promise completes preparation before numerical build and GPU capture begin.
   */
  makeRoom: (domain: "face" | "body" | "person") => Promise<void>;

  /**
   * Learn the room a capture of this domain took.
   *
   * @evidence contracts/common.md#principled-implementation The trim owner receives the captured domain after the page operation supplies its actual transient samples.
   * @evidence contracts/common.md#clear-and-simple-design Reserve learning remains with the heap policy that consumed the starting sample.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The domain label selects a measured history rather than a guessed model memory constant.
   * @evidence contracts/common.md#meaningful-documentation The notification updates the learned capture room for that numerical domain.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The trim owner receives the captured domain after the page operation supplies its actual transient samples.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The notification updates the learned capture room for that numerical domain.
   */
  learnRoom: (domain: "face" | "body" | "person") => void;

  /**
   * The existing capture-stage owner, reporting each actual stage and progress observation without an elapsed-age cancellation limit.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Reports room preparation, drawing and trim progress through the existing capture-stage owner without changing result authority.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Reports room preparation, drawing and trim progress through the existing capture-stage owner without changing result authority.
   */
  stages: ReturnType<typeof createHumanViewerStageWatch>;
}

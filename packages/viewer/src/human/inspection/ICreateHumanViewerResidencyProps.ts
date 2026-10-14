import type { HumanViewerWork } from "./HumanViewerWork.js";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { createHumanViewerCaptureLifetime } from "./createHumanViewerCaptureLifetime.js";

/**
 * Bind one browser lifetime to the host's source and capture owners. Callbacks read their live owners after construction, because GPU observers begin only when the server opens its page.
 *
 * @evidence contracts/common.md#principled-implementation The browser owner reads host inventory and forwards actual page console/frame observations through existing capture, heap and admission callbacks.
 * @evidence contracts/common.md#clear-and-simple-design Groups loopback origin and live host bindings while keeping browser acquisition, renderer observation and replacement with createHumanViewerResidency.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current-source readiness differs from reported renderer identity; callback wiring alone proves neither display validity nor physical old-page settlement.
 * @evidence contracts/common.md#meaningful-documentation Defines live inventory, startup phases, observed progress and explicit admission retry triggers, with capture lifetime owned separately from browser launch.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The bindings perform no browser query; their consumer installs observers and invokes actual page/heap operations.
 * @evidence contracts/performance.md#reuse-equivalent-work One host inventory/lifetime is shared across openings; obsolete resident observations are ignored rather than authorizing a replacement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One current browser resident is intended, errors are uncapped and recovery tasks may remain pending; the browser owner must retire actual native resources, not infer release from status.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerResidencyProps {
  /** Public loopback origin the resident browser opens. */
  origin: string;

  /**
   * Complete host inventory, whose revision labels ready generations.
   *
   * @evidence contracts/common.md#principled-implementation Reads the complete current host catalogue to compare a ready candidate's proven source label with current revision.
   * @evidence contracts/common.md#clear-and-simple-design Leaves source and document publication with the catalogue controller rather than copying a startup revision into browser state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A ready but stale or unproven label cannot warm current-source thumbnails; equality is checked against the live inventory.
   * @evidence contracts/common.md#meaningful-documentation Called during ready console handling; catalogue identity is distinct from the page's own ready-code and shown-catalogue tokens.
   * @evidence contracts/performance.md#efficient-algorithms The callback returns existing inventory and the consumer compares revision text without traversing document geometry.
   * @evidence contracts/performance.md#reuse-equivalent-work The published snapshot may be reused by its host until replacement, while each ready event refreshes the current comparison.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a borrowed catalogue; inventory replacement and document retention belong to the host, not a second browser-owned store.
   */
  inventory: () => IHumanViewerCatalogue;

  /**
   * Republish availability after reload or renderer failure.
   *
   * @evidence contracts/common.md#principled-implementation Asks the host to republish availability when the page reloads, renderer recovery starts or replacement permanently fails.
   * @evidence contracts/common.md#clear-and-simple-design Keeps catalogue publication in its existing controller instead of coupling browser recovery to a new route or page reload command.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A notification reports changed availability; it does not assert successful recovery or admit documents by itself.
   * @evidence contracts/common.md#meaningful-documentation Readers can observe waiting/failure cause after publication while browser recovery proceeds under its actual owner.
   * @evidence contracts/performance.md#efficient-algorithms One notification occurs at each availability transition; the controller's complete inventory publication owns catalogue-sized work.
   * @evidence contracts/performance.md#reuse-equivalent-work Host publication can coalesce transition notifications, but physical browser recovery is not merged or completed by equal status text.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback retains only host publication access; page handles and recovery tasks remain with the browser owner until actual cleanup.
   */
  publish: () => void;

  /** Capture cancellation owner renewed after the failed Page's close completion; this public boundary is not independent OS/GPU termination proof. */
  lifetime: ReturnType<typeof createHumanViewerCaptureLifetime>;

  /**
   * Report the first opening's startup phases.
   *
   * @evidence contracts/common.md#principled-implementation Reports first-opening startup steps when loading the page and waiting for the initial source generation.
   * @evidence contracts/common.md#clear-and-simple-design Keeps startup status text with the host while replacement waits use the browser owner's pageWait state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Phase text is observed activity rather than a progress percentage or elapsed-age cancellation policy.
   * @evidence contracts/common.md#meaningful-documentation The argument names an actual startup operation; later reopenings do not reuse first-opening phase reporting.
   * @evidence contracts/performance.md#efficient-algorithms Two fixed startup notifications accompany page navigation/readiness work, whose browser/compile costs dominate.
   * @evidence contracts/performance.md#reuse-equivalent-work The first-opening host status is reused for startup reporting only; source-ready and recovery observations use their own live state.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no navigation task or browser handle; startup and browser completion remain owned by the residency service.
   */
  phase: (name: string) => void;

  /**
   * Forward numerical progress to the running capture stage.
   *
   * @evidence contracts/common.md#principled-implementation Announces an actual page work message after readHumanViewerWork updates the current browser-owned work record.
   * @evidence contracts/common.md#clear-and-simple-design Notifies the existing capture-stage owner separately from forwarding the work value to heap sampling.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Notification can arrive after an unrecognized message yields null work; it is not itself a successful numerical milestone.
   * @evidence contracts/common.md#meaningful-documentation The host reads current work on notification, without a fabricated planned denominator or timer-based completion estimate.
   * @evidence contracts/performance.md#efficient-algorithms One notification per work console event adds constant coordination; real event frequency belongs to numerical execution.
   * @evidence contracts/performance.md#reuse-equivalent-work Latest work is shared through the resident owner, while every observed event can advance the stage observation independently.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback owns no work task; actual numerical completion and capture lifetime remain their owners' responsibility.
   */
  progress: () => void;

  /**
   * Sample numerical work through the existing heap gauge.
   *
   * @evidence contracts/common.md#principled-implementation Forwards a parsed non-null work observation to the existing heap gauge to sample actual numerical execution.
   * @evidence contracts/common.md#clear-and-simple-design Keeps memory observation separate from phase notification and numerical request ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The observation identifies work rather than total process memory or guaranteed available heap; sampling cannot manufacture physical release.
   * @evidence contracts/common.md#meaningful-documentation Receives HumanViewerWork after console parsing, including optional measured completion detail and its own timestamp meaning.
   * @evidence contracts/performance.md#efficient-algorithms Sampling cost follows the heap gauge and event rate; the browser adapter forwards a record without traversing models.
   * @evidence contracts/performance.md#reuse-equivalent-work The gauge may aggregate observed peaks for one capture; work identity does not authorize numerical result reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The gauge owns its samples/window lifetime; this callback retains no typed model arrays or native worker handle.
   */
  sample: (work: HumanViewerWork) => void;

  /**
   * Announce a proven current-code generation to thumbnail warming.
   *
   * @evidence contracts/common.md#principled-implementation Notifies thumbnail warming only when the ready candidate's proven source label equals the current host inventory revision.
   * @evidence contracts/common.md#clear-and-simple-design Keeps background warming with its owner rather than starting numerical builds in the browser residency service.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Stale and unproven source labels skip this callback; revision equality still does not certify hardware or appearance.
   * @evidence contracts/common.md#meaningful-documentation The revision argument is the current proven ready-code token observed from that resident, not the server's future source intent.
   * @evidence contracts/performance.md#efficient-algorithms One notification accompanies a matching ready event; any warming traversal/build cost belongs to the background owner.
   * @evidence contracts/performance.md#reuse-equivalent-work The warming owner decides current-key reuse; an equal revision alone cannot equate changed document/basis keys.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback acquires no model; warming tasks/cache entries remain with their own queue and retention owners.
   */
  sourceReady: (revision: string) => void;

  /**
   * Reconsider pending admissions after a frame or generation becomes ready.
   *
   * @evidence contracts/common.md#principled-implementation Triggers explicit reconsideration when a generation reports ready or an admission frame announces it has loaded.
   * @evidence contracts/common.md#clear-and-simple-design Leaves keyed admission judgments in the admission service and passes an explanatory trigger to its host.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retry clears pending reasons rather than replaying refused verdicts or silently looping on unavailable page transport.
   * @evidence contracts/common.md#meaningful-documentation The trigger identifies the observed generation/frame event; documents still need an actual domain-owner reply.
   * @evidence contracts/performance.md#efficient-algorithms The callback's host may scan waiting admissions and refresh the catalogue; the event dispatch itself performs no document parsing.
   * @evidence contracts/performance.md#reuse-equivalent-work Existing equal-key verdicts remain reusable, while only waiting state is reconsidered after an actual readiness event.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Admission tasks and verdict maps remain with their service; browser notification creates no independent retry timer or unbounded task loop.
   */
  retryAdmissions: (trigger: string) => void;
}

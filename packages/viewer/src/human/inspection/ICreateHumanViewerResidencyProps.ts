import type { HumanViewerWork } from "./HumanViewerWork.js";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { createHumanViewerCaptureLifetime } from "./createHumanViewerCaptureLifetime.js";

/**
 * Bind one browser lifetime to the host's source and capture owners. Callbacks
 * read their live owners after construction, because GPU observers begin only
 * when the server opens its page.
 *
 * @evidence contracts/common.md#principled-implementation Live source and capture callbacks bind browser startup, work progress and ready publication to the host's existing lifetime owners.
 * @evidence contracts/common.md#clear-and-simple-design The residency owner receives state accessors and notifications instead of duplicating catalogue or capture state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source readiness is reported by revision and admissions retried through host triggers, without an elapsed-age restart policy.
 * @evidence contracts/common.md#meaningful-documentation Origin, inventory, startup phases, work sampling and ready/admission notifications each name their owning boundary.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Live source and capture callbacks bind browser startup, work progress and ready publication to the host's existing lifetime owners.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Source readiness is reported by revision and admissions retried through host triggers, without an elapsed-age restart policy.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerResidencyProps {
  /**
   * Public loopback origin the resident browser opens.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Opens this host's current inspection application at its selected loopback origin.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Opens this host's current inspection application at its selected loopback origin.
   */
  origin: string;

  /**
   * Complete host inventory, whose revision labels ready generations.
   *
   * @evidence contracts/common.md#principled-implementation Browser residency reads the host's current complete catalogue while labelling generations.
   * @evidence contracts/common.md#clear-and-simple-design Catalogue ownership remains with the source/publication controller.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unrelated backend timestamp cannot stand in for the source revision in this inventory.
   * @evidence contracts/common.md#meaningful-documentation The result is the current inventory whose revision labels the ready source.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Browser residency reads the host's current complete catalogue while labelling generations.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The result is the current inventory whose revision labels the ready source.
   */
  inventory: () => IHumanViewerCatalogue;

  /**
   * Republish availability after reload or renderer failure.
   *
   * @evidence contracts/common.md#principled-implementation The host republishes availability after renderer lifecycle changes.
   * @evidence contracts/common.md#clear-and-simple-design Residency reports availability while catalogue composition remains separate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed or reopened page is not hidden by a previously ready catalogue.
   * @evidence contracts/common.md#meaningful-documentation The notification requests republication after reload or physical renderer failure.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The host republishes availability after renderer lifecycle changes.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The notification requests republication after reload or physical renderer failure.
   */
  publish: () => void;

  /**
   * Capture cancellation owner renewed only after physical settlement.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Retains dispatched capture authority until actual renderer settlement permits renewal of the browser lifetime.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Retains dispatched capture authority until actual renderer settlement permits renewal of the browser lifetime.
   */
  lifetime: ReturnType<typeof createHumanViewerCaptureLifetime>;

  /**
   * Report the first opening's startup phases.
   *
   * @evidence contracts/common.md#principled-implementation The first browser opening reports its named startup boundary to the host.
   * @evidence contracts/common.md#clear-and-simple-design Startup record ownership remains with the injected phase owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Named stages describe actual opening work rather than inferred progress.
   * @evidence contracts/common.md#meaningful-documentation The string identifies the startup phase actually entered.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The first browser opening reports its named startup boundary to the host.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The string identifies the startup phase actually entered.
   */
  phase: (name: string) => void;

  /**
   * Forward numerical progress to the running capture stage.
   *
   * @evidence contracts/common.md#principled-implementation The resident page reports numerical progress to the running capture's existing stage watch.
   * @evidence contracts/common.md#clear-and-simple-design Capture progress state remains with its dedicated owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Progress is triggered by the numerical protocol rather than by an elapsed timer.
   * @evidence contracts/common.md#meaningful-documentation The callback marks an actual progress observation and carries no timeout permission.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The resident page reports numerical progress to the running capture's existing stage watch.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The callback marks an actual progress observation and carries no timeout permission.
   */
  progress: () => void;

  /**
   * Sample numerical work through the existing heap gauge.
   *
   * @evidence contracts/common.md#principled-implementation The page's reported work stage supplies context for an actual heap sample.
   * @evidence contracts/common.md#clear-and-simple-design Residency delegates accounting to the existing heap gauge.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Heap size is measured for the supplied work, not inferred from document counts.
   * @evidence contracts/common.md#meaningful-documentation The work record labels the stage and document associated with the sample.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The page's reported work stage supplies context for an actual heap sample.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The work record labels the stage and document associated with the sample.
   */
  sample: (work: HumanViewerWork) => void;

  /**
   * Announce a proven current-code generation to thumbnail warming.
   *
   * @evidence contracts/common.md#principled-implementation A proven current-code revision is published to the host's warming authority.
   * @evidence contracts/common.md#clear-and-simple-design Warm-pass ordering remains with its existing owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unproven or stale code cannot be turned into current-source readiness by this notification.
   * @evidence contracts/common.md#meaningful-documentation The revision identifies the code that actually reached a ready frame.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach A proven current-code revision is published to the host's warming authority.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The revision identifies the code that actually reached a ready frame.
   */
  sourceReady: (revision: string) => void;

  /**
   * Reconsider pending admissions after a frame or generation becomes ready.
   *
   * @evidence contracts/common.md#principled-implementation A frame or generation readiness trigger asks the admission owner to reconsider pending documents.
   * @evidence contracts/common.md#clear-and-simple-design Retry policy remains event-driven in the host.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No autonomous timed polling or substitute admission judgement is introduced.
   * @evidence contracts/common.md#meaningful-documentation The trigger string records the observed event that prompted reconsideration.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach A frame or generation readiness trigger asks the admission owner to reconsider pending documents.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The trigger string records the observed event that prompted reconsideration.
   */
  retryAdmissions: (trigger: string) => void;
}

import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanBodyChannelScale,
} from "@automovie/human";

import type { IConnectedBodyMeasurement } from "./IConnectedBodyMeasurement";

/**
 * What the detailed measured controls render into and call: the container, the basis and its measured scales, the selected group and search, the parent's drafts and intent tickets, the off-thread solver and the panel's transaction, status and refusal owners. Typed draft values are display text in millimetres; the solver receives metres. Draft text is parent-owned UI state and is never serialized into the body document. A newer panel intent withdraws an old solve's publication and status effects.
 *
 * @evidence contracts/common.md#principled-implementation Measurement targets are inverted through the supplied numerical solver, while shared intent tickets prevent asynchronous results from overwriting newer authored state.
 * @evidence contracts/common.md#clear-and-simple-design The row inputs, numerical solver and transaction hooks are injected separately so the measured renderer need not own body history or source loading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uncommitted text stays outside serialization, and failed or stale inversions cannot be replaced with display values masquerading as measured outcomes.
 * @evidence contracts/common.md#meaningful-documentation Comments specify millimetre text versus metre solver inputs, parent-owned draft persistence and intent-based suppression of stale effects.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This measured-controls schema chooses no channel filtering, inverse bracketing or body evaluation strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Draft and scale maps are supplied state without a declared cache of solved channels or equivalent in-flight requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources DOM elements, scale readings and draft maps belong to the parent; numerical tasks remain owned by its solver transport.
 *
 * @author Samchon
 */
export interface IBodyMeasuredControlsProps {
  /** The document that creates the rows. */
  dom: Document;

  /** The element the rows replace their children in. */
  container: HTMLElement;

  /** The basis whose measured channels the rows offer. */
  basis: IAutoMovieHumanBodyBasis;

  /** Each measured channel's scale and neutral reading. */
  scales: Map<string, IAutoMovieHumanBodyChannelScale>;

  /** The selected measured group. */
  kind: string;

  /** The search text, lower-cased without spaces. */
  query: string;

  /** Uncommitted typed targets by channel id, owned by the parent. */
  drafts: Map<string, string>;

  /**
   * Read the latest draft body document before capturing a measured solve's starting shape.
   *
   * @evidence contracts/common.md#principled-implementation Capturing the current draft makes a one-channel inverse compose with detailed edits already pending in the panel.
   * @evidence contracts/common.md#clear-and-simple-design The getter exposes authored body state without the measured row needing panel history or viewport access.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Starting shape comes from the draft rather than a neutral fixture or the initial rendered body.
   * @evidence contracts/common.md#meaningful-documentation The comment places draft access before the solve's starting-shape snapshot.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This measured-row getter defines no cloning or document-storage implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current input access does not promise reuse of an earlier channel inversion.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reading document data acquires no resident worker or body-rendering handle.
   */
  current: () => IAutoMovieHumanBodyBasisDocument;

  /**
   * Reserve a new panel intent before validating and asynchronously solving the typed measurement.
   *
   * @evidence contracts/common.md#principled-implementation Reservation establishes measurement intent ordering before asynchronous numerical work or a local invalid-input refusal.
   * @evidence contracts/common.md#clear-and-simple-design The row uses the panel's shared ticket authority so other body controls can supersede its solve.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A measured edit is not ordered by solver completion or by equality with the preceding channel target.
   * @evidence contracts/common.md#meaningful-documentation The reservation comment identifies both validation and asynchronous solving as later steps.
   * @evidenceExclude contracts/performance.md#efficient-algorithms No ticket counter or pending-build withdrawal algorithm is chosen by this signature.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reserving a new measurement intent is an effect rather than equivalent work to share.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The ticket is scalar ordering data and owns no numerical request resources.
   */
  reserve: () => number;

  /**
   * Whether a measurement ticket still names the latest panel intent before result or status publication.
   *
   * @evidence contracts/common.md#principled-implementation Shared ticket validity gates both document submission and measured readback reporting after the inverse settles.
   * @evidence contracts/common.md#clear-and-simple-design One parent predicate accounts for all body-editing paths without duplicating their event sources in each measurement row.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unchanged target text or shape is not used as proof that a newer pose or history intent did not occur.
   * @evidence contracts/common.md#meaningful-documentation The validity comment locates checks before both numerical result and status effects.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This measured-ticket predicate implements no generation comparison algorithm itself.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Publication validity expresses edit order and does not establish reusable numerical equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Checking a ticket acquires no new task and does not own the solver connection.
   */
  isCurrent: (ticket: number) => boolean;

  /**
   * Solve one measured channel for a metre-valued target off the page thread, preserving other channel weights. Reject unsupported or unreachable requests.
   *
   * @evidence contracts/common.md#principled-implementation The inverse operates on one named measured channel over the captured shape, keeping the target quantity in metres across the worker boundary.
   * @evidence contracts/common.md#clear-and-simple-design The solver returns new shape and achieved length while the row and panel retain display and document responsibilities.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreachable measurements remain refusals rather than clamped targets or fabricated exact readbacks.
   * @evidence contracts/common.md#meaningful-documentation The solver comment specifies target units, off-thread execution, unchanged other weights and refusal conditions.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This inverse callback type leaves bracketing and full-shape evaluation to the numerical owner.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Solved-channel caching is not declared; each request carries its actual starting shape and target.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The solver transport owns queued requests and resident workers behind this promise-returning member.
   */
  solve: (
    shape: Record<string, number>,
    channel: string,
    targetMetres: number,
  ) => Promise<IConnectedBodyMeasurement>;

  /**
   * Submit the solved document under its reserved ticket. True means current publication, which the person consumer can classify as an accepted person or a labelled construction draft; false includes failed settlement after earlier publication and promises no rollback.
   *
   * @evidence contracts/common.md#principled-implementation The solved weights enter the same ticketed body-document transaction as other authored changes, preserving shared admission and history.
   * @evidence contracts/common.md#clear-and-simple-design A boolean publication completion lets the row append the shape-only solver reading while parent state retains accepted-versus-draft history authority.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Numerical inverse completion alone does not bypass document admission or imply that the body was committed.
   * @evidence contracts/common.md#meaningful-documentation The member distinguishes commit request, reserved ticket and the transaction's successful completion result.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This commit callback selects no history, frame-build or publication implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Document commits are effects and this member declares no merging of different measurement intents.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Prepared frames and history snapshots remain panel-owned during and after this asynchronous handoff.
   */
  change: (
    document: IAutoMovieHumanBodyBasisDocument,
    ticket: number,
  ) => Promise<boolean>;

  /**
   * Show that the named channel is being solved on the captured body.
   *
   * @evidence contracts/common.md#principled-implementation Busy reporting identifies an ongoing measured-channel inverse without claiming the target was admitted.
   * @evidence contracts/common.md#clear-and-simple-design The measured row sends text to the panel's status owner instead of owning a competing status element.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The notification contains no invented numerical progress or estimated completion threshold.
   * @evidence contracts/common.md#meaningful-documentation The comment ties busy status to the named channel and captured body input.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This measured busy hook implements no DOM or progress-sampling algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Busy reporting is an effect and has no declared sharing across concurrent intent text.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The text callback acquires no progress timer or retained numerical task.
   */
  busy: (text: string) => void;

  /**
   * Append the shape-only solver reading after current publication, without certifying accepted history. Authored anatomy can be reapplied by the complete transaction, so this is not an independent displayed-person measurement.
   *
   * @evidence contracts/common.md#principled-implementation Readback reports the actual shape-only solver outcome after current publication, separately from requested targets, accepted-history state and final-person measurement after anatomy reapplication.
   * @evidence contracts/common.md#clear-and-simple-design The row supplies its numerical status line while the parent determines how that line joins the body status.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed or superseded commits do not receive a success readback through this notification path.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies shape-only readback, current publication including labelled drafts, and the separate effects of complete-document anatomy and accepted-history classification.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This append-report declaration chooses no formatting or status-history algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Commit readback is an observable effect and is not shared merely because displayed numbers match.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Report retention belongs to the parent status implementation, with no resources acquired by this member.
   */
  report: (text: string) => void;

  /**
   * Report invalid text or a still-current numerical refusal while retaining the committed body.
   *
   * @evidence contracts/common.md#principled-implementation Invalid input and solver failures return to the panel's refusal owner before any solved document is accepted.
   * @evidence contracts/common.md#clear-and-simple-design One existing refusal hook serves local measurement validation and off-thread inverse failure.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refusal leaves the committed body intact instead of substituting zero for blank text or an endpoint for an unreachable target.
   * @evidence contracts/common.md#meaningful-documentation The callback comment distinguishes local invalid text and current numerical failure and states committed-state preservation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This measured-refusal signature implements no validation or error-recovery algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Error delivery is bound to an input intent and has no declared reuse across other refused edits.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The cause passes as error data while the solver transport and panel own request and frame cleanup.
   */
  refuse: (error: unknown) => void;
}

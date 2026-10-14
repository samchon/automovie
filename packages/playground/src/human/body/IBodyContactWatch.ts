import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

/**
 * Contact-status work owned by one mounted body panel. At most one delayed request is retained; replacing or cancelling it settles its completion. Closing withdraws future reporting and waits for every already started reading to retire its prepared frame.
 *
 * @evidence contracts/common.md#principled-implementation Delayed contact inspection has explicit cancellation and closure because a newer document or panel retirement removes its publication authority without making an already prepared frame disappear.
 * @evidence contracts/common.md#clear-and-simple-design Status formatting and delayed inspection are exposed alongside their lifetime boundary, leaving numerical evaluation and renderer disposal with supplied viewport operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Crossing reports retain geometric meaning and do not claim tissue contact or anatomical validity; cancelled work never becomes a synthetic success reading.
 * @evidence contracts/common.md#meaningful-documentation The interface states delayed-request replacement, completion settlement, close-time reporting withdrawal and retirement of already started frames.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This handle schema selects no timer or crossing-format algorithm; the contact-watch implementation owns scheduling.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The handle declares latest-request replacement without implementing cached contact readings across documents.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Lifetime obligations are specified here while the mounted watch implementation acquires and releases its timers and reading tasks.
 *
 * @author Samchon
 */
export interface IBodyContactWatch {
  /**
   * Format measured crossing data, or return null when the viewport supplied no inspection.
   *
   * @evidence contracts/common.md#principled-implementation Missing inspection remains distinct from an observed empty crossing list in the formatted status.
   * @evidence contracts/common.md#clear-and-simple-design A pure formatter is shared by delayed readings and the explicit contact-check button.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing reading is replaced with a claim that the skin is crossing-free.
   * @evidence contracts/common.md#meaningful-documentation The member explains null output as unavailable inspection rather than a measured absence of crossings.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The formatter signature selects no string traversal strategy itself.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This value-formatting member declares no retained result or coordinated work sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Input arrays are borrowed numerical data without renderer or worker ownership.
   */
  describe: (
    reading: IAutoMovieModelCrossing[] | null | undefined,
  ) => string | null;

  /**
   * Schedule contact readback after the editing pause. Completion includes cancellation, stale discard or reported numerical refusal.
   *
   * @evidence contracts/common.md#principled-implementation The document and ticket bind delayed inspection to the authored state that may still publish its readback.
   * @evidence contracts/common.md#clear-and-simple-design One asynchronous entry encapsulates pause scheduling and frame retirement without exposing timer handles to the panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Settled completion does not certify a crossing-free result or an accepted tissue-contact model.
   * @evidence contracts/common.md#meaningful-documentation The member states editing-pause behavior and cancellation, stale and refusal completion meanings.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This scheduling signature implements no timer or numerical inspection algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Replacement of obsolete scheduled work belongs to the watch implementation rather than this callable declaration.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The watch owner retains timer and completion state behind this method and retires it on cancellation or close.
   */
  after: (
    document: IAutoMovieHumanBodyBasisDocument,
    ticket: number,
  ) => Promise<void>;

  /**
   * Cancel the delayed request and settle its completion; already started readings still retire normally.
   *
   * @evidence contracts/common.md#principled-implementation Cancelling an unstarted delay releases its timer and completion without pretending to terminate an already active numerical inspection.
   * @evidence contracts/common.md#clear-and-simple-design The panel can withdraw pending contact work with one operation whenever its shared body intent advances.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cancellation does not synthesize inspection data or claim that active GPU cleanup is finished.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes delayed-request cancellation from retirement of already started readings.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This cancellation member chooses no timer-clear implementation or numerical interruption strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Withdrawing delayed work is an ownership effect without reusable numerical output.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Timer ownership is held by the watch implementation; cancellation exposes its release boundary.
   */
  cancel: () => void;

  /**
   * Permanently stop scheduling and reporting, cancel the delay and await active reading cleanup.
   *
   * @evidence contracts/common.md#principled-implementation Closure withdraws reporting authority before waiting so late numerical completion cannot mutate a retired panel's status.
   * @evidence contracts/common.md#clear-and-simple-design One promise exposes the contact watch's complete shutdown boundary to application teardown.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Awaiting shutdown does not label a failed inspection as valid or cancel unrelated viewport owners.
   * @evidence contracts/common.md#meaningful-documentation The member specifies permanent closure, pending timer release and awaiting active cleanup.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This close signature implements no task traversal or resource-retirement algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Idempotent close coordination belongs to the watch owner rather than this interface declaration.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Closing releases watch-owned scheduling and waits for its tasks while borrowed viewport resources remain with their owner.
   */
  close: () => Promise<void>;
}

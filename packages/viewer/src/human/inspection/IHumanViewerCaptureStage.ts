/**
 * The stage the running capture is in, as `/health` reports it.  Stage identity and observation timestamps locate local capture work. They supply no remaining-work estimate, lease heartbeat or age-based cancellation authority.
 *
 * @evidence contracts/common.md#principled-implementation Identifies the actually running room/page/trim operation and its observed start/progress wall-clock times.
 * @evidence contracts/common.md#clear-and-simple-design One local stage record separates activity observation from capture lifetime cancellation and queue-slot ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Elapsed stage age cannot release GPU ownership or invent an ETA; current clears only when its matching operation settles.
 * @evidence contracts/common.md#meaningful-documentation Documents document id and ISO timestamps; progress is an observation, not lease renewal or a planned-work percentage.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Field updates are fixed work; the actual stage operation owns numerical/GPU/heap costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Each stage has its own observation identity and cannot reuse another operation's progress as measured work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The stage watcher retains one current record until matching settlement, with no history list or age timer acquired by this shape.
 *
 * @author Samchon
 */
export interface IHumanViewerCaptureStage {
  /** `room`, `page` (show and PNG in the page) or `trim`. */
  name: string;

  /** The document being captured. */
  doc: string;

  /** ISO time the stage began. */
  since: string;

  /** ISO time the stage last showed progress. */
  progress: string;
}

/**
 * The host page's build progress line.
 *
 * @evidence contracts/common.md#principled-implementation Progress observes elapsed display time and the actual server queue; begin and settle govern reporting rather than candidate success or process lifetime.
 * @evidence contracts/common.md#clear-and-simple-design Two operations own one replaceable progress line while the host's generation owner decides when work begins or settles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Elapsed seconds are explanatory text and cannot impose an exit, restart or successful readiness state.
 * @evidence contracts/common.md#meaningful-documentation States the reporting inputs and explicit start/stop effects without treating a timer as completion authority.
 * @author Samchon
 */
export interface IHumanViewerHostProgress {
  /**
   * Start reporting what is being built, its elapsed seconds and the server queue.
   *
   * @evidence contracts/common.md#principled-implementation A new operation label replaces the reporting generation and starts elapsed-seconds and health-queue observation for that work.
   * @evidence contracts/common.md#clear-and-simple-design One begin operation replaces the prior reporting interval and draws immediately through the progress owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Periodic health reads update explanatory text only; old generation replies cannot end or certify the current candidate.
   * @evidence contracts/common.md#meaningful-documentation States replacement, label ownership and which elapsed/queue facts appear while building.
   */
  begin: (what: string) => void;

  /**
   * Stop reporting and clear the line.
   *
   * @evidence contracts/common.md#principled-implementation Settlement advances the reporting generation, cancels its interval and clears text so pending old health replies cannot repaint it.
   * @evidence contracts/common.md#clear-and-simple-design One explicit operation withdraws the progress owner without disposing the viewer or its numerical work.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The host explicitly settles reporting; elapsed duration or an unanswered probe cannot trigger this operation or stop an application.
   * @evidence contracts/common.md#meaningful-documentation Defines interval/text release and stale-reply invalidation separately from work completion.
   */
  settle: () => void;
}

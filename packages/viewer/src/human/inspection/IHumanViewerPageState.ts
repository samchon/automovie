/**
 * The current frame's availability for domain admission. Residency owns renderer replacement and recovery; this snapshot reports ready, starting or failed with the current cause, without promising how long recovery will take.
 *
 * @evidence contracts/common.md#principled-implementation Reports current page availability independently of a domain verdict, so admission waiting follows the residency owner's state instead of elapsed time.
 * @evidence contracts/common.md#meaningful-documentation Names each state and the reason member.
 *
 * @evidence contracts/common.md#clear-and-simple-design Current ready, starting or failed availability and its cause drive admission without duplicating renderer recovery state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Waiting and refusal follow the actual page state; an age threshold cannot manufacture readiness or a domain verdict.
 *
 * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Reports current page availability independently of a domain verdict, so admission waiting follows the residency owner's state instead of elapsed time.
 * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Waiting and refusal follow the actual page state; an age threshold cannot manufacture readiness or a domain verdict.
 *
 * @author Samchon
 */
export interface IHumanViewerPageState {
  /**
   * `ready`, `starting` or `failed`.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Reports current ready, starting or failed frame availability independently of a numerical document judgement.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Reports current ready, starting or failed frame availability independently of a numerical document judgement.
   */
  state: "ready" | "starting" | "failed";

  /**
   * What it is waiting for, or why it failed; null when ready.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Preserves the current waiting or failure cause and remains null for the ready frame.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Preserves the current waiting or failure cause and remains null for the ready frame.
   */
  reason: string | null;
}

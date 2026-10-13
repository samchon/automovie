/**
 * The current frame's availability for domain admission. Residency owns renderer replacement and recovery; this snapshot reports ready, starting or failed with the current cause, without promising how long recovery will take.
 *
 * @author Samchon
 */
export interface IHumanViewerPageState {
  /** `ready`, `starting` or `failed`. */
  state: "ready" | "starting" | "failed";

  /** What it is waiting for, or why it failed; null when ready. */
  reason: string | null;
}

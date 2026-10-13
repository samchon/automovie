/**
 * Application-owned validated input transfer. The original editor/transaction
 * implements restoration; a host never guesses fields or replays DOM events.
 * Initial completion and restoration failures refuse a source candidate while
 * the prior page remains retained. The page bridge owns viewport transfer,
 * clock suspension and display resources; the application owns its document
 * transaction and restoration effects.
 *
 * @author Samchon
 */
export interface IPlaygroundViewerApplication {
  /** Initial application transaction completion; a rejection refuses admission. */
  ready: Promise<void>;

  /** Serializable actual displayed input; undefined means none was exposed. */
  capture: () => unknown;

  /**
   * Restore through the original validated transaction or reject the candidate.
   * Candidate mutation and rollback remain with that application's transaction;
   * rejection leaves the retained prior page available to the host.
   */
  restore: (state: unknown) => Promise<void>;

  /** An intentionally empty input editor may be shown without a subject bitmap. */
  empty?: boolean;

  /**
   * Reflect restored actual view in application-owned controls, without events.
   * Omission means this application exposes no separate view-reflection step.
   */
  reflectView?: (state: unknown) => void;
}

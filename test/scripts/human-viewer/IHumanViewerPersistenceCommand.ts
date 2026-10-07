/**
 * Display completion or connection retirement sent to the existing numerical
 * worker. Persistence cannot delay the model reply or start before display.
 *
 * @author Samchon
 */
export interface IHumanViewerPersistenceCommand {
  /** Flush after drawing; discard withdraws one retired connection's result. */
  persistence: "flush" | "discard";

  /** Producing request when discarding; absent for the single pending flush. */
  id?: number;
}

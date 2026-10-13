/**
 * Off-request work whose completion a reader can wait for.
 *
 * @author Samchon
 */
export interface IHumanViewerSettleable {
  /** Whether any of its work is still running. */
  busy: () => boolean;

  /** Resolve when the work running now has finished. */
  settled: () => Promise<void>;
}

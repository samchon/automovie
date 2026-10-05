/**
 * The last trim decision, as `/health` reports it.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface IHumanViewerResidentTrimReading {
  /** ISO time of the reading. */
  at: string;

  /** Page isolate JS heap in bytes. */
  page: number;

  /** All worker isolates' JS heap in bytes. */
  workers: number;

  /** The combined limit in bytes. */
  limit: number;

  /** Residents the page released in this trim. */
  evicted: number;
}

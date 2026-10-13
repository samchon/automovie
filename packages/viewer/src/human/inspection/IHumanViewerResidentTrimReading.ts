/**
 * The last trim decision, as `/health` reports it.
 *
 * @evidence contracts/common.md#principled-implementation A trim reading reports page and worker isolate bytes beside the shared limit, released resident count and domain-specific capture room.
 * @evidence contracts/common.md#clear-and-simple-design One health record carries the completed trim decision while the trim owner retains measurement and eviction policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Evicted counts and heap bytes are recorded observations, not a readiness or visual-quality verdict.
 * @evidence contracts/common.md#meaningful-documentation Documents byte units, ISO reading time and the face, body and person capture-room meanings.
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

  /** The page heap room each domain's capture is known to need, in bytes. */
  room: Record<"face" | "body" | "person", number>;
}

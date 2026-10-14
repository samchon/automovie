/**
 * The last trim decision, as `/health` reports it.
 *
 * @evidence contracts/common.md#principled-implementation The trim report distinguishes page and worker isolate heaps from the combined limit and per-domain capture room, all in bytes.
 * @evidence contracts/common.md#clear-and-simple-design One health record carries the latest decision and eviction count without mixing it with physical GPU allocation accounting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Trim values are observations and declared room estimates, not fabricated physical-memory measurements or subject-specific exceptions.
 * @evidence contracts/common.md#meaningful-documentation Members specify ISO observation time, byte units, evicted residents and separate face/body/person capture room.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This report stores a trim decision rather than choosing which residents to evict or how heaps are measured.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A latest-reading record defines no reusable heap result; actual trimming samples the current isolates independently.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The health report keeps scalar counts and a three-domain room table without retaining evicted residents or CDP handles.
 *
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

  /** Seeded or largest sampled page-heap growth used as each domain's headroom estimate, in bytes; it does not bound every future peak. */
  room: Record<"face" | "body" | "person", number>;
}

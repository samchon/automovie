import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
import { IAutoMovieDrawingGap } from "./IAutoMovieDrawingGap";
import { IAutoMovieDrawingScheduleRow } from "./IAutoMovieDrawingScheduleRow";

/**
 * A schedule: the same design counted instead of drawn.
 *
 * A door schedule and a floor plan disagree the moment either is maintained by
 * hand, so this is derived from exactly the graph the plan is derived from. The
 * consequence the acceptance cares about is arithmetic rather than aesthetic:
 * {@link total} is the number of scheduled occurrences in the design, and the
 * row counts sum to it, so a schedule cannot quietly lose or invent a door.
 *
 * Rows are grouped by type, which is what a schedule is for — nobody wants
 * three hundred identical rows — and each row names a bounded sample of its
 * members with the remainder counted. That bound is what keeps a schedule over
 * a tower the same size as a schedule over a room.
 *
 * A `space` schedule is the exception to grouping: every room is its own row,
 * because two rooms of one kind and size are still two places to visit.
 *
 * @evidence contracts/common.md#principled-implementation `deriveAutoMovieDrawingSchedule` validates the environment, reduces each opening, space or connector to one occurrence, groups openings and connectors by kind, model, width, height and basis, and sets `total` to the occurrence count, so the row counts sum to it by construction; the digest is SHA-256 over a canonical line-joined text of every other field.
 * @evidence contracts/common.md#clear-and-simple-design The record holds only subject, rows, total, gaps and digest, and the size of an opening comes from the same extent helpers the drawing uses, so the sheet and the schedule cannot measure one opening two ways.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed per-subject gaps (`space-fit-out`, `space-enclosure`, `opening-performance`, `traversal-performance`) declare what the design cannot answer instead of printing empty columns, and an unmeasured type is a gap with `null` sizes rather than a zero.
 * @evidence contracts/common.md#meaningful-documentation States that `total` equals the summed row counts, why rows group by type and why a room schedule does not, that members are a bounded sample, and that rows and gaps follow a canonical order.
 * @author Samchon
 */
export interface IAutoMovieDrawingSchedule {
  /** Schedule format. */
  version: 1;

  /** Versioned schedule protocol. */
  protocol: "automovie.drawing-schedule.v1";

  /** Built environment this schedule was derived from. */
  environment: string;

  /** What is being scheduled, such as `opening`, `space` or `connector`. */
  subject: string;

  /** Type rows, in canonical order. */
  rows: IAutoMovieDrawingScheduleRow[];

  /**
   * Occurrences the design declares for this subject.
   *
   * The row counts sum to exactly this. A discrepancy is not possible by
   * construction, which is the point: the number the schedule prints and the
   * number of things in the model are one number.
   */
  total: number;

  /** Derivations this schedule could not perform, in canonical order. */
  gaps: IAutoMovieDrawingGap[];

  /** Digest over the whole record. */
  digest: AutoMovieContentDigest;
}

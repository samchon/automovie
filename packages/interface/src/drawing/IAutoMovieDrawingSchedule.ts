import { AutoMovieDrawingScheduleSubject } from "./AutoMovieDrawingScheduleSubject";
import { IAutoMovieDrawingGap } from "./IAutoMovieDrawingGap";
import { IAutoMovieDrawingScheduleRow } from "./IAutoMovieDrawingScheduleRow";

/**
 * A schedule: one design's spaces, openings or connectors counted instead of drawn.
 *
 * It is derived from the same validated graph as a drawing, but counts the complete selected subject population while a drawing applies its view's space and element-kind filters. {@link total} is the number of subject records in the design, and the row counts sum to it; this identity does not equate a filtered sheet's visible population with the whole-design schedule.
 *
 * Openings and connectors are grouped into type rows, and each row names a bounded sample of its members with the remainder counted, so a schedule over a tower is the size of its type list. A `space` schedule lists every space as its own row, because two rooms of one kind and size are still two places to visit.
 *
 * @evidence contracts/common.md#principled-implementation `deriveAutoMovieDrawingSchedule` validates the design, maps every record of the subject to one occurrence, groups occurrences by a JSON key of kind, model, width, height and basis (or by id for spaces), so every occurrence lands in exactly one row and the counts sum to `total`, and digests the record with SHA-256 over `canonicalizeAutoMovieJson`.
 * @evidence contracts/common.md#clear-and-simple-design The record holds only the subject, its rows, the total, its gaps and identity fields; sizing, location and the member bound live on the row and place records that own them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `total` is the length of the design's own record array rather than a sum of rows, so the reconciliation is a property of the derivation, and what a subject cannot state is filed as a gap instead of being left out.
 * @evidence contracts/common.md#meaningful-documentation States the shared source with drawings, the meaning of `total` and the row-count identity, the grouping and member bound, and the ungrouped space rule; members give row and gap order, the subject's closed set, and the digest's coverage.
 * @author Samchon
 */
export interface IAutoMovieDrawingSchedule {
  /** Schedule format. */
  version: 1;

  /** Versioned schedule protocol. */
  protocol: "automovie.drawing-schedule.v1";

  /** Built environment this schedule was derived from. */
  environment: string;

  /** Which family of design records is scheduled. */
  subject: AutoMovieDrawingScheduleSubject;

  /**
   * Rows ordered by kind, model, width, height (unmeasured first) and basis, with each kind's rows marked `<kind>-01`, `<kind>-02` and so on in that order.
   */
  rows: IAutoMovieDrawingScheduleRow[];

  /**
   * Number of records of {@link subject} the design declares; the row counts sum to exactly this.
   */
  total: number;

  /**
   * What this schedule does not state, sorted by gap subject.
   *
   * Every schedule carries the subject's fixed scope gap, such as `opening-performance`, and adds a `<subject>-geometry` gap when some rows are `unmeasured`.
   */
  gaps: IAutoMovieDrawingGap[];

  /** SHA-256 digest over the canonical JSON of every other field. */
  digest: string;
}

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
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingSchedule` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingSchedule` for the interior space drawing schedule quantity system contract.
 * @author Samchon
 */
export interface IAutoMovieDrawingSchedule {
  /**
   * Schedule format.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `version` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `version` for the interior space drawing schedule quantity system contract.
   */
  version: 1;

  /**
   * Versioned schedule protocol.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `protocol` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `protocol` for the interior space drawing schedule quantity system contract.
   */
  protocol: "automovie.drawing-schedule.v1";

  /**
   * Built environment this schedule was derived from.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `environment` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `environment` for the interior space drawing schedule quantity system contract.
   */
  environment: string;

  /**
   * What is being scheduled, such as `opening`, `space` or `connector`.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `subject` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `subject` for the interior space drawing schedule quantity system contract.
   */
  subject: string;

  /**
   * Type rows, in canonical order.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `rows` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `rows` for the interior space drawing schedule quantity system contract.
   */
  rows: IAutoMovieDrawingScheduleRow[];

  /**
   * Occurrences the design declares for this subject.
   *
   * The row counts sum to exactly this. A discrepancy is not possible by
   * construction, which is the point: the number the schedule prints and the
   * number of things in the model are one number.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `total` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `total` for the interior space drawing schedule quantity system contract.
   */
  total: number;

  /**
   * Derivations this schedule could not perform, in canonical order.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `gaps` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `gaps` for the interior space drawing schedule quantity system contract.
   */
  gaps: IAutoMovieDrawingGap[];

  /**
   * Digest over the whole record.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `digest` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `digest` for the interior space drawing schedule quantity system contract.
   */
  digest: AutoMovieContentDigest;
}

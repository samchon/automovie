import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * One registered face measurement: what it reads on the final surface and which existing channels a target for it may move.
 *
 * `read` measures one build and returns the value in `unit`, or a named gap when the basis lacks what the measurement needs. `channels` lists the existing channels the editor's inverse may move for a target, tried in order within each channel's admitted range; an empty list makes the measurement report-only. Its report can retain requested context, but the editor inverse refuses a target with no solving channel rather than treating it as achieved without moving shape. Each face part owner registers its measurements in its own file and adds them to `HUMAN_FACE_MEASUREMENTS`.
 *
 * @evidence contracts/common.md#principled-implementation A named unit-bearing instrument reads actual final geometry or a gap and lists existing channels eligible for a separate inverse.
 * @evidence contracts/common.md#clear-and-simple-design Registry ownership stays with each face part while empty channels make an instrument report-only.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A requested value never substitutes for measured geometry, and qualifications do not authorize clinical interpretation or inversion.
 * @evidence contracts/common.md#meaningful-documentation Unit and qualification travel with the reader while channel order governs inverse attempts.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Each concrete read callback and the inverse owner execute their actual geometry/solver work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One registered instrument is shared by builder reports and editor trial reads, not a cached expected value.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Module registry retains callback/metadata for its lifetime; each context owns actual geometry independently of this schema.
 *
 * @author Samchon
 */
export interface IHumanFaceMeasurement {
  /** Registered measurement name a document target uses. */
  id: string;

  /** Unit of the reading and of a target. */
  unit:
    | "millimetres"
    | "square-millimetres"
    | "degrees"
    | "cubic-centimetres"
    | "count";

  /** Existing channels a target may move, in solve order; empty is report-only. */
  channels: readonly string[];

  /**
   * Qualification of the observable source quantity when it differs from a
   * clinically registered measurement. Kept with every numerical readout;
   * it grants neither a clinical value nor permission to invert this quantity.
   */
  qualification?: string;

  /**
   * Read one build's final surface, or name what the basis lacks.
   *
   * @evidence contracts/common.md#principled-implementation A registered instrument reads one current build's actual source/generated geometry or returns a named gap.
   * @evidence contracts/common.md#clear-and-simple-design Registry reporting and separate editor inversion consume the same measurement callback.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Requested context never replaces a reading and report assembly converts nonfinite/thrown results to unavailable reasons.
   * @evidence contracts/common.md#meaningful-documentation Numeric output uses the measurement's declared unit and qualification rather than a universal clinical interpretation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The concrete instrument owns its traversal and allocation cost; this erased callback type selects no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same module-registered instrument is reused across current and trial contexts without expected-value caching.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The registry retains the callback for module lifetime while each supplied geometry context owns its separate resources.
   */
  read: (
    context: IHumanFaceMeasurementContext,
  ) => number | IHumanFaceMeasurementGap;
}

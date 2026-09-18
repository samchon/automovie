import { AutoMovieDrawingGapStatus } from "./AutoMovieDrawingGapStatus";

/**
 * One derivation that produced nothing, and the exact reason.
 *
 * The same shape the render report uses, for the same reason: a drawing that
 * omitted what it could not compute would read as a drawing of a building with
 * no such thing in it. Naming the absence is the only way a sheet can be
 * trusted for what it does show.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingGap` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingGap` for the interior space drawing schedule quantity system contract.
 * @author Samchon
 */
export interface IAutoMovieDrawingGap {
  /**
   * What was not derived, as a stable machine-readable subject.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `subject` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `subject` for the interior space drawing schedule quantity system contract.
   */
  subject: string;

  /**
   * Whether the derivation does not exist or merely had no input.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `status` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `status` for the interior space drawing schedule quantity system contract.
   */
  status: AutoMovieDrawingGapStatus;

  /**
   * Exactly what is absent, naming the declaration that needed it.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `reason` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `reason` for the interior space drawing schedule quantity system contract.
   */
  reason: string;

  /**
   * Exactly what would make the derivation produce a result.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `remedy` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `remedy` for the interior space drawing schedule quantity system contract.
   */
  remedy: string;
}

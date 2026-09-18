import { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One drafted straight segment and the design element that owns it.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingLine` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingLine` for the interior space drawing schedule quantity system contract.
 */
export interface IAutoMovieDrawingLine {
  /**
   * Building element this line was derived from.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `owner` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `owner` for the interior space drawing schedule quantity system contract.
   */
  owner: string;

  /**
   * Logical space the owning element occupies, or `null`.
   *
   * A separation drawn from its own face carries the first of the spaces it
   * divides. That is a property of the design rather than of the sheet that
   * drew it, so one party wall reads the same on both of its rooms' sheets
   * instead of renaming itself per view.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `space` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `space` for the interior space drawing schedule quantity system contract.
   */
  space: string | null;

  /**
   * Owning element's kind, which is the drafting layer.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `layer` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `layer` for the interior space drawing schedule quantity system contract.
   */
  layer: string;

  /**
   * Relation to the cut plane and the view depth.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `role` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `role` for the interior space drawing schedule quantity system contract.
   */
  role: AutoMovieDrawingRole;

  /**
   * Page start point; lexicographically at or before {@link to}.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `from` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `from` for the interior space drawing schedule quantity system contract.
   */
  from: IAutoMovieDrawingPoint;

  /**
   * Page end point.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `to` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `to` for the interior space drawing schedule quantity system contract.
   */
  to: IAutoMovieDrawingPoint;
}

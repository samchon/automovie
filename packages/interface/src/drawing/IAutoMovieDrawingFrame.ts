import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The orthonormal page basis a view resolved to.
 *
 * Published rather than kept private because every number in the drawing is
 * expressed in it: without the basis, a page coordinate cannot be turned back
 * into the world point it came from, and a consumer that wanted to check the
 * drawing against the design would have to re-derive the frame and hope it
 * matched.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingFrame` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingFrame` for the interior space drawing schedule quantity system contract.
 * @author Samchon
 */
export interface IAutoMovieDrawingFrame {
  /**
   * World point at page `(0, 0)`, and the point the cut plane passes through.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `origin` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `origin` for the interior space drawing schedule quantity system contract.
   */
  origin: IAutoMovieVector3;

  /**
   * Unit world direction of the page `+x` axis.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `right` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `right` for the interior space drawing schedule quantity system contract.
   */
  right: IAutoMovieVector3;

  /**
   * Unit world direction of the page `+y` axis.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `up` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `up` for the interior space drawing schedule quantity system contract.
   */
  up: IAutoMovieVector3;

  /**
   * Unit world normal of the cut/picture plane, pointing at the viewer.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `normal` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `normal` for the interior space drawing schedule quantity system contract.
   */
  normal: IAutoMovieVector3;
}

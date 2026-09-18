import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One logical volume's cross-section on the cut plane.
 *
 * A region is a space, not a room outline traced by hand: it is the exact
 * convex cross-section of one authored cell, so a room drawn on two sheets is
 * drawn from one declaration. Its area is the area of that cross-section and
 * nothing else — in particular it is not the space's floor area, which comes
 * from the support surfaces and is reported by the quantity report.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingRegion` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingRegion` for the interior space drawing schedule quantity system contract.
 * @author Samchon
 */
export interface IAutoMovieDrawingRegion {
  /**
   * Logical space this cross-section belongs to.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `space` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `space` for the interior space drawing schedule quantity system contract.
   */
  space: string;
  /**
   * Cell within that space.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `cell` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `cell` for the interior space drawing schedule quantity system contract.
   */
  cell: string;
  /**
   * Space kind, which is the region's drafting layer.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `kind` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `kind` for the interior space drawing schedule quantity system contract.
   */
  kind: string;
  /**
   * Convex page polygon in counter-clockwise order; at least three points.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `polygon` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `polygon` for the interior space drawing schedule quantity system contract.
   */
  polygon: IAutoMovieDrawingPoint[];
  /**
   * Exact area of {@link polygon} in square metres.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `area` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `area` for the interior space drawing schedule quantity system contract.
   */
  area: number;
  /**
   * Material id a finish view fills this region with, or `null`.
   *
   * Resolved from the material bound to the elements realizing the space's
   * boundaries. It is a surface material and not a construction build-up: a
   * material assembly is a separate record from the built environment, a
   * drawing is derived from the environment alone, and the drawing declares
   * that reach as a gap rather than inventing a layer order it cannot see.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `finish` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `finish` for the interior space drawing schedule quantity system contract.
   */
  finish: string | null;
}

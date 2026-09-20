import { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";

/**
 * Dash pattern in page millimetres, per line role; an empty array is solid.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingDashes` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingDashes` for the interior space drawing schedule quantity system contract.
 */
export type IAutoMovieDrawingDashes = {
  [role in AutoMovieDrawingRole]: number[];
};

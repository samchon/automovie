import { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";

/**
 * Stroke width in page millimetres, per line role.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingWeights` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingWeights` for the interior space drawing schedule quantity system contract.
 */
export type IAutoMovieDrawingWeights = {
  [role in AutoMovieDrawingRole]: number;
};

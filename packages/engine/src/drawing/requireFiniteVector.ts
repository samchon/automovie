/**
 * Shared by autoMovieDrawingFrame, autoMovieDrawingCellVolume, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Fixes page coordinates and measurements to six decimal places so identical drawing inputs retain comparable values and digests.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Defines the `10^-6` output grid applied to deterministic drawing coordinates, lengths, and areas.
 * @author Samchon
 */
export const requireFiniteVector = (value: IAutoMovieVector3, label: string): void => {
  if (
    !Number.isFinite(value.x) ||
    !Number.isFinite(value.y) ||
    !Number.isFinite(value.z)
  )
    throw new Error(`${label} must be finite on every axis`);
};

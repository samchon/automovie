/**
 * Shared by autoMovieDrawingFrame, autoMovieDrawingCellVolume, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Fixes page coordinates and measurements to six decimal places so identical drawing inputs retain comparable values and digests.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Defines the `10^-6` output grid applied to deterministic drawing coordinates, lengths, and areas.
 * @author Samchon
 */
export const requireOptionalDepth = (value: number | null, label: string): void => {
  if (value !== null && (!Number.isFinite(value) || value < 0))
    throw new Error(
      `${label} must be null or a finite number at or above zero, but was ${value}`,
    );
};

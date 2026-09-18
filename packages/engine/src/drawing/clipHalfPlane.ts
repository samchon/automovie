/**
 * Shared by autoMovieDrawingCellSection, autoMovieDrawingCellVolume, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Fixes page coordinates and measurements to six decimal places so identical drawing inputs retain comparable values and digests.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Defines the `10^-6` output grid applied to deterministic drawing coordinates, lengths, and areas.
 * @author Samchon
 */
export const clipHalfPlane = (
  polygon: readonly IAutoMovieDrawingPoint[],
  a: number,
  b: number,
  c: number,
): IAutoMovieDrawingPoint[] => {
  const out: IAutoMovieDrawingPoint[] = [];
  for (let index = 0; index < polygon.length; ++index) {
    const current = polygon[index]!;
    const next = polygon[(index + 1) % polygon.length]!;
    const dCurrent = a * current.x + b * current.y - c;
    const dNext = a * next.x + b * next.y - c;
    if (dCurrent <= 0) out.push(current);
    if (dCurrent * dNext < 0) {
      const t = dCurrent / (dCurrent - dNext);
      out.push({
        x: current.x + (next.x - current.x) * t,
        y: current.y + (next.y - current.y) * t,
      });
    }
  }
  return out;
};

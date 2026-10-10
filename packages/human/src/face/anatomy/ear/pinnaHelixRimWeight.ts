/**
 * Scale of the helix ridge along the pinna outline, zero across the lobule.
 *
 * The helix is the cartilage rim of the pinna; it ends at the lobule, which is
 * soft tissue without cartilage and so carries no rim. `along` is the
 * outline parameter in [0, 1) at which the helix is sampled and `points` the
 * number of control points the outline spans, so `along * points` is a
 * fractional control-point index. The first and last control points of the
 * lobule are `lobule.from` and `lobule.to` (indices, `from <= to`). The weight
 * is one before `from - 1`, falls to zero at `from` by a cubic smooth step,
 * stays zero through `to`, and rises to one at `to + 1`. A cubic smooth step
 * has zero slope at both ends, so the ridge meets its plateau without a
 * crease. Values outside the outline wrap are clamped, not extrapolated.
 */
export function pinnaHelixRimWeight(
  along: number,
  points: number,
  lobule: { from: number; to: number },
): number {
  const smooth = (t: number): number => {
    const c = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
  };
  const at = along * points;
  return 1 - smooth(at - (lobule.from - 1)) * (1 - smooth(at - lobule.to));
}

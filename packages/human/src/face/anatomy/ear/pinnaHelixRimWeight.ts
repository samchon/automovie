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
 *
 * @evidence contracts/common.md#principled-implementation Two clamped cubic smoothsteps suppress the authored helix ridge across the named lobule interval with zero endpoint slopes.
 * @evidence contracts/common.md#clear-and-simple-design One scalar envelope reads outline fraction, control-point count and source lobule indices; the pinna builder owns actual relief geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed source outline/ordered lobule indices are caller premises; clamping follows the documented plateau law rather than fitting a measured cartilage boundary.
 * @evidence contracts/common.md#meaningful-documentation The prose states the two fade intervals, lobule plateau, point-index mapping and clamped endpoint behavior.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed-size smoothstep evaluations require constant work independent of any emitted pinna vertex count.
 * @evidence contracts/performance.md#reuse-equivalent-work The pinna's relief owner shares this one envelope across its samples; no result is cached across changed source outline parameters.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only scalar temporaries and a scalar result exist; no outline, mesh, task or resource is retained.
 */
export function pinnaHelixRimWeight(
  along: number,
  points: number,
  lobule: { from: number; to: number },
): number {
  const smooth: (t: number) => number = (t: number): number => {
    const c: number = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
  };
  const at: number = along * points;
  return 1 - smooth(at - (lobule.from - 1)) * (1 - smooth(at - lobule.to));
}

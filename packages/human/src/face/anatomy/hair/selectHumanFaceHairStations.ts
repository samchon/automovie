import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Choose the stations of an integrated hair curve that a ribbon needs, so a
 * near-straight run is one segment and a bend keeps the stations that carry it.
 *
 * The result is a strictly increasing list of indices into `points`, always
 * holding the first and last. Every dropped station lies within the segment's
 * tolerance of the straight segment between the two kept stations around it
 * (Ramer-Douglas-Peucker on the station polyline, measured to the segment and
 * not to its infinite line). The tolerance is asked per segment, `tolerance(a,
 * b)` for the kept stations `a < b` that bound it, so a ribbon that narrows
 * toward its tip can tighten there; a nonpositive tolerance keeps every
 * station that is not exactly on the segment. Stations are never moved or
 * resampled: the result is a subset of the integrated ones.
 *
 * Deviation is compared against the chord, so the choice depends on the curve
 * and the caller's tolerance only, never on a style or a subject. The walk uses
 * an explicit stack, so a curve of any length cannot overflow the call stack.
 *
 * @evidence contracts/common.md#principled-implementation Ramer-Douglas-Peucker is the recognized method for keeping the vertices that carry a polyline within a stated deviation. Its premises hold here: the input is an ordered polyline of finite metre points, the deviation is the distance to the chord's segment (clamped, so a station past a chord's end is measured to that end), the first and last stations are always kept, and a chord of zero length (a closed loop) is measured to its start point. It is not an arc-length resampling, and the quadratic worst case of the split search is bounded by the few hundred stations of one curve.
 * @evidence contracts/common.md#clear-and-simple-design One responsibility: choose indices. The tolerance is a caller-owned function because the ribbon width, taper and skin clearance that set it belong to the mesher, so no option or policy lives here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case for a style, a subject or a fixture: the result is a function of the points and the supplied tolerance only. Nothing is patched around another module.
 * @evidence contracts/common.md#meaningful-documentation The comment states the result's order and guarantees, what the tolerance is asked for, that stations are never moved, and why the walk uses an explicit stack.
 * @evidence contracts/modeling.md#emitted-geometry The number of rows a ribbon emits follows the curve: two stations for a straight lock and every station for a curl that bends past the tolerance. Measured on the published faces, the long straight head falls from 366,006 to 127,188 hair triangles and the tightly curled head from 265,452 to 263,086. A card or a coarser fixed step would express the straight lock with fewer primitives, but an earlier reduction of the card count changed the fringe, the parting and the silhouette and was rejected; selecting integrated stations keeps every kept row exact.
 * @evidence contracts/modeling.md#spatial-conventions Points and tolerance are in the caller's metre frame; nothing is converted here.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function selects indices of one curve's stations and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; the mesher that fits ribbon corners against the skin at the kept stations owns the boundary, and bounds the tolerance by a quarter of the requested clearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; it chooses among stations the integrator already produced.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a human form through this function; its tolerance comes from ribbon width and clearance, named quantities the mesher already owns.
 */
export function selectHumanFaceHairStations(props: {
  points: readonly IAutoMovieVector3[];
  tolerance: (from: number, to: number) => number;
}): number[] {
  const { points } = props;
  if (points.length <= 2) return points.map((_, at) => at);
  const kept = new Set<number>([0, points.length - 1]);
  const pending: [number, number][] = [[0, points.length - 1]];
  while (pending.length !== 0) {
    const [from, to] = pending.pop()!;
    if (to - from < 2) continue;
    const limit = props.tolerance(from, to);
    const chord = Vector3.subtract(points[to], points[from]);
    const span = Vector3.dot(chord, chord);
    let worst = 0,
      at = -1;
    for (let i = from + 1; i < to; i++) {
      const offset = Vector3.subtract(points[i], points[from]);
      const along =
        span === 0
          ? 0
          : Math.max(0, Math.min(1, Vector3.dot(offset, chord) / span));
      const gap = Vector3.length(
        Vector3.subtract(offset, Vector3.scale(chord, along)),
      );
      if (gap > worst) {
        worst = gap;
        at = i;
      }
    }
    if (at !== -1 && worst > limit) {
      kept.add(at);
      pending.push([from, at], [at, to]);
    }
  }
  return [...kept].sort((a, b) => a - b);
}

import { IAutoMovieSubjectBox } from "@automovie/interface";

import { IAutoMovieFramedBox } from "./IAutoMovieFramedBox";

/**
 * Restate a world box as the base, height and radius the framing grammar solves
 * from.
 *
 * `radius` is half the horizontal diagonal rather than half the wider side. A
 * camera approaches on its staged bearing and an `orbit` sweeps that bearing 45
 * degrees, so the horizontal span the frame must hold varies with the bearing,
 * and its widest value over every bearing is exactly the box's diagonal.
 * Solving from the diagonal is therefore the one answer that holds from every
 * side, which keeps a crowd inside the frame for the whole of a move instead of
 * only at the instant the distance was solved.
 *
 * `base` is the box's bottom centre, not the members' centroid: a mass that is
 * denser on one flank has a centroid off its own middle, and framing there puts
 * the thin flank out of frame. All three values are in metres, and the box must
 * be ordered (`max >= min` on every axis), as every subject-box builder returns
 * it.
 *
 * @param box World box of the subject, in metres.
 * @returns A new framed box sharing no object with `box`.
 *
 * @evidence contracts/common.md#principled-implementation The widest horizontal half-span of an axis-aligned box over every viewing bearing is half its XZ diagonal, because the projected width `w·|cos θ| + d·|sin θ|` peaks at `hypot(w, d)` by Cauchy-Schwarz; `base` is the mid-point of the XZ extent at the minimum Y, and both rely on the box being ordered, which every subject-box builder guarantees.
 * @evidence contracts/common.md#clear-and-simple-design One pure reduction shared by `performShot` for node and group subjects and by the film-grammar observation, so the solve and the grade read the same three numbers from the same box.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every subject kind, figure, facade or formation, is reduced by the same three formulas with no minimum height or radius; a flat box yields a zero height that the caller, not this reduction, substitutes.
 * @evidence contracts/common.md#meaningful-documentation States why the radius is the diagonal rather than the wider side, why the base is the bottom centre rather than a centroid, the metre units, the ordered-box premise, and that the result aliases nothing.
 * @evidence contracts/performance.md#efficient-algorithms Constant time and space: two midpoints, one difference and one `Math.hypot` over the box's six coordinates.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure constant-time reduction of one box that coordinates no work across calls; `performShot` reuses the measured extents it is fed, not this result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned record and its fresh base vector.
 */
export function framedBoxOf (
  box: IAutoMovieSubjectBox,
): IAutoMovieFramedBox { return ({
  base: {
    x: (box.min.x + box.max.x) / 2,
    y: box.min.y,
    z: (box.min.z + box.max.z) / 2,
  },
  height: box.max.y - box.min.y,
  radius: Math.hypot(box.max.x - box.min.x, box.max.z - box.min.z) / 2,
}); }

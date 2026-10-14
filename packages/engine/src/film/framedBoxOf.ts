import { IAutoMovieSubjectBox } from "@automovie/interface";

import { midpoint } from "../math/midpoint";
import { IAutoMovieFramedBox } from "./IAutoMovieFramedBox";

/**
 * Restate a world box as the base, height and radius the framing grammar solves from.
 *
 * `radius` is half the horizontal diagonal rather than half the wider side. A camera approaches on its staged bearing and an `orbit` sweeps that bearing 45 degrees, so the horizontal span the frame must hold varies with the bearing, and its widest value over every bearing is exactly the box's diagonal. The diagonal bounds horizontal orthogonal projection at every bearing. It does not alone prove full perspective enclosure through a camera move; camera compilation and contract grading own their sampled view decisions.
 *
 * `base` is the box's bottom centre, not the members' centroid: a mass that is denser on one flank has a centroid off its own middle. All three values are in metres, and the box must be finite and ordered (`max >= min` on every axis). If the ordinary half-diagonal overflows before halving, halved coordinates recover a representable radius; ordinary finite results keep their arithmetic order. Height and a genuinely unrepresentable radius can still overflow, and callers own admission of those derived values.
 *
 * @param box World box of the subject, in metres.
 * @returns A new framed box sharing no object with `box`.
 *
 * @evidence contracts/common.md#principled-implementation The widest horizontal half-span of an axis-aligned box over every viewing bearing is half its XZ diagonal, because the projected width `w·|cos θ| + d·|sin θ|` peaks at `hypot(w, d)` by Cauchy-Schwarz; `base` is the mid-point of the XZ extent at the minimum Y, and both rely on the box being ordered, which every subject-box builder guarantees.
 * @evidence contracts/common.md#clear-and-simple-design One pure reduction shared by `performShot` for node and group subjects and by the film-grammar observation, so the solve and the grade read the same three numbers from the same box.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every subject kind, figure, facade or formation, is reduced by the same three formulas with no minimum height or radius; a flat box yields a zero height that the caller, not this reduction, substitutes.
 * @evidence contracts/common.md#meaningful-documentation States why the radius is the diagonal rather than the wider side, why the base is the bottom centre rather than a centroid, the metre units, the ordered-box premise, and that the result aliases nothing.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-dimensional scalar work uses two midpoint calls and one hypot, with a second half-coordinate hypot only when the ordinary radius is non-finite; no geometry population is traversed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure constant-time reduction of one box that coordinates no work across calls; `performShot` reuses the measured extents it is fed, not this result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned record and its fresh base vector.
 */
export function framedBoxOf (
  box: IAutoMovieSubjectBox,
): IAutoMovieFramedBox {
  const radius: number = Math.hypot(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
  const halfDiagonal: number = !Number.isFinite(radius) &&
    [box.min.x, box.max.x, box.min.z, box.max.z].every(Number.isFinite)
    ? Math.hypot(box.max.x / 2 - box.min.x / 2, box.max.z / 2 - box.min.z / 2)
    : radius;
  return {
    base: {
      x: midpoint(box.min.x, box.max.x),
      y: box.min.y,
      z: midpoint(box.min.z, box.max.z),
    },
    height: box.max.y - box.min.y,
    radius: halfDiagonal,
  };
}

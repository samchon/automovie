import {
  type IAutoMovieFramedBox,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { midpoint } from "../math/midpoint";

/**
 * Restate a world box as the base, height and radius the framing grammar solves
 * from.
 *
 * `radius` is half the horizontal diagonal rather than half the wider side. A
 * camera approaches on its staged bearing and an `orbit` sweeps that bearing 45
 * degrees, so the horizontal span the frame must hold varies with the bearing,
 * and its widest value over every bearing is exactly the box's diagonal. The
 * diagonal bounds horizontal orthogonal projection at every bearing. It does
 * not alone prove full perspective enclosure through a camera move; camera
 * compilation and contract grading own their sampled view decisions.
 *
 * `base` is the box's bottom centre, not the members' centroid: a mass that is
 * denser on one flank has a centroid off its own middle. All three values are
 * in metres, and the box must be finite and ordered (`max >= min` on every
 * axis). If the ordinary half-diagonal overflows before halving, halved
 * coordinates recover a representable radius; ordinary finite results keep
 * their arithmetic order. Height and a genuinely unrepresentable radius can
 * still overflow, and callers own admission of those derived values.
 *
 * @param box World box of the subject, in metres.
 * @returns A new framed box sharing no object with `box`.
 */
export function framedBoxOf(box: IAutoMovieSubjectBox): IAutoMovieFramedBox {
  const radius: number =
    Math.hypot(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
  const halfDiagonal: number =
    !Number.isFinite(radius) &&
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

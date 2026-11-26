import {
  type IAutoMovieFramedBox,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { midpoint } from "../math/internal/midpoint";

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
  // A coordinate difference can overflow only past half the largest double;
  // the halves are then subtracted instead.
  const extent: number = Math.max(
    Math.abs(box.min.x),
    Math.abs(box.max.x),
    Math.abs(box.min.z),
    Math.abs(box.max.z),
  );
  const halfDiagonal: number =
    extent > Number.MAX_VALUE / 2
      ? Math.hypot(box.max.x / 2 - box.min.x / 2, box.max.z / 2 - box.min.z / 2)
      : Math.hypot(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
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

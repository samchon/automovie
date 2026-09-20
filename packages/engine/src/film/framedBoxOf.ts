import { IAutoMovieFramedBox } from "./IAutoMovieFramedBox";
import { IAutoMovieSubjectBox } from "./IAutoMovieSubjectBox";

/**
 * Restate a world box as the base, height and radius the framing grammar solves
 * from.
 *
 * `radius` is HALF THE HORIZONTAL DIAGONAL rather than half the wider side. A
 * camera approaches on its staged bearing and an `orbit` sweeps that bearing 45
 * degrees, so the horizontal span the frame must hold varies with the bearing,
 * and its widest value over every bearing is exactly the box's diagonal.
 * Solving from the diagonal is therefore the one answer that holds from every
 * side, which is what keeps a crowd inside the frame for the whole of a move
 * instead of only at the instant the distance was solved.
 *
 * `base` is the box's bottom centre, not the members' centroid: a mass that is
 * denser on one flank has a centroid off its own middle, and framing there puts
 * the thin flank out of frame.
 *
 * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing framedBoxOf converts current world bounds into the base, vertical span, and horizontal radius required by landmark framing.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations framedBoxOf realizes landmark-based framing: Restate a world box as the base, height and radius the framing grammar solves from. `radius` is HALF THE HORIZONTAL DIAGONAL rather than half the wider side. A camera approaches on its staged bearing and an `orbit` sweeps that bearing 45 degrees, so the horizontal span the frame must hold varies with the bearing, and its widest value over every bearing is exactly the box's diagonal. Solving from the diagonal is therefore the one answer that holds from every side, which is what keeps a crowd inside the frame for the whole of a move instead of only at the instant the distance was solved. `base` is the box's bottom centre, not the members' centroid: a mass that is denser on one flank has a centroid off its own middle, and framing there puts the thin flank out of frame.
 */
export const framedBoxOf = (
  box: IAutoMovieSubjectBox,
): IAutoMovieFramedBox => ({
  base: {
    x: (box.min.x + box.max.x) / 2,
    y: box.min.y,
    z: (box.min.z + box.max.z) / 2,
  },
  height: box.max.y - box.min.y,
  radius: Math.hypot(box.max.x - box.min.x, box.max.z - box.min.z) / 2,
});

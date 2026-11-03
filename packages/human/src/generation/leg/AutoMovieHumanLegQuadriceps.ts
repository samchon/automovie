import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";

/**
 * The quadriceps' front as a relief window in its own frame: its own centre on
 * the thigh (0.45 of the bone), its own section angle, extents and
 * displacement axis, with a net whose three outer rings are zero, so its
 * height, slope and curvature vanish at the edge (rule J7).
 *
 * The rectus femoris and the vasti make the thigh's front convex in side view
 * from the groin to the suprapatellar level, fullest a little above the
 * thigh's middle. The window spans that run along the bone (1.8 local radii
 * either side of its centre, about 0.35 of the femur on f1) and the anterior
 * sector between the vastus medialis and the vastus lateralis (0.7 radians
 * either side of straight ahead), and pushes forward along the section's own
 * forward axis. It is a bump added to the tube's envelope; the tube is
 * rescaled to the girth law afterwards, so the bump moves volume to the front
 * and the tapes still read their inputs.
 *
 * The window's numbers are conventions awaiting a relief fit on the references
 * (as the foot's malleoli): their sizes are anatomical sizes in local radii,
 * not measured medians.
 */
export namespace AutoMovieHumanLegQuadriceps {
  /** The window's declaration. */
  export const WINDOW: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.quadriceps",
    segment: "thigh",
    share: 0.45,
    angle: 0,
    halfStation: 1.8,
    halfAngle: 0.7,
    height: 0.04,
    axis: [1, 0, 0],
  };

  /**
   * The relief on one leg.
   *
   * @param input The joints' heights and the local radius at the window's centre, mm.
   */
  export function of(input: AutoMovieHumanLegReliefWindow.IInput): IAutoMovieHumanRelief {
    return AutoMovieHumanLegReliefWindow.create(WINDOW, input);
  }
}

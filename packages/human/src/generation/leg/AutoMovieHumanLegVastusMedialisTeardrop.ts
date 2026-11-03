import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";

/**
 * The teardrop of the vastus medialis above the knee as a relief window in its own frame: its own centre on the
 * thigh (0.88 of the bone), its own section angle, extents and
 * displacement axis, with a net whose three outer rings are zero, so its
 * height, slope and curvature vanish at the edge (rule J7).
 *
 * The vastus medialis' fibres run low on the medial side above the patella (Gray 1918); it pushes anteromedially.
 *
 * The window's numbers are conventions awaiting a relief fit on the references
 * (as the foot's malleoli): their sizes are anatomical sizes in local radii,
 * not measured medians.
 */
export namespace AutoMovieHumanLegVastusMedialisTeardrop {
  /** The window's declaration. */
  export const WINDOW: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.vastusMedialisTeardrop",
    segment: "thigh",
    share: 0.88,
    angle: 5.4978,
    halfStation: 0.8,
    halfAngle: 0.5,
    height: 0.04,
    axis: [0.7071, 0, -0.7071],
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

import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";

/**
 * The kneecap as a relief window in its own frame: its own centre on the
 * shank (0.086 of the bone), its own section angle, extents and
 * displacement axis, with a net whose three outer rings are zero, so its
 * height, slope and curvature vanish at the edge (rule J7).
 *
 * Mid-patella stands 36 mm under the knee centre on the references (ANSUR II: 16.9 mm women, 3.3 mm men under the lateral epicondyle and 11.2 and 20.2 mm above tibiale); the patella is about 45 mm long and 50 mm broad, so a half extent of half a knee radius (27 mm) and 0.46 radians (25 mm at 54 mm radius). It pushes forward and 10 degrees down, along its own axis.
 *
 * The window's numbers are conventions awaiting a relief fit on the references
 * (as the foot's malleoli): their sizes are anatomical sizes in local radii,
 * not measured medians.
 */
export namespace AutoMovieHumanLegPatella {
  /** The window's declaration. */
  export const WINDOW: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.patella",
    segment: "shank",
    share: 0.086,
    angle: 0,
    halfStation: 0.5,
    halfAngle: 0.46,
    height: 0.1,
    axis: [0.9848, -0.1736, 0],
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

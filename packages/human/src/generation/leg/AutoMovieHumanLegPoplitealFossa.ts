import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";

/**
 * The hollow behind the knee as a relief window in its own frame: its own centre on the
 * thigh (0.962 of the bone), its own section angle, extents and
 * displacement axis, with a net whose three outer rings are zero, so its
 * height, slope and curvature vanish at the edge (rule J7).
 *
 * The popliteal fossa spans from about 40 mm above to 20 mm under the joint line, centred 15 mm above it; the hollow is the skin moved forward, into the leg, between the hamstring tendons.
 *
 * The window's numbers are conventions awaiting a relief fit on the references
 * (as the foot's malleoli): their sizes are anatomical sizes in local radii,
 * not measured medians.
 */
export namespace AutoMovieHumanLegPoplitealFossa {
  /** The window's declaration. */
  export const WINDOW: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.poplitealFossa",
    segment: "thigh",
    share: 0.962,
    angle: 3.1416,
    halfStation: 0.7,
    halfAngle: 0.45,
    height: 0.05,
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

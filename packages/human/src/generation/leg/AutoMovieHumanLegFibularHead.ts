import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";

/**
 * The fibular head as a relief window in its own frame: its own centre on the
 * shank (0.07 of the bone), its own section angle, extents and
 * displacement axis, with a net whose three outer rings are zero, so its
 * height, slope and curvature vanish at the edge (rule J7).
 *
 * The fibular head stands slightly above the level of the tibial tuberosity, behind and lateral to the lateral tibial condyle (Gray 1918, docs/anatomy/skeleton.md), so its window stands posterolateral (120 degrees round the section) and apart from the lateral condyle's at 90 degrees: two bumps summed at one place read as a knob, which the references' lateral knee does not show.
 *
 * The window's numbers are conventions awaiting a relief fit on the references
 * (as the foot's malleoli): their sizes are anatomical sizes in local radii,
 * not measured medians.
 */
export namespace AutoMovieHumanLegFibularHead {
  /** The window's declaration. */
  export const WINDOW: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.fibularHead",
    segment: "shank",
    share: 0.07,
    angle: 2.0944,
    halfStation: 0.4,
    halfAngle: 0.35,
    height: 0.025,
    axis: [-0.5, 0, 0.866],
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

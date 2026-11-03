import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";

/**
 * The fibular head as a relief window in its own frame: its own centre on the
 * shank (0.07 of the bone), its own section angle, extents and
 * displacement axis, with a net whose three outer rings are zero, so its
 * height, slope and curvature vanish at the edge (rule J7).
 *
 * The fibular head stands slightly above the level of the tibial tuberosity, behind and lateral to the lateral tibial condyle (Gray 1918, docs/anatomy/skeleton.md).
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
    angle: 1.7453,
    halfStation: 0.3,
    halfAngle: 0.3,
    height: 0.04,
    axis: [-0.1736, 0, 0.9848],
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

import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";

/**
 * The lateral head of the gastrocnemius as a relief window in its own frame: its own centre on the
 * shank (0.18 of the bone), its own section angle, extents and
 * displacement axis, with a net whose three outer rings are zero, so its
 * height, slope and curvature vanish at the edge (rule J7).
 *
 * The lateral head, higher and smaller than the medial (map.md, 7.2); it pushes out along its own axis, backward and lateral.
 *
 * The window's numbers are conventions awaiting a relief fit on the references
 * (as the foot's malleoli): their sizes are anatomical sizes in local radii,
 * not measured medians.
 */
export namespace AutoMovieHumanLegGastrocnemiusLateralHead {
  /** The window's declaration. */
  export const WINDOW: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.gastrocnemiusLateralHead",
    segment: "shank",
    share: 0.18,
    angle: 2.3562,
    halfStation: 1.2,
    halfAngle: 0.5,
    height: 0.04,
    axis: [-0.7071, 0, 0.7071],
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

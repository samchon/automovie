import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";

/**
 * The medial head of the gastrocnemius as a relief window in its own frame: its own centre on the
 * shank (0.22 of the bone), its own section angle, extents and
 * displacement axis, with a net whose three outer rings are zero, so its
 * height, slope and curvature vanish at the edge (rule J7).
 *
 * The medial head is the lower and larger (map.md, 7.2); the belly runs about 150 mm, so a half extent of 1.4 radii; it pushes out along its own axis, backward and medial.
 *
 * The window's numbers are conventions awaiting a relief fit on the references
 * (as the foot's malleoli): their sizes are anatomical sizes in local radii,
 * not measured medians.
 */
export namespace AutoMovieHumanLegGastrocnemiusMedialHead {
  /** The window's declaration. */
  export const WINDOW: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.gastrocnemiusMedialHead",
    segment: "shank",
    share: 0.22,
    angle: 4.2761,
    halfStation: 1.4,
    halfAngle: 0.6,
    height: 0.06,
    axis: [-0.4226, 0, -0.9063],
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

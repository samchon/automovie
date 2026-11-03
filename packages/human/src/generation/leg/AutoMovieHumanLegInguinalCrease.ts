import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";

/**
 * The groin crease as a relief window in its own frame: its own centre on the
 * thigh (0.2 of the bone), its own section angle, extents and
 * displacement axis, with a net whose three outer rings are zero, so its
 * height, slope and curvature vanish at the edge (rule J7).
 *
 * The inguinal crease runs obliquely at the front of the upper thigh; as a shallow hollow, the skin moved back into the leg.
 *
 * The window's numbers are conventions awaiting a relief fit on the references
 * (as the foot's malleoli): their sizes are anatomical sizes in local radii,
 * not measured medians.
 */
export namespace AutoMovieHumanLegInguinalCrease {
  /** The window's declaration. */
  export const WINDOW: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.inguinalCrease",
    segment: "thigh",
    share: 0.2,
    angle: 6.1087,
    halfStation: 0.4,
    halfAngle: 0.5,
    height: 0.03,
    axis: [-1, 0, 0],
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

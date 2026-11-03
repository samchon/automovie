import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";

/**
 * The hollow over the greater trochanter as a relief window in its own frame: its own centre on the
 * thigh (0.2 of the bone), its own section angle, extents and
 * displacement axis, with a net whose three outer rings are zero, so its
 * height, slope and curvature vanish at the edge (rule J7).
 *
 * The greater trochanter is a depression when standing (Gray 1918, docs/anatomy/skeleton.md); it straddles the crotch ring, so only its lower part lies in the leg and the trunk owns the rest.
 *
 * The window's numbers are conventions awaiting a relief fit on the references
 * (as the foot's malleoli): their sizes are anatomical sizes in local radii,
 * not measured medians.
 */
export namespace AutoMovieHumanLegGreaterTrochanter {
  /** The window's declaration. */
  export const WINDOW: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.greaterTrochanter",
    segment: "thigh",
    share: 0.2,
    angle: 1.5708,
    halfStation: 0.6,
    halfAngle: 0.4,
    height: 0.02,
    axis: [0, 0, -1],
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

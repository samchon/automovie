import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";

/**
 * The crease under the buttock as a relief window in its own frame: its own centre at the thigh's root, the leg's first own row under
 * the crotch ring (where the trunk's ring has handed the skin over), its own section angle, extents and
 * displacement axis, with a net whose three outer rings are zero, so its
 * height, slope and curvature vanish at the edge (rule J7).
 *
 * The buttock window of the trunk starts at the crotch ring with height, slope and curvature zero, so the fold is the ring's own posterior arc; this window continues it a short way down as a shallow hollow, the skin moved forward.
 *
 * The window's numbers are conventions awaiting a relief fit on the references
 * (as the foot's malleoli): their sizes are anatomical sizes in local radii,
 * not measured medians.
 */
export namespace AutoMovieHumanLegInfraglutealFold {
  /** The window's declaration. */
  export const WINDOW: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.infraglutealFold",
    segment: "thigh",
    share: 0.2,
    angle: 3.4907,
    halfStation: 0.4,
    halfAngle: 0.5,
    height: 0.03,
    axis: [1, 0, 0],
    anchor: "crotch",
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

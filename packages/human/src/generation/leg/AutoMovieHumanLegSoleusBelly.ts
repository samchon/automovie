import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";

/**
 * The soleus' distal bulge either side of the Achilles tendon as a relief window in its own frame: its own centre on the
 * shank (0.55 of the bone), its own section angle, extents and
 * displacement axis, with a net whose three outer rings are zero, so its
 * height, slope and curvature vanish at the edge (rule J7).
 *
 * The soleus shows distal to the gastrocnemius' bellies (Gray 1918); it pushes straight back.
 *
 * The window's numbers are conventions awaiting a relief fit on the references
 * (as the foot's malleoli): their sizes are anatomical sizes in local radii,
 * not measured medians.
 */
export namespace AutoMovieHumanLegSoleusBelly {
  /** The window's declaration. */
  export const WINDOW: AutoMovieHumanLegReliefWindow.IWindow = {
    name: "leg.soleusBelly",
    segment: "shank",
    share: 0.55,
    angle: 3.1416,
    halfStation: 1,
    halfAngle: 0.9,
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

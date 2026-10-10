import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootedAim } from "./IHumanFaceHairRootedAim";
import { escapeHumanFaceHairRootedStem } from "./escapeHumanFaceHairRootedStem";
import { limitHumanFaceHairTurn } from "./limitHumanFaceHairTurn";

/**
 * Aim a rooted stem away from two surfaces at once, within one station's
 * construction turn.
 *
 * The goal is `escapeHumanFaceHairRootedStem`'s maximum-margin bisector of the
 * station's skin and the surface a trial chord reaches; an antiparallel pair
 * refuses there. The goal is held to the construction turn of the station's
 * nominal step from the previous chord. That bound belongs to the station, not
 * to a clipped trial, so repeated trials at one station never shrink it:
 * shrinking the turn together with a clipped chord is what traps a stem in a
 * concave notch. Inputs are unchanged.
 */
export function aimHumanFaceHairRootedStem(
  props: IHumanFaceHairRootedAim,
): IAutoMovieVector3 {
  return limitHumanFaceHairTurn({
    before: props.before,
    direction: escapeHumanFaceHairRootedStem(props.normal, props.blocking),
    step: props.step,
  });
}

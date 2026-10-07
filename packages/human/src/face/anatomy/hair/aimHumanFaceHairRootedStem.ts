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
 *
 * @evidence contracts/common.md#principled-implementation Combines the maximum-margin goal with the per-station construction turn, so the result is the furthest allowed rotation toward the free cone.
 * @evidence contracts/common.md#clear-and-simple-design Composes the escape goal and the turn limiter, each owned once, for the trial preview and the no-progress retry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No wall slide, waypoint or tolerance; the turn bound never shrinks with a clipped chord.
 * @evidence contracts/common.md#meaningful-documentation States the goal, the bound and why the bound is per station.
 * @evidence contracts/modeling.md#spatial-conventions Directions are unit head-frame vectors; the step is metres.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no station; the integrator admits it.
 * @evidence contracts/modeling.md#shared-boundaries Separates from both actual surfaces of the one host collider without changing clearance or root support.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
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

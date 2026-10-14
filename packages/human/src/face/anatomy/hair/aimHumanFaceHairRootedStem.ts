import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootedAim } from "./IHumanFaceHairRootedAim";
import { escapeHumanFaceHairRootedStem } from "./escapeHumanFaceHairRootedStem";
import { limitHumanFaceHairTurn } from "./limitHumanFaceHairTurn";

/**
 * Aim a rooted stem away from two surfaces at once, within one station's construction turn.
 *
 * The goal is `escapeHumanFaceHairRootedStem`'s maximum-margin bisector of the station's skin and the surface a trial chord reaches; an antiparallel pair refuses there. The goal is held to the construction turn of the station's nominal step from the previous chord. That bound belongs to the station, not to a clipped trial, so repeated trials at one station never shrink it: shrinking the turn together with a clipped chord is what traps a stem in a concave notch. Inputs are unchanged.
 *
 * @evidence contracts/common.md#principled-implementation The normalized common-margin bisector of unit skin and blocking normals is limited from the preceding chord by the nominal station turn.
 * @evidence contracts/common.md#clear-and-simple-design Escape construction and turn limiting remain canonical separate owners used by rooted steering and interval trials.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Antiparallel normals refuse in the escape owner and clipped travel does not shrink the station's turn; these are geometric conventions, not clinical capacity.
 * @evidence contracts/common.md#meaningful-documentation Inputs are read-only unit head directions plus metres, and the returned direction does not itself admit a real chord.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed-vector operations and bounded angular arithmetic take constant work and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared escape and construction-turn owners are reused instead of a second steering formula; no mutable-input cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned direction may escape; helpers may reuse an admitted input vector, and the caller owns all vectors.
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

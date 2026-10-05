import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootedLookaheadDecision } from "./IHumanFaceHairRootedLookaheadDecision";
import type { IHumanFaceHairStemRefusal } from "./IHumanFaceHairStemRefusal";
import type { IHumanFaceHairStemRefusalContext } from "./IHumanFaceHairStemRefusalContext";
import type { IHumanFaceHairStemStation } from "./IHumanFaceHairStemStation";
import { anticipateHumanFaceHairRootedStem } from "./anticipateHumanFaceHairRootedStem";
import { humanFaceHairFrame } from "./humanFaceHairFrame";
import { steerHumanFaceHairRootedStep } from "./steerHumanFaceHairRootedStep";

/**
 * Assemble the record of a rooted stem that refused, from the walk's state.
 *
 * Up to the last six stations are reported with their measured clearance,
 * nearest triangle, outward normal and arriving chord. Each earlier station's
 * look-ahead decision is recomputed by the same steer and look-ahead owners
 * from the inputs that station had: its arriving chord, its normal and its
 * nominal chord min(step, length - travelled). Those owners are deterministic
 * in their inputs, so the recomputed decision is the one the walk made. The
 * refusing station's decision and trials are passed as made.
 *
 * Recomputation spends the shared budget like the original decisions did.
 * A station whose decision cannot be recomputed because that budget is
 * exhausted reports null instead of replacing the refusal with a budget error.
 * This runs only when a stem refuses, so admitted locks pay nothing for it.
 *
 * @evidence contracts/common.md#principled-implementation Reports the walk's own measurements and recomputes earlier decisions with the same deterministic owners and inputs.
 * @evidence contracts/common.md#clear-and-simple-design One owner of refusal reporting, apart from the walk's admission logic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Runs only on refusal; it changes no admission, geometry or admitted work.
 * @evidence contracts/common.md#meaningful-documentation States what is reported, how earlier decisions are recovered and the budget case.
 * @evidence contracts/modeling.md#spatial-conventions Positions and clearances are head-frame metres; directions are unit vectors.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A refused stem emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The contact and interval own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical state only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 */
export function describeHumanFaceHairStemRefusal(
  props: IHumanFaceHairStemRefusalContext,
): IHumanFaceHairStemRefusal {
  const { points, contact } = props;
  const last = points.length - 1;
  const first = Math.max(0, last - 5);
  let travelled = 0;
  for (let at = 1; at <= first; at++)
    travelled += Vector3.length(Vector3.subtract(points[at], points[at - 1]));
  const stations: IHumanFaceHairStemStation[] = [];
  for (let at = first; at <= last; at++) {
    if (at > first)
      travelled += Vector3.length(Vector3.subtract(points[at], points[at - 1]));
    const point = points[at];
    const hit = contact.sample(point);
    const normal =
      at === 0 ? humanFaceHairFrame.direction(props.rootNormal) : contact.outward(point, hit);
    const chord: IAutoMovieVector3 | null =
      at === 0
        ? null
        : humanFaceHairFrame.direction(Vector3.subtract(point, points[at - 1]));
    let lookahead: IHumanFaceHairRootedLookaheadDecision | null = null;
    if (at === last) lookahead = props.lookahead;
    else if (chord !== null) {
      const step = Math.min(props.step, props.length - travelled);
      try {
        lookahead = anticipateHumanFaceHairRootedStem({
          point,
          heading: steerHumanFaceHairRootedStep({
            point,
            before: chord,
            normal,
            step,
            contact,
            budget: props.budget,
          }),
          before: chord,
          normal,
          step,
          raycaster: props.raycaster,
          contact,
          budget: props.budget,
        });
      } catch (error) {
        if (props.budget.remaining !== 0) throw error;
        lookahead = null;
      }
    }
    stations.push({
      point: { ...point },
      clearance: hit.signedDistance,
      triangle: hit.triangle,
      normal,
      chord,
      lookahead,
    });
  }
  return { stations, trials: props.trials };
}

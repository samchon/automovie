import { Vector3 } from "@automovie/engine";

import { HumanFaceHairStemRefusalError } from "./HumanFaceHairStemRefusalError";
import type { IHumanFaceHairRootedStemOutcome } from "./IHumanFaceHairRootedStemOutcome";
import type { IHumanFaceHairRootedStemStep } from "./IHumanFaceHairRootedStemStep";
import type { IHumanFaceHairStemTrial } from "./IHumanFaceHairStemTrial";
import { aimHumanFaceHairRootedStem } from "./aimHumanFaceHairRootedStem";
import { anticipateHumanFaceHairRootedStem } from "./anticipateHumanFaceHairRootedStem";
import { createHumanFaceHairExteriorInterval } from "./createHumanFaceHairExteriorInterval";
import { describeHumanFaceHairStemRefusal } from "./describeHumanFaceHairStemRefusal";
import { humanFaceHairFrame } from "./humanFaceHairFrame";
import { steerHumanFaceHairRootedStep } from "./steerHumanFaceHairRootedStep";

/**
 * Admit one chord of a rooted stem, or refuse by name.
 *
 * The first chord keeps the root's emergence direction. Every later station's
 * nominal chord min(step, length - travelled) fixes its construction turn for
 * every trial: a clipped trial never shrinks the turn, which would trap the
 * stem in a concave notch with geometrically vanishing progress. Before
 * trying, the station looks ahead along its continuation and may begin a
 * needed turn early (anticipateHumanFaceHairRootedStem).
 *
 * Each trial is certified by the exterior interval. An unclipped trial is
 * admitted at its full chord. A clipped trial is admitted only when its
 * certified interior point is strictly clearer than the station; otherwise the
 * stem turns toward the maximum-margin direction of its own skin and the
 * surface the chord reaches. When that turn no longer changes the direction,
 * the stem refuses with a HumanFaceHairStemRefusalError whose detail records
 * the last stations and every trial here. Trials are recorded only once one is
 * clipped, so an unclipped station allocates nothing for the record.
 */
export function stepHumanFaceHairRootedStem(
  props: IHumanFaceHairRootedStemStep,
): IHumanFaceHairRootedStemOutcome {
  const { points, normal, hit, contact, budget } = props;
  const p = points[points.length - 1];
  const first = points.length === 1;
  const step = Math.min(props.step, props.length - props.travelled);
  const before = first
    ? props.initial
    : humanFaceHairFrame.direction(
        Vector3.subtract(p, points[points.length - 2]),
      );
  const lookahead = first
    ? undefined
    : anticipateHumanFaceHairRootedStem({
        point: p,
        heading: steerHumanFaceHairRootedStep({
          point: p,
          before,
          normal,
          step,
          contact,
          budget,
        }),
        before,
        normal,
        step,
        raycaster: props.raycaster,
        contact,
        budget,
      });
  let along = lookahead === undefined ? props.initial : lookahead.direction;
  let trials: IHumanFaceHairStemTrial[] | undefined;
  while (true) {
    const interval = createHumanFaceHairExteriorInterval({
      root: p,
      direction: along,
      maximum: step,
      originOnSkin: first,
      contact,
      raycaster: props.raycaster,
      rootBoundary: props.rootBoundary,
      budget,
    });
    const travel = interval.bounded
      ? interval.low + (interval.bound - interval.low) / 2
      : interval.bound;
    if (interval.bounded && !first) {
      const reached = interval.pointAt(travel);
      interval.spend();
      const blocked = contact.sample(reached);
      const blocking = contact.outward(reached, blocked);
      (trials ??= []).push({
        direction: along,
        bound: interval.bound,
        bounded: true,
        reached,
        reachedClearance: blocked.signedDistance,
        reachedTriangle: blocked.triangle,
        blocking,
      });
      if (blocked.signedDistance > hit.signedDistance)
        return {
          taken: {
            point: reached,
            distance: Vector3.length(Vector3.subtract(reached, p)),
          },
          interval,
        };
      const turned = aimHumanFaceHairRootedStem({
        before,
        normal,
        blocking,
        step,
      });
      if (turned.x === along.x && turned.y === along.y && turned.z === along.z)
        throw new HumanFaceHairStemRefusalError(
          "A rooted hair stem cannot leave the concave skin between triangles " +
            hit.triangle +
            " and " +
            blocked.triangle +
            " within its construction turn at (" +
            [p.x, p.y, p.z].map((v) => v.toFixed(4)).join(", ") +
            ") m, clearance " +
            hit.signedDistance.toExponential(2) +
            " m.",
          describeHumanFaceHairStemRefusal({
            points,
            rootNormal: props.rootNormal,
            step: props.step,
            length: props.length,
            contact,
            raycaster: props.raycaster,
            budget,
            lookahead: lookahead!,
            trials,
          }),
        );
      along = turned;
      continue;
    }
    const point = interval.pointAt(travel);
    interval.spend();
    if (!(contact.sample(point).signedDistance > contact.epsilon))
      throw new Error("A rooted hair chord has no admitted exterior endpoint.");
    return {
      taken: { point, distance: Vector3.length(Vector3.subtract(point, p)) },
      interval,
    };
  }
}

import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";
import type { IHumanFaceHairRootedLookaheadDecision as ImportedIHumanFaceHairRootedLookaheadDecision } from "./IHumanFaceHairRootedLookaheadDecision";
import { Vector3, type IAutoMovieSignedMeshQueryHit as ImportedIAutoMovieSignedMeshQueryHit } from "@automovie/engine";

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
 * The first chord keeps the root's emergence direction. Every later station's nominal chord min(step, length - travelled) fixes its construction turn for every trial: a clipped trial never shrinks the turn, which would trap the stem in a concave notch with geometrically vanishing progress. Before trying, the station looks ahead along its continuation and may begin a needed turn early (anticipateHumanFaceHairRootedStem).
 *
 * Each trial is certified by the exterior interval. An unclipped trial is admitted at its full chord. A clipped trial is admitted only when its certified interior point is strictly clearer than the station; otherwise the stem turns toward the maximum-margin direction of its own skin and the surface the chord reaches. When that turn no longer changes the direction, the stem refuses with a HumanFaceHairStemRefusalError whose detail records the last stations and every trial here. Trials are recorded only once one is clipped, so an unclipped station allocates nothing for the record.
 *
 * @evidence contracts/common.md#principled-implementation Each trial receives a certified exterior interval, accepting a clipped chord only when its interior endpoint strictly improves clearance.
 * @evidence contracts/common.md#clear-and-simple-design Initial emergence and later nominal-turn previews feed one explicit rooted-step result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No changed aim after a blocked trial causes named stem refusal; clipped travel never shrinks nominal station turn or enlarges root support.
 * @evidence contracts/common.md#meaningful-documentation Actual measured chord metres and its interval are returned together for the owning walk's metric accounting.
 * @evidence contracts/performance.md#efficient-algorithms Cost follows budgeted trial intervals and preview queries; diagnostic reconstruction occurs only on refusal.
 * @evidence contracts/performance.md#reuse-equivalent-work Readers and budget are shared across trials, and the last actual lookahead is passed to refusal details.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Trial arrays begin only after clipping and are local or error-owned; successful outcomes retain no full trial history.
 */
export function stepHumanFaceHairRootedStem(
  props: IHumanFaceHairRootedStemStep,
): IHumanFaceHairRootedStemOutcome {
  const { points, normal, hit, contact, budget }: IHumanFaceHairRootedStemStep = props;
  const p: ImportedIAutoMovieVector3 = points[points.length - 1];
  const first: boolean = points.length === 1;
  const step: number = Math.min(props.step, props.length - props.travelled);
  const before: ImportedIAutoMovieVector3 = first
    ? props.initial
    : humanFaceHairFrame.direction(
        Vector3.subtract(p, points[points.length - 2]),
      );
  const lookahead: ImportedIHumanFaceHairRootedLookaheadDecision | undefined = first
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
  let along: ImportedIAutoMovieVector3 = lookahead === undefined ? props.initial : lookahead.direction;
  let trials: IHumanFaceHairStemTrial[] | undefined;
  while (true) {
    const interval: { low: number; bound: number; bounded: boolean; rootHit: ImportedIAutoMovieSignedMeshQueryHit; pointAt: (travel: number) => ImportedIAutoMovieVector3; spend: () => void; } = createHumanFaceHairExteriorInterval({
      root: p,
      direction: along,
      maximum: step,
      originOnSkin: first,
      contact,
      raycaster: props.raycaster,
      rootBoundary: props.rootBoundary,
      budget,
    });
    const travel: number = interval.bounded
      ? interval.low + (interval.bound - interval.low) / 2
      : interval.bound;
    if (interval.bounded && !first) {
      const reached: ImportedIAutoMovieVector3 = interval.pointAt(travel);
      interval.spend();
      const blocked: ImportedIAutoMovieSignedMeshQueryHit = contact.sample(reached);
      const blocking: ImportedIAutoMovieVector3 = contact.outward(reached, blocked);
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
      const turned: ImportedIAutoMovieVector3 = aimHumanFaceHairRootedStem({
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
            [p.x, p.y, p.z].map((v: number): string => v.toFixed(4)).join(", ") +
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
    const point: ImportedIAutoMovieVector3 = interval.pointAt(travel);
    interval.spend();
    if (!(contact.sample(point).signedDistance > contact.epsilon))
      throw new Error("A rooted hair chord has no admitted exterior endpoint.");
    return {
      taken: { point, distance: Vector3.length(Vector3.subtract(point, p)) },
      interval,
    };
  }
}

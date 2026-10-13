import type { IHumanFaceHairContact as ImportedIHumanFaceHairContact } from "./IHumanFaceHairContact";
import type { IHumanFaceHairRootedStemOutcome as ImportedIHumanFaceHairRootedStemOutcome } from "./IHumanFaceHairRootedStemOutcome";
import { Vector3, type IAutoMovieMeshQueryBudget as ImportedIAutoMovieMeshQueryBudget, type IAutoMovieSignedMeshQueryHit as ImportedIAutoMovieSignedMeshQueryHit } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHairCurve } from "./IAutoMovieHumanFaceHairCurve";
import type { IHumanFaceHairIntegration } from "./IHumanFaceHairIntegration";
import type { IHumanFaceHairMetric } from "./IHumanFaceHairMetric";
import type { IHumanFaceHairStationStep } from "./IHumanFaceHairStationStep";
import { createHumanFaceHairCurveStart } from "./createHumanFaceHairCurveStart";
import { createHumanFaceHairExteriorInterval } from "./createHumanFaceHairExteriorInterval";
import { humanFaceHairFrame } from "./humanFaceHairFrame";
import { humanFaceHairFreeDistanceBound } from "./humanFaceHairFreeDistanceBound";
import { limitHumanFaceHairTurn } from "./limitHumanFaceHairTurn";
import { stepHumanFaceHairRootedStem } from "./stepHumanFaceHairRootedStem";
import { transportHumanFaceHairGatherStep } from "./transportHumanFaceHairGatherStep";

const requireDirection: (value: IAutoMovieVector3) => IAutoMovieVector3 = humanFaceHairFrame.direction;

/**
 * Walk one metric lock from its root at one emergence elevation, with an explicit curved surface-boundary stem. The initial discrete chord retains the root owner's desired tangent at the caller's exit elevation `degrees` (integrateHumanFaceHairCurve chooses it). Each stem station's chord is chosen by stepHumanFaceHairRootedStem until full free clearance: per-station construction turn, look-ahead, strict-progress admission of clipped chords and a named HumanFaceHairStemRefusalError when the stem cannot leave its skin. Every stem station remains in the emitted curve; freeFrom identifies the first full-clearance one. This surface proxy is not buried follicle anatomy.
 *
 * The one loop spends stem and free travel from the same target length/budget. Field phase, gathering observation and tie crossings use actual cumulative metric during the stem too. Length or budget exhaustion before free clearance refuses rather than returning an indefinitely skin-adjacent lock. A hierarchy placer is called once after stem completion: acceptance preserves that stem, while rejection continues this same walk/state/budget without relaunching. Gathered locks cannot substitute hierarchy placement for tie completion. Regional guide length and post-clump strand metric/contact retain their existing owners; no numerical document gains a personal curve control.
 *
 * Distance to a closed set is 1-Lipschitz. Free stations use clearance step/2 + requested clearance, so their connecting segments retain the requested clearance along their whole length, which is the fibre path's own guarantee; the ribbon meshed on it is wider than that path and `buildHumanFaceHairMesh` keeps its corners outside. A scale-derived allowance is added before contact iteration. Contact admission consumes one allowance; chord admission and terminal truncation can each consume half an allowance under the nearest-endpoint distance bound. This avoids bisecting a free step solely because coordinate subtraction rounded its length above the nominal step. The root fan is a separate boundary transition; this free-path argument does not prove root-fan or hair-to-hair nonintersection.
 *
 * A step the contact blocks entirely refuses, naming where the lock stopped, its clearance there, the surface normal and the combed direction. A slide along the blocking wall was measured on the population and removed; a refusal far from any surface means the closed contact surface is not embedded there, which is what the builder's closure (a fan from its rim's current centre) exists to prevent.
 *
 * Contact projects outside, then step bisection limits chord length. The last chord is truncated by its remaining metric length. Blocked directions, unrepresentable steps, short emergence and exhausted iteration budgets refuse instead of returning a shorter lock or stored personal corrective. The current station's signed distance also certifies a free next step: by the closed surface's 1-Lipschitz distance bound, a candidate at most one step away cannot need projection when the current distance exceeds the contact projector's fibre-path clearance by that step and a floating-point margin. Such a step uses the exact same candidate the contact projector would return; stations near skin still take the original projection and bisection path.
 *
 * @evidence contracts/common.md#principled-implementation One loop spends rooted and free metric through canonical stem admission, gather crossings and projected free steps.
 * @evidence contracts/common.md#clear-and-simple-design Hierarchy placement occurs once after full-clearance stem completion and rejection continues the same state rather than relaunching.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Insufficient length, no representable progress or exhausted budget refuse; boundary stems are numerical proxies and no GPU/clinical proof is provided.
 * @evidence contracts/common.md#meaningful-documentation freeFrom identifies the first full-clearance station and complete output retains every actual rooted chord.
 * @evidence contracts/performance.md#efficient-algorithms Work follows emitted stations plus budgeted previews/retractions, with up to 48 step bisections when projection exceeds the nominal chord.
 * @evidence contracts/performance.md#reuse-equivalent-work A strict Lipschitz witness skips unnecessary free projection using the same candidate; field, contact and gather stage are retained throughout one walk.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned point history grows with admitted stations under caller budget/length, and only that final curve escapes after tie completion.
 */
export function walkHumanFaceHairCurve(
  props: IHumanFaceHairIntegration,
  metric: IHumanFaceHairMetric,
  degrees: number,
): IAutoMovieHumanFaceHairCurve {
  const { layer }: IHumanFaceHairIntegration = props;
  const {
    stage,
    length,
    contact: rule,
    budget,
    direction: initialDirection,
  }: { stage: { pending: () => boolean; direction(point: IAutoMovieVector3, normal: IAutoMovieVector3, distance: number): IAutoMovieVector3; observe(point: IAutoMovieVector3, distance: number): void; crossing(from: IAutoMovieVector3, to: IAutoMovieVector3): number | undefined; enter: (point: IAutoMovieVector3, distance: number) => void; assertTied(last: IAutoMovieVector3): void; }; length: number; contact: ImportedIHumanFaceHairContact; budget: ImportedIAutoMovieMeshQueryBudget; direction: IAutoMovieVector3; } = createHumanFaceHairCurveStart(props, metric, degrees);
  const h: number = layer.samplingStep;
  const { clearance, epsilon, sample, outward, project: contact }: ImportedIHumanFaceHairContact = rule;
  const points: { x: number; y: number; z: number; }[] = [{ ...props.root }];
  let cumulative: number = 0;
  let freeFrom: number | undefined;
  let gatherOffset: number | undefined;
  let p: { x: number; y: number; z: number; } = points[0];
  while (cumulative < length && budget.remaining > 0) {
    budget.remaining--;
    const hit: ImportedIAutoMovieSignedMeshQueryHit = sample(p);
    stage.observe(p, cumulative);
    const normal: IAutoMovieVector3 =
      points.length === 1 ? requireDirection(props.normal) : outward(p, hit);
    const rooted: boolean = freeFrom === undefined;
    const first: boolean = points.length === 1;
    // The root tangent applies to the initial discrete chord. Until full free
    // clearance, the geometric outward direction grows the boundary stem; the
    // authored field and gathering clock retain their real cumulative distance.
    let direction: IAutoMovieVector3 = first
      ? initialDirection
      : stage.direction(p, normal, cumulative);
    if (rooted && !first) direction = normal;
    if (
      !rooted &&
      hit.signedDistance <= clearance + h &&
      Vector3.dot(direction, normal) < 0
    )
      direction = requireDirection(
        Vector3.subtract(
          direction,
          Vector3.scale(normal, Vector3.dot(direction, normal)),
        ),
      );
    if (points.length > 1)
      direction = limitHumanFaceHairTurn({
        before: requireDirection(
          Vector3.subtract(
            points[points.length - 1],
            points[points.length - 2],
          ),
        ),
        direction,
        step: rooted ? Math.min(h, length - cumulative) : h,
      });
    // One step along a direction: the contact's own projection of a full
    // step, bisected back when that projection lands farther than the step,
    // which is the chord bound the clearance argument rests on.
    const advance: (along: IAutoMovieVector3) => IHumanFaceHairStationStep = (along: IAutoMovieVector3): IHumanFaceHairStationStep => {
      // A pending free lock acquired its datum at its only rooted-to-free
      // transition. Tie state never returns from the tail to pending.
      const transported: boolean = stage.pending() && layer.gather!.strength > 0;
      const candidate: IAutoMovieVector3 = Vector3.add(p, Vector3.scale(along, h));
      const move: (parameter: number) => IAutoMovieVector3 = (parameter: number): IAutoMovieVector3 =>
        transported
          ? transportHumanFaceHairGatherStep({
              point: p,
              direction: along,
              normal,
              parameter,
              strength: layer.gather!.strength,
              offset: gatherOffset!,
              contact: rule,
              budget,
            }).point
          : contact(Vector3.add(p, Vector3.scale(along, parameter)));
      let point: IAutoMovieVector3 = transported
        ? move(h)
        : humanFaceHairFreeDistanceBound({
              sampled: p,
              distance: hit.signedDistance,
              candidate,
              required: clearance,
              allowance: epsilon,
            })
          ? candidate
          : contact(candidate);
      let distance: number = Vector3.length(Vector3.subtract(point, p));
      if (distance > h + epsilon) {
        let low: number = 0,
          high: number = h;
        point = p;
        for (let bisect: number = 0; bisect < 48; bisect++) {
          const middle: number = (low + high) / 2;
          const trial: IAutoMovieVector3 = move(middle);
          if (Vector3.length(Vector3.subtract(trial, p)) > h) high = middle;
          else {
            low = middle;
            point = trial;
          }
        }
        distance = Vector3.length(Vector3.subtract(point, p));
      }
      return { point, distance };
    };
    let interval:
      | ReturnType<typeof createHumanFaceHairExteriorInterval>
      | undefined;
    let taken: IHumanFaceHairStationStep;
    if (rooted) {
      const outcome: ImportedIHumanFaceHairRootedStemOutcome = stepHumanFaceHairRootedStem({
        points,
        initial: initialDirection,
        normal,
        rootNormal: props.normal,
        hit,
        step: h,
        length,
        travelled: cumulative,
        contact: rule,
        raycaster: props.raycaster,
        rootBoundary: props.rootBoundary,
        budget,
      });
      taken = outcome.taken;
      interval = outcome.interval;
    } else taken = advance(direction);
    let q: IAutoMovieVector3 = taken.point;
    const distance: number = taken.distance;
    if (!(distance > epsilon) || !Number.isFinite(distance))
      throw new Error(
        "Contact blocks a representable numerical hair step at (" +
          [p.x, p.y, p.z].map((v: number): string => v.toFixed(4)).join(", ") +
          ") m, " +
          (1000 * cumulative).toFixed(1) +
          " mm along a " +
          (1000 * length).toFixed(1) +
          " mm lock (clearance " +
          (1000 * hit.signedDistance).toFixed(2) +
          " mm, surface normal " +
          [normal.x, normal.y, normal.z].map((v: number): string => v.toFixed(2)).join(", ") +
          ", combed " +
          [direction.x, direction.y, direction.z]
            .map((v: number): string => v.toFixed(2))
            .join(", ") +
          ").",
      );
    if (stage.pending()) {
      const remaining: number = Math.min(1, (length - cumulative) / distance);
      const end: IAutoMovieVector3 = Vector3.add(
        p,
        Vector3.scale(Vector3.subtract(q, p), remaining),
      );
      const fraction: number | undefined = stage.crossing(p, end);
      if (fraction !== undefined) {
        q = Vector3.add(p, Vector3.scale(Vector3.subtract(end, p), fraction));
        cumulative += Vector3.length(Vector3.subtract(q, p));
        stage.enter(q, cumulative);
        if (fraction > 0) points.push(q);
        p = q;
        continue;
      }
    }
    if (distance >= length - cumulative - epsilon) {
      q = Vector3.add(
        p,
        Vector3.scale(Vector3.subtract(q, p), (length - cumulative) / distance),
      );
      cumulative = length;
    } else cumulative += distance;
    if (interval !== undefined) {
      interval.spend();
      const free: number = sample(q).signedDistance;
      if (free >= clearance - epsilon) {
        freeFrom = points.length;
        if (stage.pending()) gatherOffset = free;
      }
    } else if (stage.pending()) {
      gatherOffset = Math.max(
        clearance - epsilon,
        gatherOffset! +
          Vector3.dot(direction, normal) *
            Vector3.length(Vector3.subtract(q, p)),
      );
    }
    points.push(q);
    p = q;
    if (
      interval !== undefined &&
      freeFrom !== undefined &&
      props.place !== undefined
    ) {
      const placed: IAutoMovieHumanFaceHairCurve | undefined = props.place({
        points: points.map((point: { x: number; y: number; z: number; }): { x: number; y: number; z: number; } => ({ ...point })),
        freeFrom,
        travelled: cumulative,
        targetLength: length,
        clearance: clearance - epsilon,
        normal: { ...props.normal },
      });
      if (placed !== undefined) return placed;
    }
  }
  if (freeFrom === undefined)
    throw new Error(
      budget.remaining === 0
        ? "Numerical hair exhausted its rooted transition budget before reaching free clearance."
        : "Hair length exhausted before its rooted transition reached free clearance.",
    );
  if (cumulative !== length)
    throw new Error("Numerical hair exhausted its metric integration budget.");
  stage.assertTied(p);
  return {
    points,
    length,
    clearance: clearance - epsilon,
    normal: { ...props.normal },
    freeFrom,
  };
}

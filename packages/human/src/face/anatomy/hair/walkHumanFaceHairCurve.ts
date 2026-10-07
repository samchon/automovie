import { Vector3 } from "@automovie/engine";
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

const requireDirection = humanFaceHairFrame.direction;

/**
 * Walk one metric lock from its root at one emergence elevation, with an
 * explicit curved surface-boundary stem.
 * The initial discrete chord retains the root owner's desired tangent at the
 * caller's exit elevation `degrees` (integrateHumanFaceHairCurve chooses it).
 * Each stem station's chord is chosen by stepHumanFaceHairRootedStem until full
 * free clearance: per-station construction turn, look-ahead, strict-progress
 * admission of clipped chords and a named HumanFaceHairStemRefusalError when the
 * stem cannot leave its skin.
 * Every stem station remains in the emitted curve; freeFrom identifies the first
 * full-clearance one. This surface proxy is not buried follicle anatomy.
 *
 * The one loop spends stem and free travel from the same target length/budget.
 * Field phase, gathering observation and tie crossings use actual cumulative
 * metric during the stem too. Length or budget exhaustion before free clearance
 * refuses rather than returning an indefinitely skin-adjacent lock. A hierarchy
 * placer is called once after stem completion: acceptance preserves that stem,
 * while rejection continues this same walk/state/budget without relaunching.
 * Gathered locks cannot substitute hierarchy placement for tie completion.
 * Regional guide length and post-clump strand metric/contact retain their
 * existing owners; no numerical document gains a personal curve control.
 *
 * Distance to a closed set is 1-Lipschitz. Free stations use clearance
 * step/2 + requested clearance, so their connecting segments retain the
 * requested clearance along their whole length, which is the fibre path's own
 * guarantee; the ribbon meshed on it is wider than that path and
 * `buildHumanFaceHairMesh` keeps its corners outside. A scale-derived allowance
 * is added before contact iteration. Contact admission consumes one allowance;
 * chord admission and terminal truncation can each consume half an allowance
 * under the nearest-endpoint distance bound. This avoids bisecting a free step
 * solely because coordinate subtraction rounded its length above the nominal
 * step. The root fan is a separate boundary transition; this free-path
 * argument does not prove root-fan or hair-to-hair nonintersection.
 *
 * A step the contact blocks entirely refuses, naming where the lock stopped,
 * its clearance there, the surface normal and the combed direction. A slide
 * along the blocking wall was measured on the population and removed; a
 * refusal far from any surface means the closed contact surface is not
 * embedded there, which is what the builder's closure (a fan from its rim's
 * current centre) exists to prevent.
 *
 * Contact projects outside, then step bisection limits chord length. The last
 * chord is truncated by its remaining metric length. Blocked directions,
 * unrepresentable steps, short emergence and exhausted iteration budgets refuse
 * instead of returning a shorter lock or stored personal corrective.
 * The current station's signed distance also certifies a free next step: by
 * the closed surface's 1-Lipschitz distance bound, a candidate at most one
 * step away cannot need projection when the current distance exceeds the
 * contact projector's fibre-path clearance by that step and a floating-point margin. Such a step
 * uses the exact same candidate the contact projector would return; stations
 * near skin still take the original projection and bisection path.
 *
 * @evidence contracts/common.md#principled-implementation The lock is a
 *   ray-preserving initial chord and curved certified stem followed by a fixed-step integral of a direction field: each station moves one sampling
 *   step along the combed direction, projected by the contact rule to keep the
 *   skin clearance, so the polyline is the geometry that is meshed and no spline
 *   is refit. The step is bisected back if the projection moves farther than the
 *   step, so every chord is at most one step, which with the 1-Lipschitz signed
 *   distance is what keeps the requested clearance along each chord. A step is
 *   skipped from a query only when the distance already sampled proves it free,
 *   and the last chord is cut to the remaining length, so the lock is exactly
 *   the authored metric length. A step the contact blocks entirely, a length
 *   shorter than the emergence and an exhausted budget refuse and never return a
 *   shorter lock. The premises are a closed, consistently oriented collider and
 *   a field that is finite; the root fan and hair-to-hair contact are not
 *   covered, as the comment says. A stem ends only at the same full free clearance, with intersection-free exterior intervals owned by createHumanFaceHairExteriorInterval.
 * @evidence contracts/common.md#clear-and-simple-design The function keeps the
 *   walk, the contact and the length. The gathering state lives in
 *   createHumanFaceHairGatherStage through createHumanFaceHairCurveStart, the turn limit in limitHumanFaceHairTurn,
 *   the contact rule in humanFaceHairContact and the field in
 *   evaluateHumanFaceHairDirection, so each formula has one owner and the walk
 *   reads as a sequence of named steps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or style and no foreign state: every lock meets the same
 *   field, contact and turn limit, and a step that cannot be taken refuses with
 *   where it stopped instead of sliding along the wall or shortening the lock.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   what is integrated and returned, who owns the points, the clearance argument
 *   and its limits, the refusals and the free-step certificate.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidence contracts/modeling.md#emitted-geometry The stations are the length
 *   divided by the sampling step, so a lock is a few hundred stations at the
 *   published steps and its cost grows with authored length over step. Both are
 *   bounded by the million-interval budget that assertHumanFaceHair enforces
 *   before allocation and the million-station budget the builder counts.
 * @evidence contracts/modeling.md#spatial-conventions Root, reference, origin,
 *   stations, step, clearance and length are metres in the head frame, the
 *   reference and origin are neutral chart positions used only for the field and
 *   the regional length, directions are unit vectors and the arc length in error
 *   messages is converted to millimetres for reading only.
 * @evidence contracts/modeling.md#shared-boundaries The lock meets the skin
 *   through an explicitly retained surface-boundary stem whose chords are exterior-certified on the same collider. freeFrom begins the unchanged half-step plus requested-clearance free-path rule, also consumed by the hierarchy placer. The join can open only where
 *   the collider is not embedded, which the builder's closure and the
 *   deformation own, and it then refuses.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries
 *   no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
 */
export function walkHumanFaceHairCurve(
  props: IHumanFaceHairIntegration,
  metric: IHumanFaceHairMetric,
  degrees: number,
): IAutoMovieHumanFaceHairCurve {
  const { layer } = props;
  const {
    stage,
    length,
    contact: rule,
    budget,
    direction: initialDirection,
  } = createHumanFaceHairCurveStart(props, metric, degrees);
  const h = layer.samplingStep;
  const { clearance, epsilon, sample, outward, project: contact } = rule;
  const points = [{ ...props.root }];
  let cumulative = 0;
  let freeFrom: number | undefined;
  let gatherOffset: number | undefined;
  let p = points[0];
  while (cumulative < length && budget.remaining > 0) {
    budget.remaining--;
    const hit = sample(p);
    stage.observe(p, cumulative);
    const normal =
      points.length === 1 ? requireDirection(props.normal) : outward(p, hit);
    const rooted = freeFrom === undefined;
    const first = points.length === 1;
    // The root tangent applies to the initial discrete chord. Until full free
    // clearance, the geometric outward direction grows the boundary stem; the
    // authored field and gathering clock retain their real cumulative distance.
    let direction = first
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
    const advance = (along: IAutoMovieVector3): IHumanFaceHairStationStep => {
      // A pending free lock acquired its datum at its only rooted-to-free
      // transition. Tie state never returns from the tail to pending.
      const transported = stage.pending() && layer.gather!.strength > 0;
      const candidate = Vector3.add(p, Vector3.scale(along, h));
      const move = (parameter: number): IAutoMovieVector3 =>
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
      let point = transported
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
      let distance = Vector3.length(Vector3.subtract(point, p));
      if (distance > h + epsilon) {
        let low = 0,
          high = h;
        point = p;
        for (let bisect = 0; bisect < 48; bisect++) {
          const middle = (low + high) / 2;
          const trial = move(middle);
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
      const outcome = stepHumanFaceHairRootedStem({
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
    let q = taken.point;
    const distance = taken.distance;
    if (!(distance > epsilon) || !Number.isFinite(distance))
      throw new Error(
        "Contact blocks a representable numerical hair step at (" +
          [p.x, p.y, p.z].map((v) => v.toFixed(4)).join(", ") +
          ") m, " +
          (1000 * cumulative).toFixed(1) +
          " mm along a " +
          (1000 * length).toFixed(1) +
          " mm lock (clearance " +
          (1000 * hit.signedDistance).toFixed(2) +
          " mm, surface normal " +
          [normal.x, normal.y, normal.z].map((v) => v.toFixed(2)).join(", ") +
          ", combed " +
          [direction.x, direction.y, direction.z]
            .map((v) => v.toFixed(2))
            .join(", ") +
          ").",
      );
    if (stage.pending()) {
      const remaining = Math.min(1, (length - cumulative) / distance);
      const end = Vector3.add(
        p,
        Vector3.scale(Vector3.subtract(q, p), remaining),
      );
      const fraction = stage.crossing(p, end);
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
      const free = sample(q).signedDistance;
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
      const placed = props.place({
        points: points.map((point) => ({ ...point })),
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

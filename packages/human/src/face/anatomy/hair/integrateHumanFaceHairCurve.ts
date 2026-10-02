import {
  Vector3,
  type createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { createHumanFaceHairGatherStage } from "./createHumanFaceHairGatherStage";
import { humanFaceHairContact } from "./humanFaceHairContact";
import { humanFaceHairEmergence } from "./humanFaceHairEmergence";
import { humanFaceHairFrame } from "./humanFaceHairFrame";
import { humanFaceHairFreeDistanceBound } from "./humanFaceHairFreeDistanceBound";
import { humanFaceHairLength } from "./humanFaceHairLength";
import { limitHumanFaceHairTurn } from "./limitHumanFaceHairTurn";

const requireDirection = humanFaceHairFrame.direction;

/**
 * Integrate one rooted, metric lock against an admitted closed skin surface.
 * The numerical builder supplies a deformed barycentric root and outward normal;
 * regional length and phase remain tied to its neutral root/sequence identity.
 * The returned polyline is the geometry later meshed, without a spline refit.
 * It owns every point and includes emergence distance in the authored length.
 * The first step out of the root is not the surface normal but the exit angle
 * that place on the scalp carries, tilted toward the field the hair is combed
 * by (`humanFaceHairEmergence`), so hair lies against the head instead of
 * standing off it.
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
 *   fixed-step integral of a direction field: each station moves one sampling
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
 *   covered, as the comment says.
 * @evidence contracts/common.md#clear-and-simple-design The function keeps the
 *   walk, the contact and the length. The gathering state lives in
 *   createHumanFaceHairGatherStage, the turn limit in limitHumanFaceHairTurn,
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
 *   through the contact rule's clearance, half a step plus the requested
 *   clearance, from one definition that the projector for interpolated strands
 *   also uses, and it never enters the collider. The join can open only where
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
export function integrateHumanFaceHairCurve(props: {
  layer: IAutoMovieHumanFaceHair.Layer;
  origin: IAutoMovieVector3;
  reference: IAutoMovieVector3;
  root: IAutoMovieVector3;
  normal: IAutoMovieVector3;
  sequence: number;
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;
  gatherAnchor?: IAutoMovieVector3;
  gatherDirection?: (point: IAutoMovieVector3) => IAutoMovieVector3;
}) {
  const { layer, query } = props;
  const stage = createHumanFaceHairGatherStage({
    layer,
    reference: props.reference,
    root: props.root,
    sequence: props.sequence,
    anchor: props.gatherAnchor,
    gatherDirection: props.gatherDirection,
  });
  const length = humanFaceHairLength(
    layer,
    props.origin,
    props.reference,
    props.sequence,
  );
  const h = layer.samplingStep;
  const {
    clearance,
    epsilon,
    sample,
    outward,
    project: contact,
  } = humanFaceHairContact({ layer, root: props.root, length, query });
  // A follicle is not a pin: the hair leaves the scalp at its own exit angle,
  // tilted toward the field it is combed by (`humanFaceHairEmergence`).
  const launch = contact(
    Vector3.add(
      props.root,
      Vector3.scale(
        requireDirection(
          humanFaceHairEmergence({
            hairline: layer.hairline,
            chart: Vector3.subtract(props.reference, props.origin),
            normal: props.normal,
            field: stage.direction(
              props.root,
              requireDirection(props.normal),
              0,
            ),
          }),
        ),
        clearance,
      ),
    ),
  );
  const points = [{ ...props.root }, launch];
  let cumulative = Vector3.length(Vector3.subtract(launch, props.root));
  if (!Number.isFinite(length) || cumulative >= length)
    throw new Error("Hair length cannot accommodate its emergence clearance.");
  let p = launch;
  for (
    let iteration = 0;
    cumulative < length && iteration < 1_000_000;
    iteration++
  ) {
    const hit = sample(p);
    stage.observe(p, cumulative);
    const normal = outward(p, hit);
    let direction = stage.direction(p, normal, cumulative);
    if (
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
        step: h,
      });
    // One step along a direction: the contact's own projection of a full
    // step, bisected back when that projection lands farther than the step,
    // which is the chord bound the clearance argument rests on.
    const advance = (
      along: IAutoMovieVector3,
    ): { point: IAutoMovieVector3; distance: number } => {
      const candidate = Vector3.add(p, Vector3.scale(along, h));
      let point = humanFaceHairFreeDistanceBound({
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
          const trial = contact(Vector3.add(p, Vector3.scale(along, middle)));
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
    const taken = advance(direction);
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
    points.push(q);
    p = q;
  }
  if (cumulative !== length)
    throw new Error("Numerical hair exhausted its metric integration budget.");
  stage.assertTied(p);
  return {
    points,
    length,
    clearance: clearance - epsilon,
    normal: { ...props.normal },
  };
}

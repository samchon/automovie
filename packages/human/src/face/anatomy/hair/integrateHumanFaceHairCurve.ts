import {
  Vector3,
  type createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { evaluateHumanFaceHairDirection } from "./evaluateHumanFaceHairDirection";
import { humanFaceHairContact } from "./humanFaceHairContact";
import { humanFaceHairEmergence } from "./humanFaceHairEmergence";
import { humanFaceHairFrame } from "./humanFaceHairFrame";
import { humanFaceHairLength } from "./humanFaceHairLength";
import { humanFaceHairSequence } from "./humanFaceHairSequence";

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
 * A step the contact blocks entirely is retried once across the blocking
 * feature's outward side, which is the hair sliding along a wall the field
 * points into, and taken only when it advances the way the hair is combed; a
 * crevice narrower than the hair's own clearance still refuses.
 *
 * Contact projects outside, then step bisection limits chord length. The last
 * chord is truncated by its remaining metric length. Blocked directions,
 * unrepresentable steps, short emergence and exhausted iteration budgets refuse
 * instead of returning a shorter lock or stored personal corrective.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Generates personal length and shape from shared scalar arithmetic.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Keeps contact, metric integration and the actual rendered stations under one owner.
 */
export function integrateHumanFaceHairCurve(props: {
  layer: IAutoMovieHumanFaceHair.Layer;
  origin: IAutoMovieVector3;
  reference: IAutoMovieVector3;
  root: IAutoMovieVector3;
  normal: IAutoMovieVector3;
  sequence: number;
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;
}) {
  const { layer, query } = props;
  const length = humanFaceHairLength(
    layer,
    props.origin,
    props.reference,
    props.sequence,
  );
  const phase = 2 * Math.PI * humanFaceHairSequence(props.sequence, 11);
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
            field: evaluateHumanFaceHairDirection({
              layer,
              root: props.reference,
              normal: requireDirection(props.normal),
              distance: 0,
              phase,
            }),
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
    const normal = outward(p, hit);
    let direction = evaluateHumanFaceHairDirection({
      layer,
      root: props.reference,
      normal,
      distance: cumulative,
      phase,
    });
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
    // A hair cannot turn faster than the tightest curl a head grows. The
    // eight-class curl survey puts the tightest curve diameter below 1.2 cm
    // (Loussouarn et al. 2007, recorded in the project's hair research note),
    // so a step of h turns at most h / 6 mm. A field that asks for more is
    // asking for a kink, which has no ribbon frame and no follicle.
    if (points.length > 1) {
      const before = requireDirection(
        Vector3.subtract(points[points.length - 1], points[points.length - 2]),
      );
      const turn = Math.acos(
        Math.max(-1, Math.min(1, Vector3.dot(before, direction))),
      );
      const limit = h / 0.006;
      if (turn > limit) {
        const across = Vector3.subtract(
          direction,
          Vector3.scale(before, Vector3.dot(direction, before)),
        );
        direction =
          Vector3.length(across) > 0
            ? Vector3.add(
                Vector3.scale(before, Math.cos(limit)),
                Vector3.scale(requireDirection(across), Math.sin(limit)),
              )
            : before;
      }
    }
    // One step along a direction: the contact's own projection of a full
    // step, bisected back when that projection lands farther than the step,
    // which is the chord bound the clearance argument rests on.
    const advance = (
      along: IAutoMovieVector3,
    ): { point: IAutoMovieVector3; distance: number } => {
      let point = contact(Vector3.add(p, Vector3.scale(along, h)));
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
      throw new Error("Contact blocks a representable numerical hair step.");
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
  return {
    points,
    length,
    clearance: clearance - epsilon,
    normal: { ...props.normal },
  };
}

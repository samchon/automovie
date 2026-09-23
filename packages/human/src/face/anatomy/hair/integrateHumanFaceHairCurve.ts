import {
  Vector3,
  type createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { createHumanFaceHairTailSpread } from "./createHumanFaceHairTailSpread";
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
  gatherAnchor?: IAutoMovieVector3;
  gatherDirection?: (point: IAutoMovieVector3) => IAutoMovieVector3;
}) {
  const { layer, query } = props;
  if (
    layer.gather !== undefined &&
    (props.gatherAnchor === undefined || props.gatherDirection === undefined)
  )
    throw new Error("Gathered hair needs its attached scalp anchor.");
  const length = humanFaceHairLength(
    layer,
    props.origin,
    props.reference,
    props.sequence,
  );
  const phase = 2 * Math.PI * humanFaceHairSequence(props.sequence, 11);
  const gather = layer.gather;
  const tailLayer =
    gather === undefined
      ? undefined
      : {
          ...layer,
          flow: gather.tail.direction,
          part: undefined,
          lift: { ...layer.lift, strength: 0 },
        };
  let tied = false;
  let tieDistance = 0;
  let spread: ((distance: number) => IAutoMovieVector3) | undefined;
  const enterTie = (point: IAutoMovieVector3, distance: number): void => {
    tied = true;
    tieDistance = distance;
    if (gather?.tail.spread !== undefined)
      spread = createHumanFaceHairTailSpread({
        axis: Vector3.create(...gather.tail.direction),
        anchor: props.gatherAnchor!,
        entry: point,
        root: props.root,
        phase: 2 * Math.PI * humanFaceHairSequence(props.sequence, 23),
        radialFraction: Math.sqrt(humanFaceHairSequence(props.sequence, 29)),
        ...gather.tail.spread,
      });
  };
  if (
    gather !== undefined &&
    Vector3.length(Vector3.subtract(props.gatherAnchor!, props.root)) <=
      gather.radius
  )
    enterTie(props.root, 0);
  let nearestTie =
    gather === undefined
      ? Infinity
      : Vector3.length(Vector3.subtract(props.gatherAnchor!, props.root));
  let nearestPoint = props.root;
  const desired = (
    point: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    distance: number,
  ): IAutoMovieVector3 => {
    if (tied) {
      const tail = evaluateHumanFaceHairDirection({
        layer: tailLayer!,
        root: props.reference,
        normal,
        distance: distance - tieDistance,
        phase,
      });
      return spread === undefined
        ? tail
        : requireDirection(Vector3.add(tail, spread(distance - tieDistance)));
    }
    const ordinary = evaluateHumanFaceHairDirection({
      layer,
      root: props.reference,
      normal,
      distance,
      phase,
    });
    if (gather === undefined) return ordinary;
    return requireDirection(
      Vector3.add(
        Vector3.scale(ordinary, 1 - gather.strength),
        Vector3.scale(props.gatherDirection!(point), gather.strength),
      ),
    );
  };
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
            field: desired(props.root, requireDirection(props.normal), 0),
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
    if (gather !== undefined) {
      const gap = Vector3.length(Vector3.subtract(props.gatherAnchor!, p));
      if (gap < nearestTie) {
        nearestTie = gap;
        nearestPoint = p;
      }
    }
    const normal = outward(p, hit);
    if (
      gather !== undefined &&
      !tied &&
      Vector3.length(Vector3.subtract(props.gatherAnchor!, p)) <= gather.radius
    ) {
      enterTie(p, cumulative);
    }
    let direction = desired(p, normal, cumulative);
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
    if (gather !== undefined && !tied) {
      const remaining = Math.min(1, (length - cumulative) / distance);
      const end = Vector3.add(
        p,
        Vector3.scale(Vector3.subtract(q, p), remaining),
      );
      const segment = Vector3.subtract(end, p);
      const fromTie = Vector3.subtract(p, props.gatherAnchor!);
      const a = Vector3.dot(segment, segment);
      const b = 2 * Vector3.dot(fromTie, segment);
      const c = Vector3.dot(fromTie, fromTie) - gather.radius ** 2;
      const discriminant = b * b - 4 * a * c;
      if (discriminant >= 0) {
        const fraction = (-b - Math.sqrt(discriminant)) / (2 * a);
        if (fraction >= 0 && fraction <= 1) {
          q = Vector3.add(p, Vector3.scale(segment, fraction));
          cumulative += Vector3.length(Vector3.subtract(q, p));
          enterTie(q, cumulative);
          if (fraction > 0) points.push(q);
          p = q;
          continue;
        }
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
  if (gather !== undefined && !tied)
    throw new Error(
      `A gathered lock ended before it reached its scalp tie: sequence ${props.sequence}, nearest ${nearestTie} m at ${JSON.stringify(nearestPoint)}, anchor ${JSON.stringify(props.gatherAnchor)}, final ${Vector3.length(Vector3.subtract(props.gatherAnchor!, p))} m.`,
    );
  return {
    points,
    length,
    clearance: clearance - epsilon,
    normal: { ...props.normal },
  };
}

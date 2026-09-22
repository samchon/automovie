import {
  Vector3,
  type createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { evaluateHumanFaceHairDirection } from "./evaluateHumanFaceHairDirection";
import { humanFaceHairFrame } from "./humanFaceHairFrame";
import { humanFaceHairSequence } from "./humanFaceHairSequence";

const requireDirection = humanFaceHairFrame.direction;

/**
 * Integrate one rooted, metric lock against an admitted closed skin surface.
 * The numerical builder supplies a deformed barycentric root and outward normal;
 * regional length and phase remain tied to its neutral root/sequence identity.
 * The returned polyline is the geometry later meshed, without a spline refit.
 * It owns every point and includes emergence distance in the authored length.
 *
 * Distance to a closed set is 1-Lipschitz. Free stations use clearance
 * width/2 + step/2 + requested clearance, so their connecting segments retain
 * width/2 clearance for every strip point. A scale-derived arithmetic allowance
 * is added before contact iteration. Contact admission consumes one allowance;
 * chord admission and terminal truncation can each consume half an allowance
 * under the nearest-endpoint distance bound. This avoids bisecting a free step
 * solely because coordinate subtraction rounded its length above the nominal
 * step. The root fan is a separate boundary transition; this free-strip
 * argument does not prove root-fan or hair-to-hair nonintersection.
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
  const radial = Vector3.subtract(props.reference, props.origin);
  const axes = [radial.x, radial.y, radial.z];
  const sum = axes.reduce((total, value) => total + Math.abs(value), 0);
  if (!Number.isFinite(sum) || sum === 0)
    throw new Error("Hair length needs a nonsingular neutral chart direction.");
  const regional = axes.reduce(
    (total, value, axis) =>
      total +
      (Math.abs(value) / sum) *
        layer.lengthAxes[2 * axis + (value < 0 ? 1 : 0)],
    0,
  );
  const length =
    regional *
    (1 +
      layer.lengthVariation *
        (2 * humanFaceHairSequence(props.sequence, 7) - 1));
  const phase = 2 * Math.PI * humanFaceHairSequence(props.sequence, 11);
  const h = layer.samplingStep;
  const epsilon =
    128 *
    Number.EPSILON *
    Math.max(
      Math.abs(props.root.x),
      Math.abs(props.root.y),
      Math.abs(props.root.z),
      length,
      layer.width,
      h,
      layer.clearance,
    );
  const clearance = layer.width / 2 + h / 2 + layer.clearance + 2 * epsilon;
  const sample = (p: IAutoMovieVector3) => query([p.x, p.y, p.z]);
  const outward = (p: IAutoMovieVector3, hit: ReturnType<typeof sample>) =>
    hit.distance === 0
      ? Vector3.create(hit.normal[0], hit.normal[1], hit.normal[2])
      : requireDirection(
          Vector3.scale(
            Vector3.subtract(
              p,
              Vector3.create(hit.point[0], hit.point[1], hit.point[2]),
            ),
            hit.signedDistance < 0 ? -1 : 1,
          ),
        );
  const contact = (input: IAutoMovieVector3): IAutoMovieVector3 => {
    let p = input;
    for (let attempt = 0; attempt < 64; attempt++) {
      const hit = sample(p);
      if (hit.signedDistance >= clearance - epsilon) return p;
      p = Vector3.add(
        Vector3.create(hit.point[0], hit.point[1], hit.point[2]),
        Vector3.scale(outward(p, hit), clearance),
      );
    }
    throw new Error(
      "Numerical hair contact did not converge on the closed surface.",
    );
  };
  const launch = contact(
    Vector3.add(
      props.root,
      Vector3.scale(requireDirection(props.normal), clearance),
    ),
  );
  const points = [{ ...props.root }, launch];
  let cumulative = Vector3.length(Vector3.subtract(launch, props.root));
  if (!Number.isFinite(length) || cumulative >= length)
    throw new Error(
      "Hair length cannot accommodate emergence and full strip width.",
    );
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
    let q = contact(Vector3.add(p, Vector3.scale(direction, h)));
    let distance = Vector3.length(Vector3.subtract(q, p));
    if (distance > h + epsilon) {
      let low = 0,
        high = h;
      q = p;
      for (let bisect = 0; bisect < 48; bisect++) {
        const middle = (low + high) / 2;
        const trial = contact(Vector3.add(p, Vector3.scale(direction, middle)));
        if (Vector3.length(Vector3.subtract(trial, p)) > h) high = middle;
        else {
          low = middle;
          q = trial;
        }
      }
      distance = Vector3.length(Vector3.subtract(q, p));
    }
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

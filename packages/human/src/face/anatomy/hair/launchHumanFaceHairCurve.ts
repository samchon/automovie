import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairLaunch } from "./IHumanFaceHairLaunch";
import type { IHumanFaceHairStationStep } from "./IHumanFaceHairStationStep";
import { createHumanFaceHairExteriorInterval } from "./createHumanFaceHairExteriorInterval";
import { humanFaceHairFrame } from "./humanFaceHairFrame";

/**
 * Find the first contact-admitted station on a root's desired emergence ray.
 * The contact and ray index must snapshot the same current, closed collider.
 * Original root-star triangles and their unsigned proximity reader belong to
 * that same snapshot. A star hit is only a numeric root prefix when both root
 * and calculated hit lie within the existing epsilon of its actual triangle.
 * Convex distance to that triangle bounds the entire prefix by epsilon.
 * Other hits, including tangent touches, conservatively bound the open ray.
 * A signed-distance witness strictly inside the remaining interval establishes
 * its exterior side; a boundary or numerically ambiguous witness refuses.
 *
 * Signed distance is 1-Lipschitz: below target, travelling target minus distance
 * cannot skip an earlier target crossing, even when distance is nonmonotone.
 * The caller owns the lock's remaining integration iterations. Each ray query
 * or attempted clearance station spends one, including a failed call; the
 * later walk must use the same object. Exhaustion refuses, including rounded
 * advances that cannot move travel. Contact supplies finite positive clearance
 * and epsilon. The count is admitted as a nonnegative safe integer; the caller
 * supplies its existing lock budget rather than adding a second launch budget.
 * Every signed, unsigned and ray query spends that same count. Scalar travel
 * must also produce a distinct finite 3D point; a scalar midpoint or advance
 * rounded onto an endpoint is not an interior or a representable step.
 * When a conservative scalar advance still maps to the previous 3D point,
 * ordered positive binary64 travels locate the first distinct point before
 * the strict bound. Each component of root + unitDirection * travel is
 * monotone for fixed finite inputs, so a changed point cannot revert. Skipped
 * representable travels all map to the same sampled point, not to an earlier
 * unsampled clearance crossing. The search spends the existing shared budget.
 * The result owns its point; contact sampling state remains with its owner.
 */
export function launchHumanFaceHairCurve(
  props: IHumanFaceHairLaunch,
): IHumanFaceHairStationStep {
  const direction = humanFaceHairFrame.direction(props.exitDirection);
  const { clearance, epsilon, sample } = props.contact;
  const { low, bound, rootHit, pointAt, spend } =
    createHumanFaceHairExteriorInterval({
      root: props.root,
      direction,
      maximum: props.length,
      originOnSkin: true,
      contact: props.contact,
      raycaster: props.raycaster,
      rootBoundary: props.rootBoundary,
      budget: props.budget,
    });
  const before = pointAt(low);
  const distinct = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    a.x !== b.x || a.y !== b.y || a.z !== b.z;
  const target = clearance - epsilon;
  let travel = low;
  let distance = rootHit.signedDistance;
  if (low > 0) {
    spend();
    distance = sample(before).signedDistance;
  }
  let previous = before;
  while (true) {
    let next = travel + (target - distance);
    if (next >= bound)
      throw new Error(
        "Hair length or surface reentry blocks its emergence clearance.",
      );
    let point = pointAt(next);
    if (!(next > travel) || !distinct(point, previous)) {
      if (!distinct(pointAt(bound), previous))
        throw new Error(
          "Hair length or surface reentry leaves no distinct clearance point.",
        );
      const floating = new Float64Array([Math.max(0, next)]);
      const integer = new BigUint64Array(floating.buffer);
      let left = integer[0];
      floating[0] = bound;
      let right = integer[0];
      const end = right;
      while (right - left > 1n) {
        spend();
        const middle = (left + right) / 2n;
        integer[0] = middle;
        if (distinct(pointAt(floating[0]), previous)) right = middle;
        else left = middle;
      }
      if (right === end)
        throw new Error(
          "Hair length or surface reentry blocks its first distinct clearance point.",
        );
      integer[0] = right;
      next = floating[0];
      point = pointAt(next);
    }
    spend();
    const hit = sample(point);
    if (hit.signedDistance >= target) return { point, distance: next };
    travel = next;
    distance = hit.signedDistance;
    previous = point;
  }
}

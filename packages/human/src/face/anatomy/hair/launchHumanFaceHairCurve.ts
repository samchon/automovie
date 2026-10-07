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
 *
 * @evidence contracts/common.md#principled-implementation Convex distance to each actual root-star triangle certifies only the epsilon-sized prefix. The first remaining surface hit bounds a crossing-free open interval, whose actual closest-point signed-distance witness establishes its exterior side without classifying an intersection normal against the ray. Conservative Lipschitz advances cannot skip the first clearance crossing. Binary64 travel and 3D interior checks refuse ambiguity, and every query consumes the existing shared count.
 * @evidence contracts/common.md#clear-and-simple-design One owner finds a scalar travel on an immutable desired ray; the existing collider owns distances and ray intersections, and the integrator owns later walking and metric length.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject, angle, clearance, epsilon or sampling override; no projection rotates the desired ray and no personal corrective is stored.
 * @evidence contracts/common.md#meaningful-documentation States the same-collider premise, nonmonotone search argument, root boundary allowance, length and representability refusals, and owned output.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It selects one station and defines no displayed part or group.
 * @evidence contracts/modeling.md#parameter-channels It consumes the derived emergence direction and authored metric length without reinterpreting their meaning or introducing a styling channel.
 * @evidence contracts/modeling.md#emitted-geometry It returns one station; the integrator retains the root and accounts for the returned travel in the existing station and length budgets.
 * @evidence contracts/modeling.md#spatial-conventions Root, collider and output are in the same current head metre frame; direction is normalized and travel, length, clearance and epsilon are metres.
 * @evidence contracts/modeling.md#shared-boundaries The root-to-station ray is bounded before another collider intersection outside the existing root allowance. Only the fibre transition is covered; ribbon interiors and hair-to-hair contact are not certified.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint; the hair builder and integrator's product consumer own visual observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical angle or population value; emergence supplies the direction.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits numerical surface and metric premises, not an anatomical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It adds no caller authoring input; root, direction and collider are derived by their existing owners.
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

import type { createAutoMovieSignedMeshQuery as ImportedcreateAutoMovieSignedMeshQuery, IAutoMovieSignedMeshQueryHit as ImportedIAutoMovieSignedMeshQueryHit } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairLaunch } from "./IHumanFaceHairLaunch";
import type { IHumanFaceHairStationStep } from "./IHumanFaceHairStationStep";
import { createHumanFaceHairExteriorInterval } from "./createHumanFaceHairExteriorInterval";
import { humanFaceHairFrame } from "./humanFaceHairFrame";

/**
 * Find the first contact-admitted station on a root's desired emergence ray. The contact and ray index must snapshot the same current, closed collider. Original root-star triangles and their unsigned proximity reader belong to that same snapshot. A star hit is only a numeric root prefix when both root and calculated hit lie within the existing epsilon of its actual triangle. Convex distance to that triangle bounds the entire prefix by epsilon. Other hits, including tangent touches, conservatively bound the open ray. A signed-distance witness strictly inside the remaining interval establishes its exterior side; a boundary or numerically ambiguous witness refuses.
 *
 * Signed distance is 1-Lipschitz: below target, travelling target minus distance cannot skip an earlier target crossing, even when distance is nonmonotone. The caller owns the lock's remaining integration iterations. Each ray query or attempted clearance station spends one, including a failed call; the later walk must use the same object. Exhaustion refuses, including rounded advances that cannot move travel. Contact supplies finite positive clearance and epsilon. The count is admitted as a nonnegative safe integer; the caller supplies its existing lock budget rather than adding a second launch budget. Every signed, unsigned and ray query spends that same count. Scalar travel must also produce a distinct finite 3D point; a scalar midpoint or advance rounded onto an endpoint is not an interior or a representable step. When a conservative scalar advance still maps to the previous 3D point, ordered positive binary64 travels locate the first distinct point before the strict bound. Each component of root + unitDirection * travel is monotone for fixed finite inputs, so a changed point cannot revert. Skipped representable travels all map to the same sampled point, not to an earlier unsampled clearance crossing. The search spends the existing shared budget. The result owns its point; contact sampling state remains with its owner.
 *
 * @evidence contracts/common.md#principled-implementation A same-collider exterior ray interval and Lipschitz distance advances find the first admitted emergence-clearance station.
 * @evidence contracts/common.md#clear-and-simple-design This standalone numerical launch shares interval and frame owners with rooted-chord integration, but currently has no repository execution caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ambiguous witnesses, blocked length and unrepresentable progress refuse; root incidence excuses only an epsilon-proved original triangle prefix.
 * @evidence contracts/common.md#meaningful-documentation Travel and result point use head metres and every search/query spends the supplied remaining lock budget.
 * @evidence contracts/performance.md#efficient-algorithms Work follows clearance advances, hit queries and logarithmic ordered-binary64 search when scalar advances repeat the same 3D point.
 * @evidence contracts/performance.md#reuse-equivalent-work Compiled contact, ray and root-distance readers are reused rather than a second launch budget or collider.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result owns its point; local binary64/bigint views and interval closures are collectible after return.
 */
export function launchHumanFaceHairCurve(
  props: IHumanFaceHairLaunch,
): IHumanFaceHairStationStep {
  const direction: IAutoMovieVector3 = humanFaceHairFrame.direction(props.exitDirection);
  const { clearance, epsilon, sample }: { clearance: number; sample: (p: IAutoMovieVector3) => ReturnType<ReturnType<typeof ImportedcreateAutoMovieSignedMeshQuery>>; epsilon: number; } = props.contact;
  const { low, bound, rootHit, pointAt, spend }: { low: number; bound: number; bounded: boolean; rootHit: ImportedIAutoMovieSignedMeshQueryHit; pointAt: (travel: number) => IAutoMovieVector3; spend: () => void; } =
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
  const before: IAutoMovieVector3 = pointAt(low);
  const distinct: (a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    a.x !== b.x || a.y !== b.y || a.z !== b.z;
  const target: number = clearance - epsilon;
  let travel: number = low;
  let distance: number = rootHit.signedDistance;
  if (low > 0) {
    spend();
    distance = sample(before).signedDistance;
  }
  let previous: IAutoMovieVector3 = before;
  while (true) {
    let next: number = travel + (target - distance);
    if (next >= bound)
      throw new Error(
        "Hair length or surface reentry blocks its emergence clearance.",
      );
    let point: IAutoMovieVector3 = pointAt(next);
    if (!(next > travel) || !distinct(point, previous)) {
      if (!distinct(pointAt(bound), previous))
        throw new Error(
          "Hair length or surface reentry leaves no distinct clearance point.",
        );
      const floating: Float64Array<ArrayBuffer> = new Float64Array([Math.max(0, next)]);
      const integer: BigUint64Array<ArrayBuffer> = new BigUint64Array(floating.buffer);
      let left: bigint = integer[0];
      floating[0] = bound;
      let right: bigint = integer[0];
      const end: bigint = right;
      while (right - left > 1n) {
        spend();
        const middle: bigint = (left + right) / 2n;
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
    const hit: ImportedIAutoMovieSignedMeshQueryHit = sample(point);
    if (hit.signedDistance >= target) return { point, distance: next };
    travel = next;
    distance = hit.signedDistance;
    previous = point;
  }
}

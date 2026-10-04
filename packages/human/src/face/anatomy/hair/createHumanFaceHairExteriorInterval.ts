import {
  Vector3,
  type IAutoMovieMeshQueryBudget,
  adjacentAutoMovieFloat64,
  type createAutoMovieMeshRayCaster,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { assertHumanFaceHairIntegrationContext } from "./assertHumanFaceHairIntegrationContext";
import type { createHumanFaceHairRootBoundary } from "./createHumanFaceHairRootBoundary";
import type { humanFaceHairContact } from "./humanFaceHairContact";
import { humanFaceHairFrame } from "./humanFaceHairFrame";

/**
 * Certify a crossing-free exterior interval on one current closed skin ray.
 * Root mode admits only the original support triangles' epsilon-sized numeric
 * prefix, by actual unsigned proximity at both ends. Outside mode admits no
 * skipped intersection. A signed interior witness establishes the interval's
 * exterior side; tangent hits conservatively end it. The same reader serves
 * the immutable-ray numerical query and each chord of the curved rooted stem.
 * It does not demand that a desired root tangent already reach full clearance.
 *
 * Positions/travel are current head-frame metres. The caller owns one remaining
 * budget and every signed, unsigned or ray query spends it, including refusal.
 * The returned spend closure continues that same budget; it never resets it.
 * PointAt is an immutable unit ray and returns owned points. The caller must
 * choose representable points in the interval and retains metric ownership.
 *
 * @evidence contracts/common.md#principled-implementation Convex triangle distance admits only the numeric root prefix. The first remaining intersection and an actual interior signed witness certify an exterior interval without inferring crossings from intersection normals.
 * @evidence contracts/common.md#clear-and-simple-design One owner defines root-star exclusion, exterior witnessing and budget expenditure for both ray and curved-stem consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source, root, angle, clearance or epsilon override; only the original support triangles may supply a numeric root prefix.
 * @evidence contracts/common.md#meaningful-documentation Defines root/outside modes, same-snapshot premises, returned ownership, units and conservative refusals.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It certifies a numerical interval and defines no displayed part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It consumes derived geometry without adding a styling channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive or station.
 * @evidence contracts/modeling.md#spatial-conventions Origin, collider and travel share current head-frame metres; direction is unit length.
 * @evidence contracts/modeling.md#shared-boundaries The same closed snapshot and original sampler support own the numeric root boundary; exterior chords remain before all other intersections.
 * @evidenceExclude contracts/modeling.md#rendered-observation It certifies numerical geometry; the builder owns rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It supplies no anatomical angle or tissue value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits computational premises, not clinical bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Its inputs are producer-derived rays rather than personal curve controls.
 */
export function createHumanFaceHairExteriorInterval(props: {
  root: IAutoMovieVector3;
  direction: IAutoMovieVector3;
  maximum: number;
  originOnSkin: boolean;
  contact: Pick<ReturnType<typeof humanFaceHairContact>, "sample" | "epsilon">;
  raycaster: Pick<
    ReturnType<typeof createAutoMovieMeshRayCaster>,
    "nearestHit"
  >;
  rootBoundary: {
    triangles: readonly number[];
    distance: ReturnType<typeof createHumanFaceHairRootBoundary>["distance"];
  };
  budget: IAutoMovieMeshQueryBudget;
}) {
  const direction = humanFaceHairFrame.direction(props.direction);
  const { epsilon, sample } = props.contact;
  assertHumanFaceHairIntegrationContext(props);
  if (!Number.isFinite(props.maximum) || props.maximum <= epsilon)
    throw new Error("Hair length cannot accommodate its emergence clearance.");
  const spend = (): void => {
    if (props.budget.remaining === 0)
      throw new Error(
        "Numerical hair exhausted its shared metric integration budget.",
      );
    props.budget.remaining--;
  };
  spend();
  const rootHit = sample(props.root);
  if (
    props.originOnSkin
      ? Math.abs(rootHit.signedDistance) > epsilon
      : !(rootHit.signedDistance > epsilon)
  )
    throw new Error(
      "A hair emergence root must lie on its current collider or an admitted exterior station.",
    );
  const origin = [props.root.x, props.root.y, props.root.z];
  const along = [direction.x, direction.y, direction.z];
  const pointAt = (travel: number) =>
    Vector3.add(props.root, Vector3.scale(direction, travel));
  let low = 0;
  let bound = props.maximum;
  let bounded = false;
  let minimum = 0;
  while (true) {
    spend();
    const hit = props.raycaster.nearestHit(
      origin,
      along,
      props.maximum,
      minimum,
    );
    if (hit === null) break;
    let prefix = false;
    if (
      props.originOnSkin &&
      props.rootBoundary.triangles.includes(hit.triangle)
    ) {
      spend();
      const rootDistance = props.rootBoundary.distance(hit.triangle, origin);
      const point = pointAt(hit.distance);
      spend();
      const hitDistance = props.rootBoundary.distance(hit.triangle, [
        point.x,
        point.y,
        point.z,
      ]);
      prefix = rootDistance <= epsilon && hitDistance <= epsilon;
    }
    if (!prefix) {
      bound = hit.distance;
      bounded = true;
      break;
    }
    low = Math.max(low, hit.distance);
    if (low === props.maximum) break;
    minimum = adjacentAutoMovieFloat64(Math.max(0, hit.distance), true);
  }
  const middle = low + (bound - low) / 2;
  const before = pointAt(low);
  const witness = pointAt(middle);
  const end = pointAt(bound);
  const distinct = (a: IAutoMovieVector3, b: IAutoMovieVector3) =>
    a.x !== b.x || a.y !== b.y || a.z !== b.z;
  if (
    !(middle > low && middle < bound) ||
    !distinct(witness, before) ||
    !distinct(witness, end)
  )
    throw new Error(
      "Hair length or surface reentry leaves no representable exterior interval.",
    );
  spend();
  if (!(sample(witness).signedDistance > epsilon))
    throw new Error(
      "A hair emergence ray needs an unambiguous outward exterior interval.",
    );
  return { low, bound, bounded, rootHit, pointAt, spend };
}

import { Vector3, adjacentAutoMovieFloat64 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairExteriorRay } from "./IHumanFaceHairExteriorRay";
import { assertHumanFaceHairIntegrationContext } from "./assertHumanFaceHairIntegrationContext";
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
 */
export function createHumanFaceHairExteriorInterval(
  props: IHumanFaceHairExteriorRay,
) {
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
  const root = Vector3.create(origin[0], origin[1], origin[2]);
  const pointAt = (travel: number) =>
    Vector3.add(root, Vector3.scale(direction, travel));
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

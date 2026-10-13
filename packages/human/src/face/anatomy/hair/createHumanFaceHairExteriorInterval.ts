import { Vector3, adjacentAutoMovieFloat64, type IAutoMovieSignedMeshQueryHit as ImportedIAutoMovieSignedMeshQueryHit, type createAutoMovieSignedMeshQuery as ImportedcreateAutoMovieSignedMeshQuery, type IAutoMovieMeshRayHit as ImportedIAutoMovieMeshRayHit } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairExteriorRay } from "./IHumanFaceHairExteriorRay";
import { assertHumanFaceHairIntegrationContext } from "./assertHumanFaceHairIntegrationContext";
import { humanFaceHairFrame } from "./humanFaceHairFrame";

/**
 * Certify a crossing-free exterior interval on one current closed skin ray. Root mode admits only the original support triangles' epsilon-sized numeric prefix, by actual unsigned proximity at both ends. Outside mode admits no skipped intersection. A signed interior witness establishes the interval's exterior side; tangent hits conservatively end it. The same reader serves the immutable-ray numerical query and each chord of the curved rooted stem. It does not demand that a desired root tangent already reach full clearance.
 *
 * Positions/travel are current head-frame metres. The caller owns one remaining budget and every signed, unsigned or ray query spends it, including refusal. The returned spend closure continues that same budget; it never resets it. PointAt is an immutable unit ray and returns owned points. The caller must choose representable points in the interval and retains metric ownership.
 *
 * @evidence contracts/common.md#principled-implementation Nearest ray hits bound a crossing-free interval whose interior witness must be exterior on the same closed collider.
 * @evidence contracts/common.md#clear-and-simple-design Root and later chords share interval admission, with original-support proximity governing only the numerical root prefix.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Incidence alone never excuses a crossing; no representable positive interval or exhausted shared budget causes explicit refusal.
 * @evidence contracts/common.md#meaningful-documentation low/bound and pointAt are head-frame metres, bounded names a blocking hit, and spend continues the supplied budget.
 * @evidence contracts/performance.md#efficient-algorithms Work follows ordered ray hits and signed or root-triangle distance queries until the first unexcused boundary.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller's compiled ray, contact and root-distance readers are reused throughout the interval.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure owns copied ray origin/direction and borrows readers/budget; it retains no station history.
 */
export function createHumanFaceHairExteriorInterval(
  props: IHumanFaceHairExteriorRay,
): { low: number; bound: number; bounded: boolean; rootHit: ImportedIAutoMovieSignedMeshQueryHit; pointAt: (travel: number) => IAutoMovieVector3; spend: () => void; } {
  const direction: IAutoMovieVector3 = humanFaceHairFrame.direction(props.direction);
  const { epsilon, sample }: { sample: (p: IAutoMovieVector3) => ReturnType<ReturnType<typeof ImportedcreateAutoMovieSignedMeshQuery>>; epsilon: number; } = props.contact;
  assertHumanFaceHairIntegrationContext(props);
  if (!Number.isFinite(props.maximum) || props.maximum <= epsilon)
    throw new Error("Hair length cannot accommodate its emergence clearance.");
  const spend: () => void = (): void => {
    if (props.budget.remaining === 0)
      throw new Error(
        "Numerical hair exhausted its shared metric integration budget.",
      );
    props.budget.remaining--;
  };
  spend();
  const rootHit: ImportedIAutoMovieSignedMeshQueryHit = sample(props.root);
  if (
    props.originOnSkin
      ? Math.abs(rootHit.signedDistance) > epsilon
      : !(rootHit.signedDistance > epsilon)
  )
    throw new Error(
      "A hair emergence root must lie on its current collider or an admitted exterior station.",
    );
  const origin: number[] = [props.root.x, props.root.y, props.root.z];
  const along: number[] = [direction.x, direction.y, direction.z];
  const root: IAutoMovieVector3 = Vector3.create(origin[0], origin[1], origin[2]);
  const pointAt: (travel: number) => IAutoMovieVector3 = (travel: number): IAutoMovieVector3 =>
    Vector3.add(root, Vector3.scale(direction, travel));
  let low: number = 0;
  let bound: number = props.maximum;
  let bounded: boolean = false;
  let minimum: number = 0;
  while (true) {
    spend();
    const hit: ImportedIAutoMovieMeshRayHit | null = props.raycaster.nearestHit(
      origin,
      along,
      props.maximum,
      minimum,
    );
    if (hit === null) break;
    let prefix: boolean = false;
    if (
      props.originOnSkin &&
      props.rootBoundary.triangles.includes(hit.triangle)
    ) {
      spend();
      const rootDistance: number = props.rootBoundary.distance(hit.triangle, origin);
      const point: IAutoMovieVector3 = pointAt(hit.distance);
      spend();
      const hitDistance: number = props.rootBoundary.distance(hit.triangle, [
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
  const middle: number = low + (bound - low) / 2;
  const before: IAutoMovieVector3 = pointAt(low);
  const witness: IAutoMovieVector3 = pointAt(middle);
  const end: IAutoMovieVector3 = pointAt(bound);
  const distinct: (a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
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

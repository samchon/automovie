import {
  Quaternion,
  Vector3,
  closestPointsBetweenSegments,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanColliderBound } from "./HumanColliderBound";
import type { HumanColliders } from "./HumanColliders";

/**
 * Ordered signed-distance reduction over one actual collider placement.
 * The first strict minimum wins; conservative world spheres screen only
 * shapes unable to improve it. Optional scratch belongs to this unchanged
 * placement's synchronous query operation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines signs, world metres, strict first winner, conservative screening and placement ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Reduces actual engine signed shape distances, less the supplied segment taper; a containing sphere provides a lower bound and retains the original greater-or-equal rejection.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This is the single moved distanceOn traversal behind the existing HumanColliders facades; shape bounds and exact proximity mathematics retain their owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps shape order, strict minima, taper arithmetic and empty-body refusal; a screen never substitutes for an actual winning distance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Scans F ordered shapes and pays exact query cost only where original screens permit; prepared operations compute at most F world spheres and opaque engine readers, without a measured speedup claim.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Optional bounds/readers are valid only for this exact unchanged ordered placement; every segment and taper still runs its actual query and comparison.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The function borrows placement/scratch and retains none; one-off temporary bounds end with return and prepared scratch lifetime belongs to the explicit prepare closure.
 */
export function HumanColliderDistance(
  placements: readonly HumanColliders.IPlaced[],
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper: readonly [number, number] | undefined,
  widest: number,
  bounds?: IWorldBall[],
  readers?: IDistanceReader[],
): HumanColliders.IDistance {
  let best: HumanColliders.IDistance | undefined;
  let cursor: number = 0;
  for (const { bone, pose, shapes } of placements)
    for (const shape of shapes) {
      const slot: number = cursor++;

      // A containing sphere cannot improve a distance it already lies beyond.
      if (best !== undefined) {
        let ball: IWorldBall | undefined = bounds?.[slot];
        if (ball === undefined) {
          ball = HumanColliderBound(shape);
          ball.centre = Vector3.add(
            pose.position,
            Quaternion.rotateVector(
              pose.rotation,
              Vector3.add(
                shape.transform.position,
                Quaternion.rotateVector(shape.transform.rotation, ball.centre),
              ),
            ),
          );
          if (bounds !== undefined) bounds[slot] = ball;
        }
        if (
          closestPointsBetweenSegments(a, b, ball.centre, ball.centre).distance -
            ball.radius - widest >= best.distance
        ) continue;
      }
      const d: number = readers === undefined
        ? physicalShapeSegmentDistance(pose, shape, a, b, taper)
        : (readers[slot] ??= physicalShapeSegmentDistance.prepare(pose, shape))(a, b, taper);
      if (best === undefined || d < best.distance) best = { distance: d, bone };
    }
  if (best === undefined) throw new Error("A body without colliders has no distance");
  return best;
}

/**
 * Operation-scoped fixed-geometry preparation for the same distance owner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines unchanged placement scope and varying-query purpose.
 * @evidence contracts/development/design.md#principled-representation An opaque segment reader captures actual placed geometry and bounded scratch, without retaining any segment or answer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare serves existing ray probes and StrikingRide's repeated same-body contact probes through HumanColliders.reading.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body identity cache or caller-supplied result certifies reuse; only explicit unchanged-placement lifetime permits shared geometry.
 */
export namespace HumanColliderDistance {
  /**
   * Query varying segments during one unchanged placement operation. World
   * spheres and opaque shape readers are prepared lazily at original use sites.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States varying world segments, fixed geometry, lazy preparation and operation release.
   * @evidence contracts/development/implementation.md#principled-implementation A shape's world sphere and local query frame depend only on its unchanged placement, so the existing ordered reducer can share them across actual segment queries.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closure owns bounds/readers and delegates all numeric query policy to HumanColliderDistance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every new segment/taper runs original proximity math and first-minimum rules; no distance, query point or verdict is stored.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most F world spheres and F fixed shape readers are prepared across K queries on F shapes, while screening and exact query costs remain per segment.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller keeps actual ordered placement, shape definitions and transforms unchanged through this synchronous operation; changed geometry requires another reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The operation owns one closure, borrowed placement and at most F spheres/readers until return or throw; no global map, point/result history, task or handle is added.
   */
  export function prepare(
    placements: readonly HumanColliders.IPlaced[],
  ): (a: IAutoMovieVector3, b: IAutoMovieVector3, taper?: readonly [number, number]) => HumanColliders.IDistance {
    const bounds: IWorldBall[] = [];
    const readers: IDistanceReader[] = [];
    return (a: IAutoMovieVector3, b: IAutoMovieVector3, taper?: readonly [number, number]): HumanColliders.IDistance =>
      HumanColliderDistance(
        placements,
        a,
        b,
        taper,
        taper === undefined ? 0 : Math.max(taper[0], taper[1]),
        bounds,
        readers,
      );
  }
}

/** Operation-owned world sphere; centre never aliases borrowed hull metadata. */
interface IWorldBall { centre: IAutoMovieVector3; radius: number; }

/** Engine-owned fixed shape geometry with no retained point or result. */
type IDistanceReader = ReturnType<typeof physicalShapeSegmentDistance.prepare>;

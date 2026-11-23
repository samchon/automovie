import {
  closestPointsBetweenSegments,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanColliders,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanShapeFraming } from "./HumanShapeFraming";

/**
 * Ordered signed-distance reduction over one actual collider placement.
 * The first strict minimum wins; conservative world spheres screen only
 * shapes unable to improve it. Optional scratch belongs to this unchanged
 * placement's synchronous query operation.
 */
export function HumanColliderDistance(
  placements: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper: readonly [number, number] | undefined,
  widest: number,
  bounds?: IWorldBall[],
  readers?: IDistanceReader[],
): IAutoMovieMotionHumanColliders.IDistance {
  let best: IAutoMovieMotionHumanColliders.IDistance | undefined;
  let cursor: number = 0;
  for (const { bone, pose, shapes } of placements)
    for (const shape of shapes) {
      const slot: number = cursor++;

      // A containing sphere cannot improve a distance it already lies beyond.
      if (best !== undefined) {
        let ball: IWorldBall | undefined = bounds?.[slot];
        if (ball === undefined) {
          ball = HumanShapeFraming.sphere(pose, shape);
          if (bounds !== undefined) bounds[slot] = ball;
        }
        if (
          closestPointsBetweenSegments(a, b, ball.centre, ball.centre)
            .distance -
            ball.radius -
            widest >=
          best.distance
        )
          continue;
      }
      const d: number =
        readers === undefined
          ? physicalShapeSegmentDistance(pose, shape, a, b, taper)
          : (readers[slot] ??= physicalShapeSegmentDistance.prepare(
              pose,
              shape,
            ))(a, b, taper);
      if (best === undefined || d < best.distance) best = { distance: d, bone };
    }
  if (best === undefined)
    throw new Error("A body without colliders has no distance");
  return best;
}

/**
 * Operation-scoped fixed-geometry preparation for the same distance owner.
 */
export namespace HumanColliderDistance {
  /**
   * Query varying segments during one unchanged placement operation. World
   * spheres and opaque shape readers are prepared lazily at original use sites.
   *
   * States varying world segments, fixed geometry, lazy preparation and operation release.
   * A shape's world sphere and local query frame depend only on its unchanged placement, so the existing ordered reducer can share them across actual segment queries.
   * One closure owns bounds/readers and delegates all numeric query policy to HumanColliderDistance.
   * Every new segment/taper runs original proximity math and first-minimum rules; no distance, query point or verdict is stored.
   * At most F world spheres and F fixed shape readers are prepared across K queries on F shapes, while screening and exact query costs remain per segment.
   * The caller keeps actual ordered placement, shape definitions and transforms unchanged through this synchronous operation; changed geometry requires another reader.
   * The operation owns one closure, borrowed placement and at most F spheres/readers until return or throw; no global map, point/result history, task or handle is added.
   */
  export function prepare(
    placements: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    taper?: readonly [number, number],
  ) => IAutoMovieMotionHumanColliders.IDistance {
    const bounds: IWorldBall[] = [];
    const readers: IDistanceReader[] = [];
    return (
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      taper?: readonly [number, number],
    ): IAutoMovieMotionHumanColliders.IDistance =>
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
interface IWorldBall {
  centre: IAutoMovieVector3;
  radius: number;
}

/** Engine-owned fixed shape geometry with no retained point or result. */
type IDistanceReader = ReturnType<typeof physicalShapeSegmentDistance.prepare>;

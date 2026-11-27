import { AutoMovieEnginePhysics, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanColliders,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanShapeFraming } from "./HumanShapeFraming";

/*
 * Ordered signed-distance reduction over one actual collider placement. The
 * first strict minimum wins; conservative world spheres screen only shapes
 * unable to improve it. Fixed geometry can be supplied by the preparation.
 */
export function HumanColliderDistance(
  placements: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper: readonly [number, number] | undefined,
  widest: number,
  prepared?: readonly IShapeReading[],
): IAutoMovieMotionHumanColliders.IDistance {
  let best: IAutoMovieMotionHumanColliders.IDistance | undefined;
  let cursor: number = 0;
  for (const { bone, pose, shapes } of placements)
    for (const shape of shapes) {
      const reading: IShapeReading | undefined = prepared?.[cursor++];

      // A containing sphere cannot improve a distance it already lies beyond.
      if (best !== undefined) {
        const ball: IWorldBall =
          reading?.bound ?? HumanShapeFraming.sphere(pose, shape);
        if (
          AutoMovieEngineMath.closestPointsBetweenSegments(a, b, ball.centre, ball.centre)
            .distance -
            ball.radius -
            widest >=
          best.distance
        )
          continue;
      }
      const d: number =
        reading === undefined
          ? AutoMovieEnginePhysics.physicalShapeSegmentDistance(pose, shape, a, b, taper)
          : reading.distance(a, b, taper);
      if (best === undefined || d < best.distance) best = { distance: d, bone };
    }
  if (best === undefined)
    throw new Error("A body without colliders has no distance");
  return best;
}

/*
 * Operation-scoped fixed-geometry preparation for the same distance owner.
 */
export namespace HumanColliderDistance {
  /*
   * Prepare world bounds and shape readers for an unchanged set of posed
   * colliders. Each segment uses the same ordered minimum rule and tests only
   * the exact shapes whose bounds could improve the current best distance.
   */
  export function prepare(
    placements: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    taper?: readonly [number, number],
  ) => IAutoMovieMotionHumanColliders.IDistance {
    const prepared: IShapeReading[] = [];
    for (const { pose, shapes } of placements)
      for (const shape of shapes)
        prepared.push({
          bound: HumanShapeFraming.sphere(pose, shape),
          distance: AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance(pose, shape),
        });
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
        prepared,
      );
  }
}

/*
 * Operation-owned world sphere; centre never aliases borrowed hull metadata.
 */
interface IWorldBall {
  centre: IAutoMovieVector3;
  radius: number;
}

/*
 * Engine-owned fixed shape geometry with no retained point or result.
 */
type IDistanceReader = ReturnType<typeof AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance>;

/*
 * Fixed world screening and exact local-frame distance for one shape.
 */
interface IShapeReading {
  /*
   * Conservative world sphere for the shape.
   */
  bound: IWorldBall;

  /*
   * Signed distance to each current world segment.
   */
  distance: IDistanceReader;
}

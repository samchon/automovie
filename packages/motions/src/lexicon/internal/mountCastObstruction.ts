import { type AutoMovieEnginePhysicsGjkTypes, AutoMovieEnginePhysics, Vector3, AutoMovieEngineMath, AutoMovieEngineGeometry } from "@automovie/engine";

import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Enclose the obstructed part of one finite translation of a fixed convex
 * solid. Its intersecting placements are the line through the convex
 * configuration-space obstacle (the other solid plus the moving solid
 * reflected). A prefix and a suffix cast can each lose certification only
 * once as they grow. Use the exact hull of the two translated endpoints
 * (`AutoMovieEnginePhysics.physicalShapeGjkCast`) and keep the last certified ends of their brackets.
 * The result still excludes unresolved GJK bounds and admits no overlap.
 *
 * @param moving The oriented solid at zero translation.
 * @param obstacle The other solid in the same axes.
 * @param axis The unit translation direction.
 * @param possible The outer bounds on the obstructed interval.
 * @param precision The greatest remaining bracket width in metres, also the
 *   positive GJK early-exit target. Separation still requires a nonnegative
 *   certified lower bound.
 * @param faces Optional obstacle face normals. An outward-rounded projection
 *   along one can certify separation when GJK cannot resolve the distance.
 * @returns The excluded interval or undefined where the whole cast clears.
 */
export function mountCastObstruction(
  moving: AutoMovieEnginePhysicsGjkTypes.ISolid,
  obstacle: AutoMovieEnginePhysicsGjkTypes.ISolid,
  axis: IAutoMovieVector3,
  possible: Span,
  precision: number,
  faces?: readonly IAutoMovieVector3[],
): Span | undefined {
  const placed = (distance: number): AutoMovieEnginePhysicsGjkTypes.ISolid => {
    const delta: IAutoMovieVector3 = Vector3.scale(axis, distance);
    return {
      points: moving.points.map(
        (point: IAutoMovieVector3): IAutoMovieVector3 =>
          Vector3.add(point, delta),
      ),
      radius: moving.radius,
    };
  };
  const clears = (solid: AutoMovieEnginePhysicsGjkTypes.ISolid): boolean => {
    const result: AutoMovieEnginePhysicsGjkTypes.IBound = AutoMovieEnginePhysics.physicalShapeGjk(
      solid,
      obstacle,
      precision,
    );
    if (result.lower >= 0) return true;
    return (
      result.upper > 0 &&
      (faces?.some(
        (normal: IAutoMovieVector3): boolean =>
          AutoMovieEngineGeometry.boundProjectionSeparation(
            solid.points,
            obstacle.points,
            normal,
          ) >
          solid.radius + obstacle.radius,
      ) ?? false)
    );
  };
  const sweep = (
    from: AutoMovieEnginePhysicsGjkTypes.ISolid,
    to: AutoMovieEnginePhysicsGjkTypes.ISolid,
  ): boolean => clears(AutoMovieEnginePhysics.physicalShapeGjkCast(from, to, 0));
  const [lo, hi]: Span = possible;
  const first: AutoMovieEnginePhysicsGjkTypes.ISolid = placed(lo);
  const last: AutoMovieEnginePhysicsGjkTypes.ISolid = placed(hi);
  if (sweep(first, last)) return undefined;

  const boundary = (
    end: AutoMovieEnginePhysicsGjkTypes.ISolid,
    from: number,
    to: number,
  ): number => {
    if (!clears(end)) return from;
    let certified: number = from;
    AutoMovieEngineMath.bracketedBisection(
      (at: number): boolean => {
        if (!sweep(end, placed(at))) return false;
        certified = at;
        return true;
      },
      from,
      to,
      precision,
    );
    return certified;
  };
  const from: number = boundary(first, lo, hi);
  const to: number = boundary(last, hi, lo);
  return from < to ? [from, to] : undefined;
}

/** An interval of material-axis translation, metres. */
type Span = readonly [number, number];

import { Vector3, boundAutoMovieProjectionSeparation, physicalShapeGjk, AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/** An interval of material-axis translation, metres. */
type Span = readonly [number, number];

/**
 * Enclose the obstructed part of one finite translation of a fixed convex
 * solid. Its intersecting placements are the line through the convex
 * configuration-space obstacle (the other solid plus the moving solid
 * reflected). A prefix and a suffix cast can each lose certification only
 * once as they grow. Use the exact hull of the two translated endpoints
 * (`physicalShapeGjk.cast`) and keep the last certified ends of their brackets.
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
  moving: physicalShapeGjk.ISolid,
  obstacle: physicalShapeGjk.ISolid,
  axis: IAutoMovieVector3,
  possible: Span,
  precision: number,
  faces?: readonly IAutoMovieVector3[],
): Span | undefined {
  const placed = (distance: number): physicalShapeGjk.ISolid => {
    const delta: IAutoMovieVector3 = Vector3.scale(axis, distance);
    return {
      points: moving.points.map(
        (point: IAutoMovieVector3): IAutoMovieVector3 =>
          Vector3.add(point, delta),
      ),
      radius: moving.radius,
    };
  };
  const clears = (solid: physicalShapeGjk.ISolid): boolean => {
    const result: physicalShapeGjk.IBound = physicalShapeGjk(
      solid,
      obstacle,
      precision,
    );
    if (result.lower >= 0) return true;
    return (
      result.upper > 0 &&
      (faces?.some(
        (normal: IAutoMovieVector3): boolean =>
          boundAutoMovieProjectionSeparation(
            solid.points,
            obstacle.points,
            normal,
          ) >
          solid.radius + obstacle.radius,
      ) ?? false)
    );
  };
  const sweep = (
    from: physicalShapeGjk.ISolid,
    to: physicalShapeGjk.ISolid,
  ): boolean => clears(physicalShapeGjk.cast(from, to, 0));
  const [lo, hi]: Span = possible;
  const first: physicalShapeGjk.ISolid = placed(lo);
  const last: physicalShapeGjk.ISolid = placed(hi);
  if (sweep(first, last)) return undefined;

  const boundary = (
    end: physicalShapeGjk.ISolid,
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

import type { IAutoMovieSweep } from "@automovie/interface";

/**
 * Refuse a feature whose band or points cannot define a finite sweep
 * displacement.
 *
 * @param f The feature, only read
 * @param index Its index for diagnostics
 * @throws Error for a non-positive width, fewer than two points, out-of-domain
 *   points, mixed value modes or non-finite values
 */
export function checkAutoMovieSweepFeature(
  f: IAutoMovieSweep.IFeature,
  index: number,
): void {
  if (!(f.width > 0))
    throw new Error(`sweep feature ${index} width must be positive and finite`);
  if (f.points.length < 2)
    throw new Error(`sweep feature ${index} needs at least two points`);
  const relative: boolean = f.points[0]!.offset !== undefined;
  f.points.forEach((p: IAutoMovieSweep.IFeaturePoint): void => {
    if (p.at < 0 || p.at > 1)
      throw new Error(
        `sweep feature ${index} point lies off the surface's domain`,
      );
    if (
      (p.offset !== undefined) !== relative ||
      (p.radius !== undefined) === relative
    )
      throw new Error(
        `sweep feature ${index} must give every point either a radius or an offset`,
      );
    if (!relative && p.radius! <= 0)
      throw new Error(`sweep feature ${index} radius must be positive`);
  });
}

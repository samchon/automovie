/*
 * Intersect two convex planar polygons in one common coordinate unit.
 *
 * Sutherland-Hodgman clipping retains the subject's winding and includes the
 * clipping edges. The subject and boundary may wind either way. Inputs must be
 * finite, convex and numerically well scaled. A zero-area boundary returns
 * empty; point/line contact may return a nonempty zero-area outline. Binary64
 * arithmetic has no directed rounding or independent convexity validation.
 */
export function intersectAutoMovieConvexPolygons(
  subject: readonly (readonly [number, number])[],
  boundary: readonly (readonly [number, number])[],
): [number, number][] {
  let signed: number = 0;
  for (let i: number = 0; i < boundary.length; ++i) {
    const a: readonly [number, number] = boundary[i]!;
    const b: readonly [number, number] = boundary[(i + 1) % boundary.length]!;
    signed += a[0] * b[1] - a[1] * b[0];
  }
  if (signed === 0) return [];
  const sense: number = Math.sign(signed);
  let polygon: [number, number][] = subject.map(
    (p: readonly [number, number]): [number, number] => [...p],
  );
  for (let i: number = 0; i < boundary.length && polygon.length !== 0; ++i) {
    const a: readonly [number, number] = boundary[i]!;
    const b: readonly [number, number] = boundary[(i + 1) % boundary.length]!;
    const distance: (p: [number, number]) => number = (
      p: [number, number],
    ): number =>
      sense * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
    const next: [number, number][] = [];
    for (let j: number = 0; j < polygon.length; ++j) {
      const current: [number, number] = polygon[j]!;
      const previous: [number, number] =
        polygon[(j + polygon.length - 1) % polygon.length]!;
      const dc: number = distance(current);
      const dp: number = distance(previous);
      const crossing: () => [number, number] = (): [number, number] => {
        const t: number = dp / (dp - dc);
        return [
          previous[0] + t * (current[0] - previous[0]),
          previous[1] + t * (current[1] - previous[1]),
        ];
      };
      if (dc >= 0) {
        if (dp < 0 && dc > 0) next.push(crossing());
        next.push(current);
      } else if (dp > 0) next.push(crossing());
    }
    polygon = next;
  }
  return polygon;
}

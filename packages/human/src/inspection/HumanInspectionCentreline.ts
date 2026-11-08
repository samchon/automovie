import type { IHumanInspectionDocument } from "./IHumanInspectionDocument";

/**
 * The points a construction tube was swept along, recovered exactly from the tube mesh.
 *
 * `AutoMovieHumanLoftTube.sweep` places four vertices at `p + r (cos a n + sin a b)` for
 * a = 0, 90, 180 and 270 degrees round each swept point p, so the mean of each ring of four is p.
 * A closed tube has 8 triangles per point, an open one 8 per point less one ring; any other shape
 * is refused, since its points would not be the curve's.
 *
 * @param positions Flat tube vertex positions.
 * @param triangles Number of tube triangles.
 * @param id Curve id, named in the refusal.
 * @param scale Factor from the positions' unit to millimetres, applied to each mean so no scaled copy of the tube is made.
 * @returns Whether the curve closes and its points in millimetres, rounded to a micrometre.
 */
export function HumanInspectionCentreline(
  positions: ArrayLike<number>,
  triangles: number,
  id: string,
  scale: number = 1,
): { closed: boolean; points: IHumanInspectionDocument.Point[] } {
  const sides: number = 4;
  const count: number = positions.length / (3 * sides);
  if (
    !Number.isInteger(count) ||
    count < 2 ||
    (triangles !== 2 * sides * count && triangles !== 2 * sides * (count - 1))
  )
    throw new Error("Construction tube " + id + " is not a four-sided sweep");
  const points: IHumanInspectionDocument.Point[] = [];
  for (let i: number = 0; i < count; ++i) {
    const point: IHumanInspectionDocument.Point = [0, 0, 0];
    for (let k: number = 0; k < sides; ++k)
      for (let axis: number = 0; axis < 3; ++axis)
        point[axis] += (positions[3 * (i * sides + k) + axis]! * scale) / sides;
    points.push(
      point.map((n: number): number => Math.round(n * 1e3) / 1e3) as IHumanInspectionDocument.Point,
    );
  }
  return { closed: triangles === 2 * sides * count, points };
}

import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Girth of a subdivided leg surface in one plane: the length of the closed curve where the plane cuts the surface, the way a tape laid in that plane around the limb measures it.
 *
 * Each quad is split into two triangles; every triangle the plane crosses contributes the segment between its two edge crossings, and the segments' lengths add up to the curve. Only triangles within `reach` of the plane's origin count, so a plane that would also cut a distant part of the limb measures the section around its own station.
 *
 * @param props.positions Packed limit positions `[x, y, z, ...]`, millimetres
 * @param props.faces Quads as four vertex indices each
 * @param props.origin A point of the plane, on the limb's axis
 * @param props.normal Unit normal of the plane, along the limb
 * @param props.reach Largest distance from the origin a counted crossing may lie at, millimetres
 * @returns Girth, millimetres
 */
export function measureAutoMovieHumanLegGirth(props: {
  positions: number[];
  faces: number[];
  origin: IAutoMovieVector3;
  normal: IAutoMovieVector3;
  reach: number;
}): number {
  const { positions, faces, origin, normal } = props;
  const height = (v: number): number =>
    (positions[3 * v]! - origin.x) * normal.x +
    (positions[3 * v + 1]! - origin.y) * normal.y +
    (positions[3 * v + 2]! - origin.z) * normal.z;
  const cross = (a: number, b: number): IAutoMovieVector3 => {
    const ha: number = height(a);
    const t: number = ha / (ha - height(b));
    return {
      x: positions[3 * a]! + t * (positions[3 * b]! - positions[3 * a]!),
      y: positions[3 * a + 1]! + t * (positions[3 * b + 1]! - positions[3 * a + 1]!),
      z: positions[3 * a + 2]! + t * (positions[3 * b + 2]! - positions[3 * a + 2]!),
    };
  };
  const near = (p: IAutoMovieVector3): boolean =>
    Math.hypot(p.x - origin.x, p.y - origin.y, p.z - origin.z) <= props.reach;
  let girth: number = 0;
  for (let f: number = 0; f < faces.length; f += 4) {
    const quad: number[] = [faces[f]!, faces[f + 1]!, faces[f + 2]!, faces[f + 3]!];
    for (const triangle of [
      [quad[0]!, quad[1]!, quad[2]!],
      [quad[0]!, quad[2]!, quad[3]!],
    ]) {
      const points: IAutoMovieVector3[] = [];
      for (let e: number = 0; e < 3; ++e) {
        const a: number = triangle[e]!;
        const b: number = triangle[(e + 1) % 3]!;
        if (height(a) < 0 !== height(b) < 0) points.push(cross(a, b));
      }
      if (points.length === 2 && near(points[0]!))
        girth += Math.hypot(
          points[0]!.x - points[1]!.x,
          points[0]!.y - points[1]!.y,
          points[0]!.z - points[1]!.z,
        );
    }
  }
  return girth;
}

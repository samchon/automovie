import type { Bounds } from "./Bounds";
import type { Vec } from "./Vec";
import { MeshWriter } from "./MeshWriter";

/**
 * Boundary of authored orthogonal pieces after authored cuboidal cuts.
 *
 * Axis endpoints partition the host into cells. Midpoint membership in the piece union, minus void membership, decides solid cells; an empty piece list uses the host box. Only solid-to-empty boundaries are emitted. Inputs require finite ordered bounds with distinguishable midpoints; no tolerance repairs nearly coincident planes.
 *
 * With X/Y/Z interval counts and P/V pieces/cuts, occupancy costs O(XYZ(P+V)). Group construction repeatedly copies coplanar face points, and each emitted quad rescans its group's UV references; these costs can be quadratic in a face group. Groups and intervals are local; the supplied writer retains emitted arrays without an independent size cap. No result is reused across mutable recipe inputs.
 */
export function cutBoxes(
  w: MeshWriter,
  part: Bounds,
  pieces: Bounds[],
  voids: Bounds[],
): void {
  const axes: (keyof Bounds)[] = ["x", "y", "z"];
  const coords: number[][] = axes.map((axis: keyof Bounds) : number[] =>
    [
      ...new Set([
        part[axis][0],
        part[axis][1],
        ...pieces.flatMap((p: Bounds) : [number, number] => p[axis]),
        ...voids.flatMap((v: Bounds) : [number, number] => v[axis]),
      ]),
    ]
      .filter((n: number) : boolean => n >= part[axis][0] && n <= part[axis][1])
      .sort((a: number, b: number) : number => a - b),
  );
  const intervals: [number, number][][] = coords.map((values: number[]) : [number, number][] =>
    values.slice(0, -1).map((a: number, i: number): [number, number] => [a, values[i + 1]]),
  );
  const inside: (x: number, y: number, z: number, b: Bounds) => boolean = (x: number, y: number, z: number, b: Bounds) : boolean =>
    x >= b.x[0] &&
    x <= b.x[1] &&
    y >= b.y[0] &&
    y <= b.y[1] &&
    z >= b.z[0] &&
    z <= b.z[1];
  const solid: (i: number, j: number, k: number) => boolean = (i: number, j: number, k: number) : boolean => {
    if (
      i < 0 ||
      j < 0 ||
      k < 0 ||
      i >= intervals[0].length ||
      j >= intervals[1].length ||
      k >= intervals[2].length
    )
      return false;
    const x: number = (intervals[0][i][0] + intervals[0][i][1]) / 2,
      y: number = (intervals[1][j][0] + intervals[1][j][1]) / 2,
      z: number = (intervals[2][k][0] + intervals[2][k][1]) / 2;
    return (
      (pieces.length
        ? pieces.some((b: Bounds) : boolean => inside(x, y, z, b))
        : inside(x, y, z, part)) && !voids.some((b: Bounds) : boolean => inside(x, y, z, b))
    );
  };
  const faces: Array<{
    points: [Vec, Vec, Vec, Vec];
    normal: Vec;
    plane: number;
  }> = [];
  const face: (points: [Vec, Vec, Vec, Vec], normal: Vec, plane: number) => number = (points: [Vec, Vec, Vec, Vec], normal: Vec, plane: number) : number =>
    faces.push({ points, normal, plane });
  for (let i: number = 0; i < intervals[0].length; i++)
    for (let j: number = 0; j < intervals[1].length; j++)
      for (let k: number = 0; k < intervals[2].length; k++) {
        if (!solid(i, j, k)) continue;
        const [x0, x1]: [number, number] = intervals[0][i],
          [y0, y1]: [number, number] = intervals[1][j],
          [z0, z1]: [number, number] = intervals[2][k];
        if (!solid(i - 1, j, k))
          face(
            [
              [x0, y0, z0],
              [x0, y1, z0],
              [x0, y1, z1],
              [x0, y0, z1],
            ],
            [-1, 0, 0],
            x0,
          );
        if (!solid(i + 1, j, k))
          face(
            [
              [x1, y0, z0],
              [x1, y1, z0],
              [x1, y1, z1],
              [x1, y0, z1],
            ],
            [1, 0, 0],
            x1,
          );
        if (!solid(i, j - 1, k))
          face(
            [
              [x0, y0, z0],
              [x1, y0, z0],
              [x1, y0, z1],
              [x0, y0, z1],
            ],
            [0, -1, 0],
            y0,
          );
        if (!solid(i, j + 1, k))
          face(
            [
              [x0, y1, z0],
              [x1, y1, z0],
              [x1, y1, z1],
              [x0, y1, z1],
            ],
            [0, 1, 0],
            y1,
          );
        if (!solid(i, j, k - 1))
          face(
            [
              [x0, y0, z0],
              [x1, y0, z0],
              [x1, y1, z0],
              [x0, y1, z0],
            ],
            [0, 0, -1],
            z0,
          );
        if (!solid(i, j, k + 1))
          face(
            [
              [x0, y0, z1],
              [x1, y0, z1],
              [x1, y1, z1],
              [x0, y1, z1],
            ],
            [0, 0, 1],
            z1,
          );
      }
  const groups: Map<string, Vec[]> = new Map<string, Vec[]>();
  for (const f of faces) {
    const key: string = `${f.normal.join(",")}/${f.plane}`;
    groups.set(key, [...(groups.get(key) ?? []), ...f.points]);
  }
  for (const f of faces)
    w.quad(f.points, f.normal, groups.get(`${f.normal.join(",")}/${f.plane}`)!);
}

import type { IAutoMovieMesh } from "@automovie/interface";

/** Orthogonal faces, metric UVs and reviewed union/subtraction boundaries.
 * Owner: docs/models/000-representation.md#model-uv-and-topology. */
export interface Bounds {
  x: [number, number];
  y: [number, number];
  z: [number, number];
}
export type Vec = [number, number, number];

export class MeshWriter {
  readonly positions: number[] = [];
  readonly normals: number[] = [];
  readonly uvs: number[] = [];
  readonly indices: number[] = [];

  vertex(p: Vec, n: Vec, uv: [number, number]): number {
    const index = this.positions.length / 3;
    this.positions.push(...p);
    this.normals.push(...n);
    this.uvs.push(...uv);
    return index;
  }
  triangle(a: number, b: number, c: number): void {
    const p = (i: number): Vec => [
      this.positions[i * 3],
      this.positions[i * 3 + 1],
      this.positions[i * 3 + 2],
    ];
    const n: Vec = [
      this.normals[a * 3],
      this.normals[a * 3 + 1],
      this.normals[a * 3 + 2],
    ];
    const outward = dot(cross(sub(p(b), p(a)), sub(p(c), p(a))), n) >= 0;
    this.indices.push(a, outward ? b : c, outward ? c : b);
  }
  quad(
    points: [Vec, Vec, Vec, Vec],
    normal: Vec,
    uvReference: Vec[] = points,
  ): void {
    const face = points.map((p) =>
      this.vertex(p, normal, metricUv(p, normal, uvReference)),
    );
    const ab = sub(points[1], points[0]);
    const ac = sub(points[2], points[0]);
    if (dot(cross(ab, ac), normal) > 0) {
      this.triangle(face[0], face[1], face[2]);
      this.triangle(face[0], face[2], face[3]);
    } else {
      this.triangle(face[0], face[2], face[1]);
      this.triangle(face[0], face[3], face[2]);
    }
  }
  finish(): IAutoMovieMesh {
    if (
      !this.indices.length ||
      this.uvs.length !== (this.positions.length / 3) * 2
    )
      throw Error("empty or non-UV model part");
    return {
      positions: this.positions,
      normals: this.normals,
      uvs: this.uvs,
      indices: this.indices,
      skin: null,
    };
  }
}
export function sub(a: Vec, b: Vec): Vec {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
export function dot(a: Vec, b: Vec): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
export function cross(a: Vec, b: Vec): Vec {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
export function normalize(a: Vec): Vec {
  const length = Math.hypot(...a);
  return [a[0] / length, a[1] / length, a[2] / length];
}

// docs/models/000-representation.md#model-uv-and-topology: physical metre
// coordinates on each planar face, with the same axes on opposing normals.
export function metricUv(p: Vec, n: Vec, points: Vec[]): [number, number] {
  const axis =
    Math.abs(n[0]) > 0.5 ? [2, 1] : Math.abs(n[1]) > 0.5 ? [0, 2] : [0, 1];
  return [
    p[axis[0]] - Math.min(...points.map((q) => q[axis[0]])),
    p[axis[1]] - Math.min(...points.map((q) => q[axis[1]])),
  ];
}
export function planarBox(w: MeshWriter, b: Bounds, skipAxis = -1): void {
  const [x0, x1] = b.x,
    [y0, y1] = b.y,
    [z0, z1] = b.z;
  if (skipAxis !== 0) {
    w.quad(
      [
        [x0, y0, z0],
        [x0, y1, z0],
        [x0, y1, z1],
        [x0, y0, z1],
      ],
      [-1, 0, 0],
    );
    w.quad(
      [
        [x1, y0, z0],
        [x1, y1, z0],
        [x1, y1, z1],
        [x1, y0, z1],
      ],
      [1, 0, 0],
    );
  }
  if (skipAxis !== 2) {
    w.quad(
      [
        [x0, y0, z0],
        [x1, y0, z0],
        [x1, y1, z0],
        [x0, y1, z0],
      ],
      [0, 0, -1],
    );
    w.quad(
      [
        [x0, y0, z1],
        [x1, y0, z1],
        [x1, y1, z1],
        [x0, y1, z1],
      ],
      [0, 0, 1],
    );
  }
  if (skipAxis !== 1) {
    w.quad(
      [
        [x0, y0, z0],
        [x1, y0, z0],
        [x1, y0, z1],
        [x0, y0, z1],
      ],
      [0, -1, 0],
    );
    w.quad(
      [
        [x0, y1, z0],
        [x1, y1, z0],
        [x1, y1, z1],
        [x0, y1, z1],
      ],
      [0, 1, 0],
    );
  }
}

/** Extrude the reviewed 45-degree half-plane at each end of a stool ring bar. */
export function miteredBox(w: MeshWriter, b: Bounds): void {
  const [x0, x1] = b.x,
    [y0, y1] = b.y,
    [z0, z1] = b.z;
  const xLong = x1 - x0 > z1 - z0;
  const cx = (x0 + x1) / 2,
    cz = (z0 + z1) / 2;
  const half = (xLong ? z1 - z0 : x1 - x0) / 2;
  const profile: [number, number][] = xLong
    ? [
        [x0, cz < 0 ? z0 : z1],
        [x1, cz < 0 ? z0 : z1],
        [x1, cz],
        [x1 - half, cz < 0 ? z1 : z0],
        [x0 + half, cz < 0 ? z1 : z0],
        [x0, cz],
      ]
    : [
        [cx < 0 ? x0 : x1, z0],
        [cx < 0 ? x0 : x1, z1],
        [cx, z1],
        [cx < 0 ? x1 : x0, z1 - half],
        [cx < 0 ? x1 : x0, z0 + half],
        [cx, z0],
      ];
  const area = profile.reduce((sum, p, i) => {
    const q = profile[(i + 1) % profile.length];
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0);
  for (const [y, normal] of [
    [y0, -1],
    [y1, 1],
  ] as const) {
    const n: Vec = [0, normal, 0];
    const ids = profile.map(([x, z]) =>
      w.vertex([x, y, z], n, [x - x0, z - z0]),
    );
    for (let i = 1; i < ids.length - 1; i++)
      w.triangle(ids[0], ids[i], ids[i + 1]);
  }
  for (let i = 0; i < profile.length; i++) {
    const a = profile[i],
      d = profile[(i + 1) % profile.length];
    const dx = d[0] - a[0],
      dz = d[1] - a[1],
      length = Math.hypot(dx, dz);
    const sign = area > 0 ? 1 : -1;
    const n: Vec = [(sign * dz) / length, 0, (-sign * dx) / length];
    w.quad(
      [
        [a[0], y0, a[1]],
        [d[0], y0, d[1]],
        [d[0], y1, d[1]],
        [a[0], y1, a[1]],
      ],
      n,
    );
  }
}

/** Boundary of an axis-aligned union of reviewed pieces minus reviewed voids. */
export function cutBoxes(
  w: MeshWriter,
  part: Bounds,
  pieces: Bounds[],
  voids: Bounds[],
): void {
  const axes: (keyof Bounds)[] = ["x", "y", "z"];
  const coords = axes.map((axis) =>
    [
      ...new Set([
        part[axis][0],
        part[axis][1],
        ...pieces.flatMap((p) => p[axis]),
        ...voids.flatMap((v) => v[axis]),
      ]),
    ]
      .filter((n) => n >= part[axis][0] && n <= part[axis][1])
      .sort((a, b) => a - b),
  );
  const intervals = coords.map((values) =>
    values.slice(0, -1).map((a, i): [number, number] => [a, values[i + 1]]),
  );
  const inside = (x: number, y: number, z: number, b: Bounds) =>
    x >= b.x[0] &&
    x <= b.x[1] &&
    y >= b.y[0] &&
    y <= b.y[1] &&
    z >= b.z[0] &&
    z <= b.z[1];
  const solid = (i: number, j: number, k: number) => {
    if (
      i < 0 ||
      j < 0 ||
      k < 0 ||
      i >= intervals[0].length ||
      j >= intervals[1].length ||
      k >= intervals[2].length
    )
      return false;
    const x = (intervals[0][i][0] + intervals[0][i][1]) / 2,
      y = (intervals[1][j][0] + intervals[1][j][1]) / 2,
      z = (intervals[2][k][0] + intervals[2][k][1]) / 2;
    return (
      (pieces.length
        ? pieces.some((b) => inside(x, y, z, b))
        : inside(x, y, z, part)) && !voids.some((b) => inside(x, y, z, b))
    );
  };
  const faces: Array<{
    points: [Vec, Vec, Vec, Vec];
    normal: Vec;
    plane: number;
  }> = [];
  const face = (points: [Vec, Vec, Vec, Vec], normal: Vec, plane: number) =>
    faces.push({ points, normal, plane });
  for (let i = 0; i < intervals[0].length; i++)
    for (let j = 0; j < intervals[1].length; j++)
      for (let k = 0; k < intervals[2].length; k++) {
        if (!solid(i, j, k)) continue;
        const [x0, x1] = intervals[0][i],
          [y0, y1] = intervals[1][j],
          [z0, z1] = intervals[2][k];
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
  const groups = new Map<string, Vec[]>();
  for (const f of faces) {
    const key = `${f.normal.join(",")}/${f.plane}`;
    groups.set(key, [...(groups.get(key) ?? []), ...f.points]);
  }
  for (const f of faces)
    w.quad(f.points, f.normal, groups.get(`${f.normal.join(",")}/${f.plane}`)!);
}

/** Shared geometry and frame calculations for exterior repetition. */
import {
  type IAutoMovieMeshTransform,
  transformAutoMovieMesh,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

export type Vec = readonly [number, number, number];
export type Point = readonly [number, number];
export type Plane = { x: number; y: number; limit: number };
export type Model = {
  model: IAutoMovieModel;
  faceByPart: Readonly<Record<string, string>>;
  /** Collection membership survives material partitioning and inspection. */
  memberByPart?: Readonly<Record<string, string>>;
};
export type Instance = {
  id: string;
  modelId: string;
  transform: IAutoMovieMeshTransform;
};
export type Frame = {
  origin: Vec;
  u: Vec;
  v: Vec;
  n: Vec;
  rotation: { x: number; y: number; z: number; w: number };
};

export const dot = (a: Vec, b: Vec): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (v: Vec): Vec => {
  const d = Math.hypot(...v);
  return [v[0] / d, v[1] / d, v[2] / d];
};
const minus = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const plus = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const times = (v: Vec, s: number): Vec => [v[0] * s, v[1] * s, v[2] * s];

/** Convert the orthonormal frame columns to a unit quaternion. */
export const rotationOf = (u: Vec, v: Vec, n: Vec): Frame["rotation"] => {
  const [m00, m10, m20] = u,
    [m01, m11, m21] = v,
    [m02, m12, m22] = n;
  const trace = m00 + m11 + m22;
  let x: number, y: number, z: number, w: number;
  if (trace > 0) {
    const s = 2 * Math.sqrt(trace + 1);
    w = s / 4;
    x = (m21 - m12) / s;
    y = (m02 - m20) / s;
    z = (m10 - m01) / s;
  } else if (m00 > m11 && m00 > m22) {
    const s = 2 * Math.sqrt(1 + m00 - m11 - m22);
    w = (m21 - m12) / s;
    x = s / 4;
    y = (m01 + m10) / s;
    z = (m02 + m20) / s;
  } else if (m11 > m22) {
    const s = 2 * Math.sqrt(1 + m11 - m00 - m22);
    w = (m02 - m20) / s;
    x = (m01 + m10) / s;
    y = s / 4;
    z = (m12 + m21) / s;
  } else {
    const s = 2 * Math.sqrt(1 + m22 - m00 - m11);
    w = (m10 - m01) / s;
    x = (m02 + m20) / s;
    y = (m12 + m21) / s;
    z = s / 4;
  }
  const norm = Math.hypot(x, y, z, w);
  return { x: x / norm, y: y / norm, z: z / norm, w: w / norm };
};

/** Read only weather-side triangles from a roof owner's current mesh. */
export const roofTriangles = (
  mesh: IAutoMovieMesh,
): { vertices: readonly [Vec, Vec, Vec]; normal: Vec }[] => {
  const indices = mesh.indices;
  if (indices === null || mesh.normals === null)
    throw new Error("roof mesh needs indices and normals");
  const result: { vertices: readonly [Vec, Vec, Vec]; normal: Vec }[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const read = (at: number): Vec => {
      const o = indices[i + at]! * 3;
      return [
        mesh.positions[o]!,
        mesh.positions[o + 1]!,
        mesh.positions[o + 2]!,
      ];
    };
    const no = indices[i]! * 3;
    const normal: Vec = [
      mesh.normals[no]!,
      mesh.normals[no + 1]!,
      mesh.normals[no + 2]!,
    ];
    if (normal[1] > 0.5)
      result.push({ vertices: [read(0), read(1), read(2)], normal });
  }
  return result;
};

export const roofFrame = (triangle: {
  vertices: readonly [Vec, Vec, Vec];
  normal: Vec;
}): Frame => {
  const n = unit(triangle.normal);
  const v = unit(minus([0, 1, 0], times(n, n[1])));
  const u = unit(cross(v, n));
  return {
    origin: triangle.vertices[0],
    u,
    v,
    n,
    rotation: rotationOf(u, v, n),
  };
};
export const local = (frame: Frame, p: Vec): Point => {
  const d = minus(p, frame.origin);
  return [dot(d, frame.u), dot(d, frame.v)];
};
export const world = (frame: Frame, x: number, y: number): Vec =>
  plus(frame.origin, plus(times(frame.u, x), times(frame.v, y)));
export const polygonArea = (points: readonly Point[]): number =>
  Math.abs(
    points.reduce((sum, p, i) => {
      const q = points[(i + 1) % points.length]!;
      return sum + p[0] * q[1] - q[0] * p[1];
    }, 0),
  ) / 2;

/** Clip a convex polygon by one half-plane, for nonempty-strip selection. */
export const clip = (polygon: readonly Point[], plane: Plane): Point[] => {
  const output: Point[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]!,
      b = polygon[(i + 1) % polygon.length]!;
    const fa = plane.x * a[0] + plane.y * a[1] - plane.limit;
    const fb = plane.x * b[0] + plane.y * b[1] - plane.limit;
    if (fa <= 1e-9) output.push(a);
    if ((fa < 0 && fb > 0) || (fa > 0 && fb < 0)) {
      const t = fa / (fa - fb);
      output.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return output;
};
export const trianglePlanes = (
  vertices: readonly [Point, Point, Point],
): Plane[] => {
  const [a, b, c] = vertices;
  const sign =
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) > 0 ? 1 : -1;
  return vertices.map((p, i) => {
    const q = vertices[(i + 1) % 3]!;
    const dx = q[0] - p[0],
      dy = q[1] - p[1];
    return {
      x: sign * dy,
      y: -sign * dx,
      limit: sign * (dy * p[0] - dx * p[1]),
    };
  });
};
export const identity: IAutoMovieMeshTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

/** The weather plane and outward direction belong to the wall's source owner. */
export const facadeFrame = (id: string, mesh: IAutoMovieMesh): Frame => {
  const values = (axis: number) =>
    mesh.positions.filter((_, i) => i % 3 === axis);
  const side = id.startsWith("front-")
    ? "front"
    : id.startsWith("rear-")
      ? "rear"
      : id.startsWith("left-")
        ? "left"
        : id.startsWith("right-")
          ? "right"
          : null;
  if (side === null) throw new Error(`unassigned facade wall: ${id}`);
  const u: Vec =
    side === "front"
      ? [1, 0, 0]
      : side === "rear"
        ? [-1, 0, 0]
        : side === "left"
          ? [0, 0, 1]
          : [0, 0, -1];
  const v: Vec = [0, 1, 0],
    n = cross(u, v);
  const plane =
    side === "front"
      ? Math.max(...values(2))
      : side === "rear"
        ? Math.min(...values(2))
        : side === "left"
          ? Math.min(...values(0))
          : Math.max(...values(0));
  const origin: Vec =
    side === "front" || side === "rear" ? [0, 0, plane] : [plane, 0, 0];
  return { origin, u, v, n, rotation: rotationOf(u, v, n) };
};

export const facadeTriangles = (
  mesh: IAutoMovieMesh,
  frame: Frame,
): (readonly [Point, Point, Point])[] => {
  if (mesh.indices === null || mesh.normals === null)
    throw new Error("facade mesh needs indices and normals");
  const result: (readonly [Point, Point, Point])[] = [];
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const at = (j: number): Vec => {
      const offset = mesh.indices![i + j]! * 3;
      return [
        mesh.positions[offset]!,
        mesh.positions[offset + 1]!,
        mesh.positions[offset + 2]!,
      ];
    };
    const first = mesh.indices[i]! * 3;
    const normal: Vec = [
      mesh.normals[first]!,
      mesh.normals[first + 1]!,
      mesh.normals[first + 2]!,
    ];
    if (
      dot(normal, frame.n) > 0.99 &&
      Math.abs(dot(minus(at(0), frame.origin), frame.n)) < 1e-6
    )
      result.push([
        local(frame, at(0)),
        local(frame, at(1)),
        local(frame, at(2)),
      ]);
  }
  return result;
};

export const intervalsAt = (
  triangles: readonly (readonly [Point, Point, Point])[],
  x: number,
): [number, number][] => {
  const found: [number, number][] = [];
  for (const triangle of triangles) {
    const crossings: number[] = [];
    for (let i = 0; i < 3; i++) {
      const a = triangle[i]!,
        b = triangle[(i + 1) % 3]!;
      if ((a[0] < x && x < b[0]) || (b[0] < x && x < a[0]))
        crossings.push(a[1] + ((x - a[0]) * (b[1] - a[1])) / (b[0] - a[0]));
    }
    if (crossings.length === 2)
      found.push([Math.min(...crossings), Math.max(...crossings)]);
  }
  found.sort((a, b) => a[0] - b[0]);
  const union: [number, number][] = [];
  for (const interval of found) {
    const last = union[union.length - 1];
    if (last !== undefined && interval[0] <= last[1] + 1e-7)
      last[1] = Math.max(last[1], interval[1]);
    else union.push([...interval]);
  }
  return union;
};

/** Assemble one course without welding touching prototype surfaces. */
export const collect = (
  id: string,
  members: readonly { built: Model; transform: IAutoMovieMeshTransform }[],
): Model => {
  const parts: IAutoMovieModelPart[] = [];
  const faceByPart: Record<string, string> = {};
  const memberByPart: Record<string, string> = {};
  for (const [memberIndex, { built, transform }] of members.entries())
    for (const part of built.model.parts) {
      if (part.geometry.type !== "mesh")
        throw new Error(`non-mesh exterior member: ${part.id}`);
      const face = built.faceByPart[part.id];
      if (face === undefined)
        throw new Error(`unbound exterior member: ${part.id}`);
      const partId = `${memberIndex}-${part.id}`;
      parts.push({
        id: partId,
        name: partId,
        geometry: {
          type: "mesh",
          mesh: transformAutoMovieMesh(part.geometry.mesh, transform),
        },
        material: null,
        attachedBone: null,
        transform: null,
      });
      faceByPart[partId] = face;
      memberByPart[partId] =
        `${memberIndex}/${built.memberByPart?.[part.id] ?? ""}`;
    }
  const model: IAutoMovieModel = {
    id,
    name: id,
    origin: "generated",
    parts,
    skeleton: null,
    body: null,
    materials: [],
    asset: null,
  };
  return {
    model,
    faceByPart,
    memberByPart,
  };
};

/** Deterministic weather-face repetition from the current house geometry. */

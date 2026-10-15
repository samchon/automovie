import type { IAutoMovieMesh } from "@automovie/interface";
import { quad } from "./quad";
import { empty } from "./empty";
import { Vec3 } from "./Vec3";

/** Closed cylinder with metric circumferential and axial UVs. */

export const cylinder = (axis: "x" | "y" | "z", center: Vec3, radius: number,
  start: number, end: number): IAutoMovieMesh => {
  if (![...center, radius, start, end].every(Number.isFinite) || radius <= 0 || end <= start)
    throw new Error("invalid exterior door cylinder");
  const mesh = empty(), sides = 24;
  const point = (a: number, t: number): Vec3 => {
    const u = radius * Math.sin(a), v = radius * Math.cos(a);
    return axis === "x"
      ? [t, center[1] + u, center[2] + v]
      : axis === "y"
        ? [center[0] + u, t, center[2] + v]
        : [center[0] + u, center[1] + v, t];
  };
  const radial = (a: number): Vec3 => axis === "x"
    ? [0, Math.sin(a), Math.cos(a)]
    : axis === "y"
      ? [Math.sin(a), 0, Math.cos(a)]
      : [Math.sin(a), Math.cos(a), 0];
  for (let i = 0; i < sides; i++) {
    const a = i * 2 * Math.PI / sides, b = (i + 1) * 2 * Math.PI / sides;
    const p = [
      point(a, start),
      point(b, start),
      point(b, end),
      point(a, end),
    ] as const;
    // Separate vertices at each facet provide its own flat normal.
    const mid = radial((a + b) / 2);
    quad(mesh, axis === "y" ? p : [p[3], p[2], p[1], p[0]], mid, (v) => [
      radius * (v === p[0] || v === p[3] ? a : b),
      axis === "x" ? v[0] - start : axis === "y" ? v[1] - start : v[2] - start,
    ]);
    const cap = (t: number, sign: number): void => {
      const c = axis === "x"
        ? [t, center[1], center[2]] as Vec3
        : axis === "y"
          ? [center[0], t, center[2]] as Vec3
          : [center[0], center[1], t] as Vec3;
      const v0 = point(a, t), v1 = point(b, t);
      const n = axis === "x"
        ? [sign, 0, 0] as Vec3
        : axis === "y"
          ? [0, sign, 0] as Vec3
          : [0, 0, sign] as Vec3;
      const first = mesh.positions.length / 3;
      for (const v of [c, v0, v1]) {
        mesh.positions.push(...v);
        mesh.normals!.push(...n);
        const uv: readonly [number, number] = axis === "x"
          ? [v[1] - center[1], v[2] - center[2]]
          : axis === "y"
            ? [v[0] - center[0], v[2] - center[2]]
            : [v[0] - center[0], v[1] - center[1]];
        mesh.uvs!.push(...uv);
      }
      if ((sign === 1) === (axis === "y")) mesh.indices!.push(
        first,
        first + 1,
        first + 2
      );
      else mesh.indices!.push(first, first + 2, first + 1);
    };
    cap(start, -1);
    cap(end, 1);
  }
  return mesh;
};

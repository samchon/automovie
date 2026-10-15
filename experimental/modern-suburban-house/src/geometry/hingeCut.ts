import type { IAutoMovieMesh } from "@automovie/interface";
import { Box } from "./Box";
import { quad } from "./quad";
import { empty } from "./empty";
import { Face } from "./Face";
import { Vec3 } from "./Vec3";

type Notch = "edge-left" | "edge-right" | "corner-right-bottom" |
  "corner-left-top" | "corner-right-top";
/** Extrude a member with a true polygonal hinge-cylinder subtraction. */

export const hingeCut = (b: Box, axisX: number, axisZ: number, radius: number,
  notch: Notch, front: Face, back: Face, edge: Face): readonly [Face, IAutoMovieMesh][] => {
  const [x0, x1, y0, y1, z0, z1] = b, poly: [number, number][] = [];
  const push = (x: number, z: number): void => {
    poly.push([x, z]);
  };
  const half = 12, quarter = 6, step = Math.PI / 12;
  if (notch === "edge-left") {
    push(x0, z0);
    push(x1, z0);
    push(x1, z1);
    push(x0, z1);
    push(x0, axisZ + radius);
    for (let i = 1; i <= half; i++) push(
      axisX + radius * Math.sin(i * step),
      axisZ + radius * Math.cos(i * step)
    );
  } else if (notch === "edge-right") {
    push(x0, z0);
    push(x1, z0);
    push(x1, axisZ - radius);
    for (let i = 1; i <= half; i++) push(
      axisX - radius * Math.sin(i * step),
      axisZ - radius * Math.cos(i * step)
    );
    push(x1, z1);
    push(x0, z1);
  } else if (notch === "corner-right-bottom") {
    push(x0, z0);
    push(axisX - radius, z0);
    for (let i = 1; i <= quarter; i++) push(
      axisX - radius * Math.cos(i * step),
      axisZ + radius * Math.sin(i * step)
    );
    push(x1, z1);
    push(x0, z1);
  } else if (notch === "corner-left-top") {
    push(x0, z0);
    push(x1, z0);
    push(x1, z1);
    push(axisX + radius, z1);
    for (let i = 1; i <= quarter; i++) push(
      axisX + radius * Math.cos(i * step),
      axisZ - radius * Math.sin(i * step)
    );
  } else {
    push(x0, z0);
    push(x1, z0);
    push(x1, axisZ - radius);
    for (let i = 1; i <= quarter; i++) push(
      axisX - radius * Math.sin(i * step),
      axisZ - radius * Math.cos(i * step)
    );
    push(x0, z1);
  }
  const groups = new Map<Face, IAutoMovieMesh>();
  const surface = (id: Face): IAutoMovieMesh => {
    const m = groups.get(id) ?? empty();
    groups.set(id, m);
    return m;
  };
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!, b2 = poly[(i + 1) % poly.length]!;
    const dx = b2[0] - a[0], dz = b2[1] - a[1], length = Math.hypot(dx, dz);
    if (length < 1e-12) continue;
    const id = Math.abs(a[1] - z1) < 1e-9 && Math.abs(b2[1] - z1) < 1e-9
      ? front
      : Math.abs(a[1] - z0) < 1e-9 && Math.abs(b2[1] - z0) < 1e-9
        ? back
        : edge;
    const n: Vec3 = [dz / length, 0, -dx / length];
    quad(
      surface(id),
      [
        [a[0], y0, a[1]],
        [a[0], y1, a[1]],
        [b2[0], y1, b2[1]],
        [b2[0], y0, b2[1]],
      ],
      n,
      ([x, y, z]) => [Math.hypot(x - a[0], z - a[1]), y - y0]
    );
  }
  // Ear clipping retains the open circular notch in both end caps.
  const cross = (a: readonly number[], b2: readonly number[], c: readonly number[]): number => (b2[0]! - a[0]!) * (c[1]! - a[1]!) - (b2[1]! - a[1]!) * (c[0]! - a[0]!);
  const active = poly.map((_, i) => i), triangles: number[][] = [];
  while (active.length > 3) {
    let found = false;
    for (let k = 0; k < active.length; k++) {
      const ia = active[(k + active.length - 1) % active.length]!, ib = active[k]!, ic = active[(k + 1) % active.length]!;
      const a = poly[ia]!, b2 = poly[ib]!, c = poly[ic]!;
      if (cross(a, b2, c) <= 1e-12) continue;
      const inside = active.some((p) => {
        if (p === ia || p === ib || p === ic) return false;
        const q = poly[p]!;
        return cross(a, b2, q) > 1e-12 && cross(b2, c, q) > 1e-12 && cross(c, a, q) > 1e-12;
      });
      if (inside) continue;
      triangles.push([ia, ib, ic]);
      active.splice(k, 1);
      found = true;
      break;
    }
    if (!found) throw new Error(`hinge notch could not triangulate: ${notch}`);
  }
  triangles.push(active);
  for (const tri of triangles) {
    for (const [y, normal, order] of [
      [y0, -1, tri],
      [y1, 1, [tri[2]!, tri[1]!, tri[0]!]],
    ] as const) {
      const m = surface(edge), first = m.positions.length / 3;
      for (const i of order) {
        const [x, z] = poly[i]!;
        m.positions.push(x, y, z);
        m.normals!.push(0, normal, 0);
        m.uvs!.push(x - x0, z - z0);
      }
      m.indices!.push(first, first + 1, first + 2);
    }
  }
  return [...groups];
};

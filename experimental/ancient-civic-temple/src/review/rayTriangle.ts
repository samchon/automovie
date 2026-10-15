import { Point } from "./Point";
import { Triangle } from "./Triangle";


export const rayTriangle = (o: Point, d: Point, { a, b, c }: Pick<Triangle, "a" | "b" | "c">): number | null => {
  const e1 = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const e2 = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const cross = (u: Point, v: Point) => ({ x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x });
  const dot = (u: Point, v: Point) => u.x * v.x + u.y * v.y + u.z * v.z;
  const p = cross(d, e2);
  const det = dot(e1, p);
  if (Math.abs(det) < 1e-12) return null;
  const inv = 1 / det;
  const s = { x: o.x - a.x, y: o.y - a.y, z: o.z - a.z };
  const u = dot(s, p) * inv;
  if (u < 0 || u > 1) return null;
  const q = cross(s, e1);
  const v = dot(d, q) * inv;
  if (v < 0 || u + v > 1) return null;
  const distance = dot(e2, q) * inv;
  return distance > 1e-7 ? distance : null;
};

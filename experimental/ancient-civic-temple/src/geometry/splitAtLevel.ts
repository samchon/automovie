import type { IAutoMovieVector3 } from "@automovie/interface";
import type { WallFace } from "./WallFace";

/**
 * Splits a convex vertical face at the horizontal plane y=level into a lower and an upper convex face.
 * Vertex order is kept, so the outward normal does not change. A face entirely on one side is returned
 * whole as that side's surface, and pieces without area are dropped.
 */

export const splitAtLevel = (face: WallFace, level: number, below: string, above: string): WallFace[] => {
  const clip = (keepBelow: boolean): IAutoMovieVector3[] => {
    const inside = (p: IAutoMovieVector3) => keepBelow ? p.y <= level + 1e-9 : p.y >= level - 1e-9;
    const out: IAutoMovieVector3[] = [];
    face.corners.forEach((a, i) => {
      const b = face.corners[(i + 1) % face.corners.length]!;
      if (inside(a)) out.push(a);
      if (inside(a) !== inside(b) && Math.abs(b.y - a.y) > 1e-12) {
        const t = (level - a.y) / (b.y - a.y);
        out.push({ x: a.x + (b.x - a.x) * t, y: level, z: a.z + (b.z - a.z) * t });
      }
    });
    return out.filter((c, i) => {
      const n = out[(i + 1) % out.length]!;
      return Math.hypot(c.x - n.x, c.y - n.y, c.z - n.z) > 1e-6;
    });
  };
  const ys = face.corners.map((c) => c.y);
  if (Math.max(...ys) <= level + 1e-6) return [{ surface: below, corners: face.corners }];
  if (Math.min(...ys) >= level - 1e-6) return [{ surface: above, corners: face.corners }];
  return [
    { surface: below, corners: clip(true) }, { surface: above, corners: clip(false) },
  ].filter((f) => f.corners.length >= 3);
};

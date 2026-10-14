/**
 * Vertical section inspection: cuts the overlap scan's convex solids (wall
 * columns, roof slabs, coping, plinth and floor slabs) with an X or Z plane to
 * produce exact section pieces. At both ends of each plan polygon's intersection
 * with the cut line, reads the bottom and top plane heights to form a trapezoid.
 * This measurement drawing exposes gaps and overlaps between pieces; it does
 * not establish visual acceptance or document compliance.
 */
import { planeHeight, type PlanPoint } from "../geometry/planar-domain";
import type { ScanSolid } from "./envelope-overlaps";

export interface SectionPiece {
  group: string;
  kind: "wall" | "roof" | "trim" | "floor";
  /** Counterclockwise trapezoid in section coordinates: u is the other horizontal axis; y is height. */
  points: Array<{ u: number; y: number }>;
}

const kindOf = (group: string): SectionPiece["kind"] =>
  group.startsWith("roof:") ? "roof" : group.startsWith("trim:") ? "trim" : group.startsWith("floor:") ? "floor" : "wall";

export const sectionProfile = (solids: readonly ScanSolid[], axis: "x" | "z", offset: number): SectionPiece[] => {
  const pieces: SectionPiece[] = [];
  for (const solid of solids) {
    const us: number[] = [];
    solid.polygon.forEach((a, i) => {
      const b = solid.polygon[(i + 1) % solid.polygon.length]!;
      const [ca, cb] = axis === "x" ? [a.x, b.x] : [a.z, b.z];
      const [ua, ub] = axis === "x" ? [a.z, b.z] : [a.x, b.x];
      if ((ca - offset) * (cb - offset) > 0) return;
      if (Math.abs(cb - ca) < 1e-12) {
        if (Math.abs(ca - offset) < 1e-12) us.push(ua, ub);
        return;
      }
      us.push(ua + (ub - ua) * (offset - ca) / (cb - ca));
    });
    if (us.length < 2) continue;
    const [u0, u1] = [Math.min(...us), Math.max(...us)];
    if (u1 - u0 < 1e-6) continue;
    const at = (u: number): PlanPoint => axis === "x" ? { x: offset, z: u } : { x: u, z: offset };
    const [p0, p1] = [at(u0), at(u1)];
    pieces.push({
      group: solid.group, kind: kindOf(solid.group),
      points: [
        { u: u0, y: planeHeight(solid.bottom, p0) }, { u: u1, y: planeHeight(solid.bottom, p1) },
        { u: u1, y: planeHeight(solid.top, p1) }, { u: u0, y: planeHeight(solid.top, p0) },
      ],
    });
  }
  return pieces;
};

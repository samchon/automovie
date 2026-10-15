import { planeHeight } from "./planeHeight";
import type { PlanPoint } from "./PlanPoint";
import type { RoofPatch } from "./RoofPatch";
import type { WallFace } from "./WallFace";

/**
 * The end face that closes the height difference between two touching pieces of the same composition unit.
 * Along the shared edge where the higher piece's underside is above the lower piece's top, a vertical face
 * owned by the higher piece closes the gap between them (the height-difference rule of junctions).
 */

export const roofStepClosures = (patches: readonly RoofPatch[]): WallFace[] => {
  const faces: WallFace[] = [];
  for (const a of patches) {
    for (const b of patches) {
      if (a === b || a.tier !== b.tier) continue;
      a.polygon.forEach((a0, i) => {
        const a1 = a.polygon[(i + 1) % a.polygon.length]!;
        const length = Math.hypot(a1.x - a0.x, a1.z - a0.z);
        const ux = (a1.x - a0.x) / length;
        const uz = (a1.z - a0.z) / length;
        b.polygon.forEach((b0, j) => {
          const b1 = b.polygon[(j + 1) % b.polygon.length]!;
          const offLine = (p: PlanPoint) => Math.abs((p.x - a0.x) * uz - (p.z - a0.z) * ux);
          if (offLine(b0) > 1e-6 || offLine(b1) > 1e-6) return;
          const t0 = (b0.x - a0.x) * ux + (b0.z - a0.z) * uz;
          const t1 = (b1.x - a0.x) * ux + (b1.z - a0.z) * uz;
          if (t0 < t1) return; // A shared edge must run in opposite directions.
          const from = Math.max(0, t1);
          const to = Math.min(length, t0);
          if (to - from < 1e-4) return;
          const at = (t: number) => ({ x: a0.x + ux * t, z: a0.z + uz * t });
          const gap = (t: number) => planeHeight(a.height, at(t)) - a.thickness - planeHeight(b.height, at(t));
          const cuts = [from, to];
          const g0 = gap(from);
          const g1 = gap(to);
          if (g0 * g1 < 0) cuts.splice(1, 0, from + (to - from) * g0 / (g0 - g1));
          for (let k = 0; k + 1 < cuts.length; ++k) {
            const p = cuts[k]!;
            const q = cuts[k + 1]!;
            if (gap((p + q) / 2) <= 1e-4) continue;
            const corner = (t: number, upper: boolean) => {
              const point = at(t);
              const y = upper ? planeHeight(a.height, point) - a.thickness : planeHeight(b.height, point);
              return { x: point.x, y, z: point.z };
            };
            const raw = [corner(p, false), corner(p, true), corner(q, true), corner(q, false)];
            const kept = raw.filter((c, n) => {
              const next = raw[(n + 1) % raw.length]!;
              return Math.hypot(c.x - next.x, c.y - next.y, c.z - next.z) > 1e-6;
            });
            if (kept.length >= 3) faces.push({ surface: `surface.${a.owner}.edge`, corners: kept });
          }
        });
      });
    }
  }
  return faces;
};

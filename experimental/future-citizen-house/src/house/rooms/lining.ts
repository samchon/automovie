import { Assembly } from "../Assembly";
import { datum } from "../datum";
import { roomById } from "../roomById";
import { cutWall } from "../cutWall";
import { localCut } from "../localCut";
import { uSign } from "../uSign";
import { type Frame } from "../Frame";

/** Room-owned linings consume actual wall cuts, clipped to that room's clear
 * cells; floor and ceiling finishes stay with the storey owner. */
export function lining(a: Assembly, roomId: string): void {
  const r = roomById(roomId), y0 = datum.floors[r.level], y1 = datum.ceilings[r.level];
  for (const { frame: f, cuts } of a.wallRecords) for (const [index, c] of r.cells.entries()) {
    const edges = f.along === "x" ? [c[2], c[3]] : [c[0], c[1]];
    const edge = edges.find((e) => Math.abs(Math.abs(e - f.plane) - f.depth / 2) < 1e-6);
    if (edge === undefined || y0 >= f.top || y1 <= f.floor) continue;
    const lo = Math.max(f.a, f.along === "x" ? c[0] : c[2]), hi = Math.min(f.b, f.along === "x" ? c[1] : c[3]);
    if (hi <= lo) continue;
    const g: Frame = { ...f, a: lo, b: hi, floor: y0, top: y1, spaces: [roomId] };
    const clipped: ReturnType<typeof localCut>[] = [];
    for (const cut of cuts) {
      const u0 = (f.a + f.b) / 2 + (cut.x - (f.b - f.a) / 2) * uSign(f), u1 = u0 + cut.width * uSign(f);
      const l = Math.max(lo, Math.min(u0, u1)), h = Math.min(hi, Math.max(u0, u1));
      const bottom = Math.max(y0, f.floor + cut.y), top = Math.min(y1, f.floor + cut.y + cut.height);
      if (h > l && top > bottom) clipped.push(localCut(g, cut.id, l, h, bottom, top));
    }
    const side = Math.sign(edge - f.plane);
    cutWall(a, g, clipped, r.finish, roomId + "-lining-" + f.id + "-" + index, side * (f.depth / 2 - 0.003), 0.006, false);
  }
}

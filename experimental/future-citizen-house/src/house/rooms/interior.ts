import { Assembly, v, yaw } from "../assembly";
import { roomById, datum } from "../plan";
import { cutWall, localCut, uSign, type Frame } from "../walls";
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
/** A metric furniture assembly. Its caller owns placement and the whole room;
 * child solids are in a rigid local frame, so rotated furniture keeps its joints. */
export class Item {
  constructor(readonly a: Assembly, readonly id: string, readonly room: string, x: number, y: number, z: number, angle = 0) {
    a.environment.elements.push({ id, kind: "fit-out", space: room, parent: "house-root", model: null, transform: { translation: v(x, y, z), rotation: yaw(angle), scale: v(1, 1, 1) } });
  }
  box(name: string, material: string, x: number, y: number, z: number, w: number, h: number, d: number): void {
    const id = this.a.box(this.id + "-" + name, this.room, material, x, y, z, w, h, d);
    this.a.environment.elements.find((e) => e.id === id)!.parent = this.id;
  }
  round(name: string, material: string, x: number, y: number, z: number, w: number, h: number, d: number): void {
    const id = this.a.ellipsoid(this.id + "-" + name, this.room, material, x, y, z, w, h, d);
    this.a.environment.elements.find((e) => e.id === id)!.parent = this.id;
  }
}
export function table(t: Item, width: number, depth: number, height = 0.74): void {
  t.box("top", "oak", 0, height - 0.022, 0, width, 0.044, depth);
  for (const x of [-1, 1]) for (const z of [-1, 1]) t.box("leg-" + x + "-" + z, "oak", x * (width / 2 - 0.09), height / 2 - 0.04, z * (depth / 2 - 0.09), 0.045, height - 0.08, 0.045);
}
export function chair(t: Item, material = "green"): void {
  t.box("seat", material, 0, 0.45, 0, 0.46, 0.09, 0.46);
  t.box("back", material, 0, 0.7, -0.20, 0.46, 0.43, 0.07);
  for (const x of [-1, 1]) for (const z of [-1, 1]) t.box("leg-" + x + "-" + z, "metal", x * 0.18, 0.22, z * 0.18, 0.025, 0.44, 0.025);
}
export function cabinet(t: Item, width: number, height: number, depth: number, open = false, material = "oak"): void {
  t.box("back", material, 0, height / 2, -depth / 2 + 0.012, width, height, 0.024);
  for (const x of [-1, 1]) t.box("side-" + x, material, x * (width / 2 - 0.01), height / 2, 0, 0.02, height, depth);
  const shelves = Math.ceil(height / 0.38);
  for (let i = 0; i <= shelves; i++) t.box("shelf-" + i, material, 0, 0.01 + (height - 0.02) * i / shelves, 0, width, 0.02, depth);
  if (!open) for (const side of [-1, 1]) {
    t.box("door-" + side, material, side * width / 4, height / 2, depth / 2, width / 2 - 0.004, height - 0.004, 0.02);
    t.box("handle-" + side, "metal", side * 0.05, height * 0.55, depth / 2 + 0.024, 0.012, 0.16, 0.02);
  }
}
export function bed(t: Item, width: number, blanket: string): void {
  t.box("base", "oak", 0, 0.18, 0, width + 0.08, 0.20, 2.12);
  t.box("mattress", "linen", 0, 0.37, 0, width, 0.22, 2.02);
  t.box("duvet", blanket, 0, 0.50, 0.28, width + 0.02, 0.08, 1.45);
  t.box("head", "oak", 0, 0.56, -1.08, width + 0.08, 0.90, 0.06);
  const count = width > 1.3 ? 2 : 1;
  for (let i = 0; i < count; i++) t.round("pillow-" + i, "white", count === 1 ? 0 : (i - 0.5) * width / 2, 0.54, -0.7, width / count - 0.15, 0.14, 0.4);
}
export function plant(t: Item, size = 0.5): void {
  t.round("pot", "metal", 0, size * 0.22, 0, size * 0.45, size * 0.44, size * 0.45);
  t.box("stem", "oak", 0, size * 0.65, 0, 0.022, size, 0.022);
  for (let i = 0; i < 9; i++) { const angle = i * 2.4; t.round("leaf-" + i, "leaf", Math.cos(angle) * size * 0.2, size * (0.5 + i * 0.07), Math.sin(angle) * size * 0.2, size * 0.32, size * 0.14, size * 0.28); }
}
export function lights(a: Assembly, room: string, points: readonly (readonly [number, number])[]): void {
  const y = datum.ceilings[roomById(room).level];
  for (const [i, p] of points.entries()) { a.ellipsoid(room + "-light-trim-" + i, room, "metal", p[0], y - 0.015, p[1], 0.12, 0.025, 0.12); a.ellipsoid(room + "-light-" + i, room, "glow", p[0], y - 0.028, p[1], 0.095, 0.012, 0.095); }
}
export function desk(t: Item, width = 1.2): void {
  table(t, width, 0.6);
  t.box("screen", "metal", 0, 1.01, -0.13, 0.5, 0.3, 0.025);
  t.box("screen-stand", "metal", 0, 0.82, -0.13, 0.04, 0.15, 0.04);
  t.box("keyboard", "white", 0, 0.76, 0.13, 0.35, 0.015, 0.12);
}
export function basin(t: Item, width = 0.65): void {
  cabinet(t, width, 0.8, 0.48);
  t.box("rim", "white", 0, 0.825, 0, width + 0.02, 0.05, 0.50);
  t.round("bowl", "tile", 0, 0.853, 0.025, width * 0.65, 0.018, 0.3);
  t.box("tap", "steel", 0.16, 0.98, -0.17, 0.028, 0.26, 0.028);
  t.box("spout", "steel", 0.16, 1.1, -0.11, 0.028, 0.028, 0.13);
  t.box("mirror", "steel", 0, 1.5, -0.246, width, 0.7, 0.018);
}
export function toilet(t: Item): void {
  t.round("pedestal", "white", 0, 0.20, 0, 0.31, 0.40, 0.47);
  t.round("bowl", "white", 0, 0.39, 0.07, 0.41, 0.20, 0.59);
  t.round("seat", "linen", 0, 0.50, 0.08, 0.38, 0.035, 0.50);
  t.box("cistern", "white", 0, 0.62, -0.25, 0.40, 0.36, 0.15);
  t.box("flush", "steel", 0.1, 0.81, -0.25, 0.05, 0.008, 0.035);
}

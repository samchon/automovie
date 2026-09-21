/** Wall frames are local XY, +Z outward. The public engine cuts the actual
 * solid before opening/profile/connector records are published. Linings consume
 * the same cuts, so a room finish cannot seal a door behind its frame. */
import { buildAutoMovieWall, type IAutoMovieWallOpening } from "@automovie/engine";
import { Assembly, rectangle, v, yaw } from "./assembly";
import { datum, portals, roomById, type Portal, type Wall } from "./plan";
export type Frame = { id: string; along: "x" | "z"; normal: 1 | -1; plane: number; a: number; b: number; floor: number; top: number; depth: number; spaces: string[] };
export const rotation = (f: Frame) => yaw(f.along === "x" ? (f.normal === 1 ? 0 : Math.PI) : f.normal * Math.PI / 2);
export const uSign = (f: Frame) => f.along === "x" ? f.normal : -f.normal;
export const position = (f: Frame, u: number, y: number, offset = 0) => f.along === "x" ? v(u, y, f.plane + offset) : v(f.plane + offset, y, u);
export const localU = (f: Frame, u: number) => (u - (f.a + f.b) / 2) * uSign(f);
export const localCut = (f: Frame, id: string, a: number, b: number, sill: number, head: number): IAutoMovieWallOpening => ({ id,
  x: Math.min(localU(f, a), localU(f, b)) + (f.b - f.a) / 2, y: sill - f.floor, width: b - a, height: head - sill });
export function wallFrame(w: Wall): Frame {
  return { id: w.id, along: w.axis === "x" ? "z" : "x", normal: 1, plane: w.plane, a: w.a, b: w.b, floor: datum.floors[w.level], top: datum.ceilings[w.level], depth: datum.wall, spaces: w.adjacent };
}
export function cutWall(a: Assembly, f: Frame, cuts: IAutoMovieWallOpening[], material: string, id = f.id, offset = 0, depth = f.depth, register = true): void {
  const mesh = buildAutoMovieWall({ width: f.b - f.a, height: f.top - f.floor, depth, openings: cuts });
  const element = a.place(id + "-body", "wall", f.spaces[0], a.model(id + "-mesh", material, { type: "mesh", mesh }), position(f, (f.a + f.b) / 2, (f.floor + f.top) / 2, offset), v(1, 1, 1), rotation(f));
  if (register) a.wallRecords.push({ frame: f, cuts });
  if (register) a.environment.boundaries.push({ id: f.id, kind: f.spaces.length === 1 ? "exterior" : "partition", spaces: f.spaces, elements: [element], face: { origin: position(f, (f.a + f.b) / 2, (f.floor + f.top) / 2), rotation: rotation(f), thickness: f.depth, outline: rectangle(-(f.b - f.a) / 2, (f.b - f.a) / 2, -(f.top - f.floor) / 2, (f.top - f.floor) / 2) } });
}
export function bar(a: Assembly, f: Frame, id: string, space: string, material: string, u: number, y: number, width: number, height: number, depth: number, offset = 0): string {
  return a.place(id, "frame-member", space, a.primitive(material), position(f, u, y, offset), v(width, height, depth), rotation(f));
}
export const doorCuts = (f: Frame) => portals.filter((p) => p.wall === f.id).map((p) => localCut(f, p.id, p.center - p.width / 2 - 0.06, p.center + p.width / 2 + 0.06, f.floor, f.floor + p.height + 0.06));
export function doorway(a: Assembly, f: Frame, p: Portal): void {
  const jambs = [-1, 1].map((side) => bar(a, f, p.id + "-jamb-" + side, p.to, "oak", p.center + side * (p.width / 2 + 0.03), f.floor + p.height / 2, 0.06, p.height, f.depth));
  jambs.push(bar(a, f, p.id + "-head", p.to, "oak", p.center, f.floor + p.height + 0.03, p.width + 0.12, 0.06, f.depth));
  const target = roomById(p.to);
  const midpoint = target.cells[0];
  const worldSide = Math.sign((f.along === "x" ? (midpoint[2] + midpoint[3]) / 2 : (midpoint[0] + midpoint[1]) / 2) - f.plane);
  const into = worldSide * f.normal;
  const leaf = p.passage ? null : p.id + "-leaf";
  if (leaf) {
    a.place(leaf, "door-leaf", p.to, a.model(leaf + "-model", "oak", { type: "primitive", shape: { type: "box", width: p.width - 0.006, height: p.height - 0.012, depth: 0.045 } }), position(f, p.center, f.floor + p.height / 2), v(1, 1, 1), rotation(f));
    const handle = a.box(p.id + "-handle", p.to, "metal", p.width / 2 - 0.12, 1.02 - p.height / 2, p.pocket ? 0.024 : 0.046, p.pocket ? 0.06 : 0.14, p.pocket ? 0.10 : 0.025, p.pocket ? 0.005 : 0.055);
    a.environment.elements.find((e) => e.id === handle)!.parent = leaf;
    jambs.push(handle);
  }
  const openValue = p.pocket ? -p.width * uSign(f) : -into * Math.PI / 2;
  a.environment.openings.push({ id: p.id, boundary: f.id, kind: p.passage ? "passage" : "door", fill: leaf,
    profile: { outline: rectangle(localU(f, p.center) - p.width / 2, localU(f, p.center) + p.width / 2, f.floor - (f.floor + f.top) / 2, f.floor + p.height - (f.floor + f.top) / 2) },
    ...(leaf ? { operation: { panels: [{ id: p.id + "-panel", element: leaf, width: p.width, height: p.height, motion: p.pocket ? { kind: "prismatic" as const, axis: v(1, 0, 0), min: Math.min(0, openValue), max: Math.max(0, openValue) } : { kind: "revolute" as const, axis: v(0, 1, 0), pivot: v(-p.width / 2, 0, 0), min: Math.min(0, openValue), max: Math.max(0, openValue) } }], states: [{ id: "closed", panels: [{ panel: p.id + "-panel", value: 0 }] }, { id: "open", panels: [{ panel: p.id + "-panel", value: openValue }] }], state: "open", hardware: jambs.map((element, i) => ({ id: p.id + "-hardware-" + i, kind: "frame-or-handle", element })) } } : {}) });
  const end = position(f, p.center, f.floor, worldSide * (f.depth / 2 + 0.2));
  const start = position(f, p.center, f.floor, -worldSide * (f.depth / 2 + 0.2));
  a.environment.connectors.push({ id: p.id + "-route", kind: "passage", from: p.from, to: p.to, bidirectional: true, route: [start, end], width: p.width, clearHeight: p.height, elements: leaf ? [leaf, ...jambs] : jambs });
}

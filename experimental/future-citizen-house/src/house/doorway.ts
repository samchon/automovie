import { Assembly } from "./Assembly";
import { rectangle } from "./rectangle";
import { yaw } from "./yaw";
import { v } from "./v";
import { roomById } from "./roomById";
import { type Portal } from "./Portal";
import { finishDepth } from "./storeys/finishDepth";
import { Frame } from "./Frame";
import { uSign } from "./uSign";
import { position } from "./position";
import { localU } from "./localU";
import { bar } from "./bar";
import { rotation } from "./rotation";
/** Frame one portal in its host wall: oak jambs, head and a threshold flush with the finished
 * floor, plus a hinged leaf unless the portal is an open passage. The leaf opens into the
 * portal's `to` room. */
export function doorway(a: Assembly, f: Frame, p: Portal): void {
  const jambs = [-1, 1].map((side) => bar(a, f, p.id + "-jamb-" + side, p.to, "oak", p.center + side * (p.width / 2 + 0.03), f.floor + p.height / 2, 0.06, p.height, f.depth));
  jambs.push(bar(a, f, p.id + "-head", p.to, "oak", p.center, f.floor + p.height + 0.03, p.width + 0.12, 0.06, f.depth));
  // Floor finish stops at each room cell, so the host wall's depth under the
  // clear opening gets a threshold flush with the finished floor.
  jambs.push(bar(a, f, p.id + "-threshold", p.to, "oak", p.center, f.floor - finishDepth / 2, p.width, finishDepth, f.depth));
  const target = roomById(p.to);
  const midpoint = target.cells[0];
  const worldSide = Math.sign((f.along === "x" ? (midpoint[2] + midpoint[3]) / 2 : (midpoint[0] + midpoint[1]) / 2) - f.plane);
  const into = worldSide * f.normal;
  const leaf = p.passage ? null : p.id + "-leaf";
  const leafWidth = p.width - 0.006, leafHeight = p.height - 0.012;
  if (leaf) {
    // Native panels occupy [0,width] x [0,height] from the bottom hinge.
    // Offset the centred box within that frame, keeping the 3/6mm clear gaps.
    const model = a.model(leaf + "-model", "oak", { type: "primitive", shape: { type: "box", width: leafWidth, height: leafHeight, depth: 0.045 } });
    a.environment.models.find((candidate) => candidate.id === model)!.parts[0].transform = {
      translation: v(leafWidth / 2, leafHeight / 2, 0), rotation: yaw(0), scale: v(1, 1, 1),
    };
    a.place(leaf, "door-leaf", p.to, model, position(f, p.center - uSign(f) * leafWidth / 2, f.floor + 0.006), v(1, 1, 1), rotation(f));
    const handle = a.box(p.id + "-handle", p.to, "metal", leafWidth - 0.12, 1.014, p.pocket ? 0.024 : 0.046, p.pocket ? 0.06 : 0.14, p.pocket ? 0.10 : 0.025, p.pocket ? 0.005 : 0.055);
    a.environment.elements.find((e) => e.id === handle)!.parent = leaf;
    jambs.push(handle);
  }
  const openValue = p.pocket ? -p.width * uSign(f) : -into * Math.PI / 2;
  a.environment.openings.push({ id: p.id, boundary: f.id, kind: p.passage ? "passage" : "door", fill: leaf,
    profile: { outline: rectangle(localU(f, p.center) - p.width / 2, localU(f, p.center) + p.width / 2, f.floor - (f.floor + f.top) / 2, f.floor + p.height - (f.floor + f.top) / 2) },
    ...(leaf ? { operation: { panels: [{ id: p.id + "-panel", element: leaf, width: leafWidth, height: leafHeight, motion: p.pocket ? { kind: "prismatic" as const, axis: v(1, 0, 0), min: Math.min(0, openValue), max: Math.max(0, openValue) } : { kind: "revolute" as const, axis: v(0, 1, 0), pivot: v(0, 0, 0), min: Math.min(0, openValue), max: Math.max(0, openValue) } }], states: [{ id: "closed", panels: [{ panel: p.id + "-panel", value: 0 }] }, { id: "open", panels: [{ panel: p.id + "-panel", value: openValue }] }], state: "open", hardware: jambs.map((element, i) => ({ id: p.id + "-hardware-" + i, kind: "frame-or-handle", element })) } } : {}) });
  const end = position(f, p.center, f.floor, worldSide * (f.depth / 2 + 0.2));
  const start = position(f, p.center, f.floor, -worldSide * (f.depth / 2 + 0.2));
  a.environment.connectors.push({ id: p.id + "-route", kind: "passage", from: p.from, to: p.to, bidirectional: true, route: [start, end], width: p.width, clearHeight: p.height, elements: leaf ? [leaf, ...jambs] : jambs });
}

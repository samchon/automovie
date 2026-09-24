import { extrudeAutoMovieProfile } from "@automovie/engine";
import { Assembly, v, rectangle } from "../assembly";
import { bar, cutWall, localCut, localU, position, type Frame } from "../walls";
import { subtract } from "../storeys/floors";
import { centresOf, curtainwall, louvre, spandrel } from "./curtainwall";
import type { Rect } from "../plan";
export type Glazing = { id: string; room: string; a: number; b: number; sill: number; head: number; privacy?: "lower" | "all"; breaks?: number[] };
/** Each facade calls this measured panel kernel with its complete elevation.
 * Glass, opaque joints, jambs, gaskets, shades and returns share those cuts. */
export function facade(a: Assembly, f: Frame, windows: Glazing[], extraCuts: ReturnType<typeof localCut>[] = []): void {
  const cuts = [...windows.map((w) => localCut(f, w.id, w.a - 0.04, w.b + 0.04, w.sill - 0.04, w.head + 0.04)), ...extraCuts];
  cutWall(a, f, cuts, "stone", f.id, -f.normal * 0.005, f.depth - 0.022);
  const outer = (f.depth - 0.016) / 2 * f.normal;
  const nx = Math.ceil((f.b - f.a) / 1.25), ny = Math.ceil((f.top - f.floor) / 0.8);
  const panels: Parameters<Assembly["repeat"]>[3] = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    let rects: Rect[] = [[i * (f.b - f.a) / nx, (i + 1) * (f.b - f.a) / nx, j * (f.top - f.floor) / ny, (j + 1) * (f.top - f.floor) / ny]];
    for (const c of cuts) rects = rects.flatMap((r) => subtract(r, [c.x, c.x + c.width, c.y, c.y + c.height]));
    for (const [k, r] of rects.entries()) {
      if (r[1] - r[0] < 0.008 || r[3] - r[2] < 0.008) continue;
      const u = (f.a + f.b) / 2 + ((r[0] + r[1]) / 2 - (f.b - f.a) / 2) * (f.along === "x" ? f.normal : -f.normal);
      // Population transforms are world metrics, not a second facade model.
      panels.push({ id: i + "-" + j + "-" + k, translation: position(f, u, f.floor + (r[2] + r[3]) / 2, outer), scale: f.along === "x" ? v(r[1] - r[0] - 0.004, r[3] - r[2] - 0.004, 0.016) : v(0.016, r[3] - r[2] - 0.004, r[1] - r[0] - 0.004), rotation: { x: 0, y: 0, z: 0, w: 1 } });
    }
  }
  a.repeat(f.id + "-stone-panels", "house", "stone", panels);
  for (const w of windows) glazing(a, f, w);
  spandrel(a, f, windows);
  // The wall is cut at its centre C, but the exterior boundary face stands on
  // the outer plane O = C + (d/2)N so the native exposed normal points outward.
  const boundary = a.environment.boundaries.find((b) => b.id === f.id)!;
  if (boundary.face) boundary.face.origin = position(f, (f.a + f.b) / 2, (f.floor + f.top) / 2, f.depth / 2 * f.normal);
}
function glazing(a: Assembly, f: Frame, w: Glazing): void {
  const first = curtainwall(a, f, w);
  // The drip runs n=-0.110..0.165: its inner end stays 0.004 inside the wall body.
  bar(a, f, w.id + "-drip", w.room, "stone", (w.a + w.b) / 2, w.sill - 0.055, w.b - w.a + 0.12, 0.03, 0.275, 0.0275 * f.normal);
  const centres = centresOf(w);
  for (let i = 0; i < centres.length - 1; i++) {
    const left = centres[i] + 0.02, right = centres[i + 1] - 0.02;
    const u = (left + right) / 2, width = right - left;
    const drop = w.privacy === "all" ? 0 : a.state.privacy === "day" ? 0.045 : a.state.privacy === "night" || w.privacy === "lower" ? 1 : 0.6;
    bar(a, f, w.id + "-shade-box-" + i, w.room, "metal", u, w.head - 0.025, width, 0.075, 0.08, 0.14 * f.normal);
    if (drop > 0) {
      const h = (w.head - w.sill) * drop;
      bar(a, f, w.id + "-shade-" + i, w.room, "shade", u, w.head - h / 2, width - 0.015, h, 0.006, 0.14 * f.normal);
      bar(a, f, w.id + "-shade-hem-" + i, w.room, "metal", u, w.head - h, width, 0.015, 0.018, 0.14 * f.normal);
    }
  }
  louvre(a, f, w);
  a.environment.openings.push({ id: w.id, kind: "window", boundary: f.id, fill: first, profile: { outline: rectangle(Math.min(localU(f, w.a), localU(f, w.b)), Math.max(localU(f, w.a), localU(f, w.b)), w.sill - (f.floor + f.top) / 2, w.head - (f.floor + f.top) / 2) } });
}
/** A diagonal closes the corner without two facade owners occupying the same solid. */
export function corners(a: Assembly, name: string, face: "front" | "rear" | "left" | "right"): void {
  const signs = face === "front" || face === "rear" ? [-1, 1].map((x) => [x, face === "front" ? -1 : 1]) : [-1, 1].map((z) => [face === "left" ? 1 : -1, z]);
  for (const [sx, sz] of signs) {
    const inner = { x: sx * 5.26, y: sz * 5.76 }, outer = { x: sx * 5.5, y: sz * 6 };
    const edge = face === "front" || face === "rear" ? { x: sx * 5.26, y: sz * 6 } : { x: sx * 5.5, y: sz * 5.76 };
    const profile = [inner, edge, outer];
    const mesh = extrudeAutoMovieProfile({ profile, depth: 6.1 });
    const element = a.place(name + "-corner-" + sx + "-" + sz, "corner", "house", a.model(name + "-corner-mesh-" + sx + "-" + sz, "stone", { type: "mesh", mesh }), v(0, 3.05, 0), v(1, 1, 1), { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 });
    const boundary = a.environment.boundaries.find((b) => b.id === name + "-face")!;
    boundary.elements.push(element);
    if (boundary.face) boundary.face.outline = rectangle(face === "front" || face === "rear" ? -5.5 : -6, face === "front" || face === "rear" ? 5.5 : 6, -3.05, 3.05);
  }
}

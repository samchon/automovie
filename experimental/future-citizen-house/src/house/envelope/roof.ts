/** Whole roof owner of the v-073 canopy, waterproof fall and drainage.
 * World XZ projections stay exact. Touching members remain separate solids;
 * measured loops replace the old repeated, full-bottom cassette boxes. */
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";
import { Assembly, rectangle, v } from "../assembly";
import { datum } from "../plan";
import { circle, heightRegion, putMesh, tubeMesh, type Height, type Point } from "../metric-solid";
export const canopy = { minX: -5.8, maxX: 5.8, minZ: -6.7, maxZ: 6.3, girders: [-5.4, 0, 5.4], supports: [-4.8, 0, 4.8], nx: Math.ceil(11.6 / 1.2), nz: Math.ceil(13 / 1.9) };
export const B = (z: number) => 6.70 + 0.01 * (canopy.maxZ - z);
export const J = (z: number) => B(z) + 0.12;
export const T = (z: number) => J(z) + 0.03;
export const P = (z: number) => B(z) + 0.161;
export const R = (x: number) => datum.roof + 0.03 + 0.01 * (x - datum.minX);
export const G = (z: number) => 6.290 + 0.005 * Math.abs(z);
type Solid = (id: string, plan: Point[], low: Height, high: Height, material?: string, holes?: Point[][], blind?: Height) => string;
type Flat = (id: string, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number) => string;
export function roof(a: Assembly): void {
  const solid: Solid = (id, plan, low, high, material = "metal", holes = [], blind) => putMesh(a, id, "house", material, heightRegion(plan, low, high, holes, blind), "roof-member");
  const flat: Flat = (id, x0, x1, z0, z1, y0, y1) => solid(id, rectangle(x0, x1, z0, z1), () => y0, () => y1);
  const slab = a.box("roof-slab", "house", "stone", 0, 6.254, 0, 11, 0.292, 12);
  const weather = solid("roof-weather", rectangle(-5.5, 5.5, -6, 6), () => datum.roof, x => R(x), "stone");
  for (const side of [-1, 1]) {
    const z = side * 6;
    solid("roof-fascia-z-" + side, rectangle(-5.5, 5.5, z - 0.001, z + 0.001), x => R(x) - 0.08, x => R(x) + 0.04);
    solid("roof-drip-z-" + side, rectangle(-5.5, 5.5, side < 0 ? -6.10 : 6, side < 0 ? -6 : 6.10), x => R(x) - 0.002, x => R(x));
  }
  flat("roof-fascia-left", 5.5, 5.502, -6.001, 6.001, R(5.5) - 0.08, R(5.5) + 0.04);
  flat("roof-drip-left", 5.5, 5.6, -6, 6, R(5.5) - 0.002, R(5.5));
  flat("roof-drip-right", -5.6, -5.5, -6, 6, R(-5.5) - 0.002, R(-5.5));
  const px = (canopy.maxX - canopy.minX) / canopy.nx, pz = (canopy.maxZ - canopy.minZ) / canopy.nz;
  const w = px - 0.04, l = pz - 0.04;
  const j: Height = (_, z) => 0.12 - 0.01 * z, t: Height = (_, z) => 0.15 - 0.01 * z;
  const parts: IAutoMovieModelPart[] = [];
  const part = (id: string, material: string, outer: Point[], low: Height, high: Height, holes: Point[][] = []) => parts.push({ id, name: id, material, attachedBone: null, transform: null, geometry: { type: "mesh", mesh: heightRegion(outer, low, high, holes) } });
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? -w / 2 : w / 2 - 0.03, bx = side * (px / 2 - 0.030);
    const bz = [-l / 2 + 0.070, l / 2 - 0.070];
    part("frame-x-" + side, "metal", rectangle(x0, x0 + 0.03, -l / 2, l / 2), j, t, bz.map(z => circle(bx, z, 0.00325, 16)));
    const z0 = side < 0 ? -l / 2 : l / 2 - 0.03;
    part("frame-z-" + side, "metal", rectangle(-w / 2 + 0.03, w / 2 - 0.03, z0, z0 + 0.03), j, t);
    for (const z of bz) {
      part("bolt-" + side + "-" + z, "steel", circle(bx, z, 0.003, 16), (x, z) => j(x, z) - 0.010, t);
      part("head-" + side + "-" + z, "steel", circle(bx, z, 0.006, 12), t, (x, z) => t(x, z) + 0.008);
    }
    const cx = side < 0 ? -px / 2 + 0.050 : px / 2 - 0.065;
    for (const z of [-l / 4, l / 4]) part("clip-" + side + "-" + z, "metal", rectangle(cx, cx + 0.015, z - 0.010, z + 0.010), (x, z) => j(x, z) + 0.005, (x, z) => j(x, z) + 0.015);
    part("panel-wire-" + side, "metal", rectangle(cx + 0.005, cx + 0.010, -l / 4, l / 4), (x, z) => j(x, z) + 0.007, (x, z) => j(x, z) + 0.012);
  }
  part("pv", "pv", rectangle(-(w - 0.04) / 2, (w - 0.04) / 2, -(l - 0.04) / 2, (l - 0.04) / 2), (_, z) => 0.149 - 0.01 * z, (_, z) => 0.161 - 0.01 * z);
  a.environment.models.push({ id: "canopy-cassette", name: "Drilled open cassette", origin: "generated", skeleton: null, asset: null, body: null, materials: [a.material("metal"), a.material("steel"), a.material("pv")], parts });
  const cassetteIds: string[] = [], bolts: { x: number; z: number }[] = [];
  for (let i = 0; i < canopy.nx; i++) for (let k = 0; k < canopy.nz; k++) {
    const x = canopy.minX + (i + 0.5) * px, z = canopy.minZ + (k + 0.5) * pz;
    cassetteIds.push(a.place("canopy-cassette-" + i + "-" + k, "pv-cassette", "house", "canopy-cassette", v(x, B(z), z)));
    for (const side of [-1, 1]) for (const end of [-1, 1]) bolts.push({ x: x + side * (px / 2 - 0.03), z: z + end * (l / 2 - 0.07) });
  }
  const structure: string[] = [];
  for (const zg of canopy.girders) {
    structure.push(solid("canopy-girder-" + zg, rectangle(-5.8, 5.8, zg - 0.04, zg + 0.04), (_, z) => B(z), (_, z) => J(z)));
    for (const x of canopy.supports) {
      const id = "canopy-support-" + x + "-" + zg;
      structure.push(solid(id + "-pedestal", rectangle(x - 0.12, x + 0.12, zg - 0.12, zg + 0.12), x => R(x), () => R(x) + 0.03, "stone"));
      solid(id + "-flashing", rectangle(x - 0.15, x + 0.15, zg - 0.15, zg + 0.15), x => R(x), x => R(x) + 0.002, "metal", [rectangle(x - 0.12, x + 0.12, zg - 0.12, zg + 0.12)]);
      flat(id + "-base", x - 0.08, x + 0.08, zg - 0.08, zg + 0.08, R(x) + 0.03, R(x) + 0.042);
      structure.push(flat(id + "-post", x - 0.04, x + 0.04, zg - 0.04, zg + 0.04, R(x) + 0.042, B(zg) - 0.014));
      structure.push(solid(id + "-cap", rectangle(x - 0.06, x + 0.06, zg - 0.06, zg + 0.06), () => B(zg) - 0.014, (_, z) => B(z)));
      // Embedded anchors show the slab connection; no Boolean cut is claimed.
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.rod(id + "-anchor-" + sx + "-" + sz, "house", "steel", v(x + sx * 0.06, datum.roof - 0.02, zg + sz * 0.06), v(x + sx * 0.06, R(x) + 0.042, zg + sz * 0.06), 0.003);
    }
  }
  const ends = [canopy.minZ, ...canopy.girders.flatMap(z => [z - 0.046, z + 0.046]), canopy.maxZ];
  for (let i = 0; i <= canopy.nx; i++) {
    const x = i === 0 ? canopy.minX + 0.04 : i === canopy.nx ? canopy.maxX - 0.04 : canopy.minX + i * px;
    for (let k = 0; k < ends.length; k += 2) {
      const z0 = ends[k], z1 = ends[k + 1];
      const holes = bolts.filter(p => Math.abs(p.x - x) < 0.04 && p.z > z0 && p.z < z1).map(p => circle(p.x, p.z, 0.00325, 16));
      structure.push(solid("canopy-rail-" + i + "-" + k / 2, rectangle(x - 0.04, x + 0.04, z0, z1), (_, z) => B(z), (_, z) => J(z), "metal", holes, (_, z) => J(z) - 0.010));
    }
    for (const zg of canopy.girders) for (const side of [-1, 1]) {
      const start = side < 0 ? zg - 0.046 : zg + 0.04;
      structure.push(solid("canopy-endplate-" + i + "-" + zg + "-" + side, rectangle(x - 0.04, x + 0.04, start, start + 0.006), (_, z) => B(z), (_, z) => J(z)));
    }
  }
  drainage(a, solid, flat);
  const up = { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
  const tiltDeg = Math.atan(0.01) * 180 / Math.PI;
  const rotation = Quaternion.multiply(Quaternion.fromAxisAngle(v(0, 0, 1), tiltDeg), up);
  a.environment.boundaries.push({ id: "roof-face", kind: "roof", spaces: ["house"], elements: [slab, weather], face: { origin: v(0, R(0), 0), rotation, outline: rectangle(-5.5 * Math.hypot(1, 0.01), 5.5 * Math.hypot(1, 0.01), -6, 6), thickness: 0.292 } });
  for (const [id, height, angle, elements] of [["canopy-top", P(-0.2), -90 + tiltDeg, cassetteIds], ["canopy-soffit", B(-0.2), 90 + tiltDeg, structure]] as const)
    a.environment.boundaries.push({ id, kind: "roof", spaces: ["house"], elements: [...elements], face: { origin: v(0, height, -0.2), rotation: Quaternion.fromAxisAngle(v(1, 0, 0), angle), outline: rectangle(-5.8, 5.8, -6.5 * Math.hypot(1, 0.01), 6.5 * Math.hypot(1, 0.01)), thickness: 0.161 } });
}
/** Both gutter halves fall to the central open outlet. */
function drainage(a: Assembly, solid: Solid, flat: Flat): void {
  for (const side of [-1, 1]) {
    const notch = Array.from({ length: 17 }, (_, i) => ({ x: -5.68 + 0.05 * Math.cos(Math.PI - i * Math.PI / 16), y: side * 0.05 * Math.sin(Math.PI - i * Math.PI / 16) }));
    const plan = [{ x: -5.78, y: 0 }, ...notch, { x: -5.58, y: 0 }, { x: -5.58, y: side * 6.10 }, { x: -5.78, y: side * 6.10 }];
    solid("gutter-floor-" + side, plan, (_, z) => G(z) - 0.002, (_, z) => G(z));
    const z0 = Math.min(0, side * 6.10), z1 = Math.max(0, side * 6.10);
    solid("gutter-inner-" + side, rectangle(-5.582, -5.58, z0, z1), (_, z) => G(z), () => 6.420);
    solid("gutter-outer-" + side, rectangle(-5.78, -5.778, side < 0 ? -6.10 : 0.10, side < 0 ? -0.10 : 6.10), (_, z) => G(z), () => 6.450);
    solid("gutter-notch-bottom-" + side, rectangle(-5.78, -5.778, side < 0 ? -0.10 : 0, side < 0 ? 0 : 0.10), (_, z) => G(z), () => 6.380);
    flat("gutter-end-" + side, -5.778, -5.582, side < 0 ? -6.10 : 6.098, side < 0 ? -6.098 : 6.10, G(6.10), 6.450);
  }
  flat("gutter-notch-header", -5.78, -5.778, -0.10, 0.10, 6.430, 6.450);
  flat("overflow-spout-floor", -5.90, -5.78, -0.10, 0.10, 6.378, 6.380);
  for (const z of [-0.10, 0.098]) flat("overflow-spout-side-" + z, -5.90, -5.78, z, z + 0.002, 6.380, 6.430);
  // The split annular rim follows G exactly, including its low-point crease.
  for (const side of [-1, 1]) {
    const arc = (radius: number) => Array.from({ length: 17 }, (_, i) => ({ x: -5.68 + radius * Math.cos(i * Math.PI / 16), y: side * radius * Math.sin(i * Math.PI / 16) }));
    solid("gutter-outlet-rim-" + side, [...arc(0.055), ...arc(0.05).reverse()], () => 6.280, (_, z) => G(z) - 0.002);
  }
  putMesh(a, "gutter-outlet-neck", "house", "metal", tubeMesh(-5.68, 0, 6.10, 6.280, 0.055, 0.05), "drainage");
  for (const [i, xs] of [[-5.778, -5.750], [-5.610, -5.582]].entries()) flat("gutter-grate-ledge-" + i, xs[0], xs[1], -0.14, 0.14, 6.408, 6.410);
  const holes = Array.from({ length: 7 }, (_, i) => rectangle(-0.067 + i * 0.020, -0.053 + i * 0.020, -0.08, 0.08));
  const model = a.model("gutter-grate-model", "steel", { type: "mesh", mesh: heightRegion(rectangle(-0.08, 0.08, -0.10, 0.10), () => 0, () => 0.020, holes) });
  a.place("gutter-grate", "removable-grate", "house", model, v(-5.68, 6.410, 0));
}

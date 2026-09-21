import { extrudeAutoMovieRegion, transformAutoMovieMesh, Quaternion } from "@automovie/engine";
import { Assembly, rectangle, v, yaw } from "../assembly";
import { circle, heightRegion, putMesh } from "../metric-solid";
import { subtract } from "../storeys/floors";
import type { Rect } from "../plan";
export function garden(a: Assembly): void {
  const r = "citizen-site";
  const cuts: Rect[] = [[-6.10, -5.55, -0.30, 0.30], [-7.8, -5.8, -7.3, 7.3], [5.8, 7.8, -7.3, 7.3], [-4.3, -2.8, -8.5, -6.3], [-7.8, 7.8, -8.5, -7.7]];
  let ground: Rect[] = [[-7.8, 7.8, -8.5, 8.5]];
  for (const cut of cuts) ground = ground.flatMap(piece => subtract(piece, cut));
  for (const [i, p] of ground.entries()) a.box("site-ground-" + i, r, "soil", (p[0] + p[1]) / 2, -0.58, (p[2] + p[3]) / 2, p[1] - p[0], 0.26, p[3] - p[2]);
  // Flush access bands are cut around the catch pit, never painted over it.
  for (const side of [-1, 1]) {
    const strips = subtract(side < 0 ? [-7.8, -5.8, -7.3, 7.3] : [5.8, 7.8, -7.3, 7.3], [-6.10, -5.55, -0.30, 0.30]);
    for (const [i, s] of strips.entries()) putMesh(a, "service-band-" + side + "-" + i, r, "green", heightRegion(rectangle(...s), () => -0.46, () => -0.45));
  }
  a.box("cassette-staging-pad", r, "stone", -3.55, -0.46, -7.4, 1.5, 0.02, 2.2);
  catchPit(a);
  for (const [i, p] of subtract([-7.8, 7.8, -8.5, -7.7], cuts[3]).entries()) a.box("site-sidewalk-" + i, r, "stone", (p[0] + p[1]) / 2, -0.5, -8.1, p[1] - p[0], 0.10, 0.8);
  a.box("site-curb", r, "stone", 0, -0.49, -8.49, 15.6, 0.12, 0.1);
  for (let i = 0; i < 2; i++) a.box("approach-tread-" + i, r, "stone", 2.1, -0.45 + (i + 1) * 0.15 - 0.075, -7.28 + i * 0.32, 1.6, 0.15, 0.32);
  a.box("approach-landing", r, "stone", 2.1, -0.15, -6.4, 1.6, 0.3, 0.8);
  a.box("rear-paving", r, "stone", 0, -0.12, 6.65, 11.6, 0.16, 1.3);
  a.environment.surfaces.push({ space: r, surface: { id: "site-walk", kind: "floor", polygon: [v(-7.8, 0, -8.5), v(7.8, 0, -8.5), v(7.8, 0, 8.5), v(-7.8, 0, 8.5)], height: { kind: "constant", value: -0.45 } } });
  a.environment.surfaces.push({ space: r, surface: { id: "entry-approach-landing", kind: "floor", polygon: [v(1.3, 0, -6.8), v(2.9, 0, -6.8), v(2.9, 0, -6), v(1.3, 0, -6)], height: { kind: "constant", value: 0 } } });
  for (let side = -1; side <= 1; side += 2) for (let i = 0; i < 24; i++) {
    const n = (side < 0 ? 0 : 24) + i;
    const z = 7.44 + Math.floor(n / 16) * 0.26, x = -5.1 + n % 16 * 10.2 / 15;
    for (let k = 0; k < 5; k++) a.ellipsoid("hedge-" + side + "-" + i + "-" + k, r, "leaf", x + Math.sin(k * 2.4) * 0.20, -0.11 + k % 2 * 0.10, z + Math.cos(k * 2.4) * 0.2, 0.62, 0.70, 0.6);
  }
  for (const [i, pos] of [[0, 0], [0, 0], [0, 0], [0, 0]].entries()) {
    const start = a.environment.elements.length;
    const [x, z] = pos, top = 3.3 + i * 0.35;
    a.rod("tree-" + i + "-trunk", r, "oak", v(x, -0.45, z), v(x + 0.08, top, z), 0.06);
    for (let j = 0; j < 11; j++) {
      const angle = j * 2.399, y = top - 1.8 + j * 0.16, radius = 0.55 + 0.35 * Math.sin(j * 0.8);
      const end = v(x + Math.cos(angle) * radius, y + 0.5, z + Math.sin(angle) * radius);
      a.rod("tree-" + i + "-branch-" + j, r, "oak", v(x, y - 0.3, z), end, 0.017);
      for (let k = 0; k < 5; k++) a.ellipsoid("tree-" + i + "-leaves-" + j + "-" + k, r, "leaf", end.x + Math.cos(k * 2.4) * 0.3, end.y + k % 3 * 0.13, end.z + Math.sin(k * 2.4) * 0.3, 0.6, 0.3, 0.6);
    }
    // Preserve the tree's geometry, rotating its footprint into the rear strip.
    const rotation = yaw(121 * Math.PI / 180);
    for (const e of a.environment.elements.slice(start)) {
      const p = Quaternion.rotateVector(rotation, e.transform.translation);
      e.transform.translation = v(p.x - 4.2 + i * 2.8, p.y, p.z + 7.4);
      e.transform.rotation = Quaternion.multiply(rotation, e.transform.rotation);
    }
  }
  for (let i = 0; i < 29; i++) { const x = -5.5 + i * 0.39; if (x > 1.05 && x < 3.1) continue; const z = x > -4.49 && x < -2.61 ? 7.6 : -6.6; for (let j = 0; j < 7; j++) a.rod("front-grass-" + i + "-" + j, r, "leaf", v(x, -0.45, z), v(x + Math.cos(j * 2.4) * 0.17, -0.15 + j % 3 * 0.06, z + Math.sin(j * 2.4) * 0.17), 0.014); }
}

/** Open catch basin and removable grate. The lateral outlet is a true circular
 * opening, with no underground network or hydraulic performance implied. */
function catchPit(a: Assembly): void {
  const r = "citizen-site";
  a.box("catch-bottom", r, "metal", -5.825, -0.851, 0, 0.55, 0.002, 0.60);
  for (const z of [-0.299, 0.299]) a.box("catch-side-z-" + z, r, "metal", -5.825, -0.66, z, 0.546, 0.38, 0.002);
  a.box("catch-side-inner", r, "metal", -5.551, -0.66, 0, 0.002, 0.38, 0.60);
  const wall = extrudeAutoMovieRegion({ outer: rectangle(-0.30, 0.30, -0.852, -0.47), holes: [circle(0, -0.80, 0.05)], depth: 0.002 });
  putMesh(a, "catch-outlet-wall", r, "metal", transformAutoMovieMesh(wall, { rotation: yaw(-Math.PI / 2), translation: v(-6.099, 0, 0) }));
  const holes = Array.from({ length: 12 }, (_, i) => rectangle(-0.251 + i * 0.042, -0.223 + i * 0.042, -0.278, 0.278));
  const model = a.model("catch-grate-model", "steel", { type: "mesh", mesh: heightRegion(rectangle(-0.275, 0.275, -0.30, 0.30), () => -0.02, () => 0, holes) });
  a.place("catch-grate", "removable-grate", r, model, v(-5.825, -0.45, 0));
}

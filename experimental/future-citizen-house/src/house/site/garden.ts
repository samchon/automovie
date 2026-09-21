import { Assembly, v } from "../assembly";
export function garden(a: Assembly): void {
  const r = "citizen-site";
  a.box("site-ground", r, "soil", 0, -0.58, 0, 15.6, 0.26, 17);
  a.box("site-sidewalk", r, "stone", 0, -0.5, -8.1, 15.6, 0.10, 0.8);
  a.box("site-curb", r, "stone", 0, -0.49, -8.49, 15.6, 0.12, 0.1);
  for (let i = 0; i < 2; i++) a.box("approach-tread-" + i, r, "stone", 2.1, -0.45 + (i + 1) * 0.15 - 0.075, -7.28 + i * 0.32, 1.6, 0.15, 0.32);
  a.box("approach-landing", r, "stone", 2.1, -0.15, -6.4, 1.6, 0.3, 0.8);
  a.box("rear-paving", r, "stone", 0, -0.12, 6.65, 11.8, 0.16, 1.3);
  a.environment.surfaces.push({ space: r, surface: { id: "site-walk", kind: "floor", polygon: [v(-7.8, 0, -8.5), v(7.8, 0, -8.5), v(7.8, 0, 8.5), v(-7.8, 0, 8.5)], height: { kind: "constant", value: -0.45 } } });
  a.environment.surfaces.push({ space: r, surface: { id: "entry-approach-landing", kind: "floor", polygon: [v(1.3, 0, -6.8), v(2.9, 0, -6.8), v(2.9, 0, -6), v(1.3, 0, -6)], height: { kind: "constant", value: 0 } } });
  for (let side = -1; side <= 1; side += 2) for (let i = 0; i < 24; i++) {
    const z = -6.7 + i * 0.61, x = side * (6.5 + 0.14 * Math.sin(i * 2.4));
    for (let k = 0; k < 5; k++) a.ellipsoid("hedge-" + side + "-" + i + "-" + k, r, "leaf", x + Math.sin(k * 2.4) * 0.20, -0.11 + k % 2 * 0.10, z + Math.cos(k * 2.4) * 0.2, 0.62, 0.70, 0.6);
  }
  for (const [i, pos] of [[-6.7, -6.4], [6.7, -5.6], [-6.7, 6.8], [6.7, 7.1]].entries()) {
    const [x, z] = pos, top = 3.3 + i * 0.35;
    a.rod("tree-" + i + "-trunk", r, "oak", v(x, -0.45, z), v(x + 0.08, top, z), 0.06);
    for (let j = 0; j < 11; j++) {
      const angle = j * 2.399, y = top - 1.8 + j * 0.16, radius = 0.55 + 0.35 * Math.sin(j * 0.8);
      const end = v(x + Math.cos(angle) * radius, y + 0.5, z + Math.sin(angle) * radius);
      a.rod("tree-" + i + "-branch-" + j, r, "oak", v(x, y - 0.3, z), end, 0.017);
      for (let k = 0; k < 5; k++) a.ellipsoid("tree-" + i + "-leaves-" + j + "-" + k, r, "leaf", end.x + Math.cos(k * 2.4) * 0.3, end.y + k % 3 * 0.13, end.z + Math.sin(k * 2.4) * 0.3, 0.6, 0.3, 0.6);
    }
  }
  for (let i = 0; i < 29; i++) { const x = -5.5 + i * 0.39; if (x > 1.05 && x < 3.1) continue; for (let j = 0; j < 7; j++) a.rod("front-grass-" + i + "-" + j, r, "leaf", v(x, -0.45, -6.6), v(x + Math.cos(j * 2.4) * 0.17, -0.15 + j % 3 * 0.06, -6.6 + Math.sin(j * 2.4) * 0.17), 0.014); }
}

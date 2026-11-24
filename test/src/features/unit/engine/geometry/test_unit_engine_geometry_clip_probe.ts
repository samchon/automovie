import { AutoMovieSolidClip, realizeAutoMovieConstruction } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { ConstructionShapes } from "../../../internal/construction/ConstructionShapes";

export function test_unit_engine_geometry_clip_probe(): void {
  const R = 0.03, r = 0.015, w = 0.006;
  const host = ConstructionShapes.cylinder("beam", { origin: { x: -0.1, y: 0, z: 0 }, u: { x: 0, y: 0, z: 1 }, v: { x: 0, y: 1, z: 0 } }, R, 0.2);
  const part = ConstructionShapes.cylinder("post", { origin: { x: 0, y: 0, z: 0 }, u: { x: 0, y: 1, z: 0 }, v: { x: 1, y: 0, z: 0 } }, r, 0.08);
  const tree = ConstructionShapes.join("merge", "blend.post", host, part,
    { partFace: "post", hostFace: "beam", part: [R + 0.001, Math.PI / 2], host: [0.1 + r, 0.01] },
    { part: { type: "chord", value: w }, host: { type: "chord", value: w } });
  const real = realizeAutoMovieConstruction({ name: "made", root: tree }, { chord: 1e-2 });
  console.log("PROBE keys", Object.keys(real), Object.keys(real.joins[0]!), Object.keys(real.body));
  const j = real.joins[0]!;
  console.log("PROBE blend", Object.keys(j.blend), Object.keys(j.blend.host), Object.keys(j.join));
  const rail = AutoMovieSolidClip.rail(real.body, j.join, j.blend, [0], 12);
  console.log("PROBE rail", typeof rail === "string" ? rail : rail.length, typeof rail === "string" ? "" : JSON.stringify(rail.slice(0, 2).map((p) => ({ f: p.faces, phase: p.phase, chart: [...p.chart.entries()] }))));
  TestValidator.equals("x", 1, 1);
}
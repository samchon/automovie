import { type AutoMovieConstructionRealization, realizeAutoMovieConstruction } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieConstructionOutline, IAutoMovieConstructionView } from "@automovie/interface";

import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A part on a level axis merged onto its host keeps its skin facing out, as
 * the same part on a straight axis does: every triangle of the realized skin
 * that the part's face owns has its normal (counter-clockwise from outside)
 * pointing away from the part's centre.
 *
 * Scenarios:
 * 1. A sphere of radius 0.02 m centred 0.05 m along +x, on a straight axis (u = +x, v = +z, stations along +y), merged onto a sphere of radius 0.05 m at the origin: at least 95 % of the part's triangles face away from its centre.
 * 2. The same part on a level axis (the world's level planes at the station's height, its origin's course 0.05 m in x and 0 in z): the same share faces out. The head's nose, the only level-axis part of the head, rendered as a pit (log-head.md, nose1/merge-three.png) while every straight-axis part rendered right.
 * 3. Red: the straight part's triangles read with their winding turned, which face inward, fail the same share.
 *
 * @evidence contracts/testing.md#behavioral-verification Realizes each merge with `realizeAutoMovieConstruction` and reads the one skin it draws (`IRealization.mesh`): each triangle's owner (the face that evaluates its first vertex) and its normal from its corners in index order. It catches a face whose triangles are wound against its outward side, which a renderer culls and shows as a hole; any skin wound outward passes.
 * @evidence contracts/testing.md#independent-expectations A sphere's outward normal at a point is the direction from its centre; a triangle on it, wound counter-clockwise from outside, has a normal within a few degrees of that direction, so its dot with the centre's direction is positive. The 95 % share leaves room for the triangles along the trimmed seam and the blend's rails.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the straight part, the reference. The case under test: the level part. Negative: the straight part's triangles turned.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_level_winding`; it realizes made trees in process and starts no host, browser or GPU.
 */
export function test_construction_level_winding(): void {
  const failures: string[] = [];
  const R: number = 0.05;
  const r: number = 0.02;
  const centre: V3 = [0.05, 0, 0];
  const host: AutoMovieConstructionNode = ConstructionShapes.ellipsoid("host", { origin: { x: 0, y: 0, z: 0 }, u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 0, z: 1 } }, R, R, R);
  const straight: IAutoMovieConstructionView = ConstructionShapes.ellipsoid("part", { origin: { x: centre[0], y: 0, z: 0 }, u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 0, z: 1 } }, r, r, r);
  const course: (value: number) => IAutoMovieConstructionOutline = (value: number): IAutoMovieConstructionOutline => ({
    knots: straight.stations.map((s: number, k: number): { site: string; station: number; value: number } => ({ site: `part.${k}`, station: s, value })),
  });
  const level: IAutoMovieConstructionView = { ...straight, axis: { type: "level", origin: { x: course(centre[0]), z: course(0) } } };

  const outward: (part: IAutoMovieConstructionView, turned: boolean) => number = (part: IAutoMovieConstructionView, turned: boolean): number => {
    const real: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction(
      {
        name: "made",
        root: {
          type: "join",
          kind: "merge",
          name: "blend.part",
          host,
          part,
          seed: { type: "search", partFace: "part", hostFace: "host", phase: Math.PI, from: 0.5, to: 1 },
          parameter: { type: "phase" },
          partWidth: { type: "chord", value: 0.003 },
          hostWidth: { type: "chord", value: 0.003 },
          continuity: "G2",
          count: 48,
          rows: 4,
          tolerance: 1e-12,
          grazing: 0.05,
        },
      },
      { chord: 1e-4 },
    );
    const m: AutoMovieConstructionRealization.IMesh = real.mesh;
    const owner: number = m.owners.indexOf("part");
    if (owner < 0) {
      failures.push(`the part owns no face of the skin: ${real.diagnostics.map((d: { node: string; contract: string }): string => `${d.node} ${d.contract}`).join("; ")}`);
      return 0;
    }
    const at: (v: number) => V3 = (v: number): V3 => [m.positions[3 * v]!, m.positions[3 * v + 1]!, m.positions[3 * v + 2]!];
    let out: number = 0;
    let all: number = 0;
    for (let t: number = 0; t < m.indices.length; t += 3) {
      if (m.coordinates[3 * m.indices[t]!] !== owner) continue;
      const a: V3 = at(m.indices[t]!);
      const b: V3 = at(m.indices[t + (turned ? 2 : 1)]!);
      const c: V3 = at(m.indices[t + (turned ? 1 : 2)]!);
      const e: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const f: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n: V3 = [e[1] * f[2] - e[2] * f[1], e[2] * f[0] - e[0] * f[2], e[0] * f[1] - e[1] * f[0]];
      const g: V3 = [(a[0] + b[0] + c[0]) / 3 - centre[0], (a[1] + b[1] + c[1]) / 3 - centre[1], (a[2] + b[2] + c[2]) / 3 - centre[2]];
      all++;
      if (n[0] * g[0] + n[1] * g[1] + n[2] * g[2] > 0) out++;
    }
    return all === 0 ? 0 : out / all;
  };

  const SHARE: number = 0.95;
  const s: number = outward(straight, false);
  if (!(s >= SHARE)) failures.push(`straight part: ${(s * 100).toFixed(1)} % of its triangles face out`);
  const l: number = outward(level, false);
  if (!(l >= SHARE)) failures.push(`level part: ${(l * 100).toFixed(1)} % of its triangles face out (straight ${(s * 100).toFixed(1)} %)`);
  const red: number = outward(straight, true);
  if (red >= SHARE) failures.push(`red: the straight part's turned triangles still read ${(red * 100).toFixed(1)} % outward`);
  if (failures.length) throw new Error(`construction_level_winding:\n${failures.join("\n")}`);
}

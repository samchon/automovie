import { AutoMovieSolidBody, AutoMovieSolidRailSolve } from "@automovie/engine";
import type {
  IAutoMovieSolidAtlas,
  IAutoMovieSolidBody,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

type Vec3 = [number, number, number];

/**
 * `AutoMovieSolidRailSolve.atlas` settles a host rail whose root lies between a
 * face's kept edge chords and the exact curve a neighbouring face ends on: a
 * cycle sampled from an exact curve reads that curve between its vertices.
 *
 * Fixture: a radius-10 cylinder sheet (u along y) trimmed at its start by the
 * curve u = g(v) = 5 cos v, and a band ending on that curve, both sampled at
 * 24 phases. At v* = pi + h / 2 (h = 2 pi / 24) the chord of g stands above the
 * curve; the root sits 0.7 of the way from the curve to the chord; the rail is
 * 0.25 wide along +y.
 *
 * Scenarios:
 *
 * 1. Premise: curve < root < chord at v*.
 * 2. Started on the sheet at u = root + 0.1 and root + 0.3, and on the band at u
 *    -0.1 and -0.05, the rail settles at v* within 1e-9 on the sheet at u =
 *    root or on the band at u = root - 0.5 - g(v*).
 */
export function test_unit_engine_geometry_solid_rail_sagitta(): void {
  const R: number = 10;
  const g = (v: number): number => 5 * Math.cos(v);
  const sheet: IAutoMovieSolidSurface = {
    name: "sheet",
    orientation: 1,
    domain: [-20, 20],
    period: 2 * Math.PI,
    jet: (u: number, v: number) => ({
      p: [R * Math.cos(v), u, R * Math.sin(v)],
      u: [0, 1, 0],
      v: [-R * Math.sin(v), 0, R * Math.cos(v)],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [-R * Math.cos(v), 0, -R * Math.sin(v)],
    }),
  };
  const band: IAutoMovieSolidSurface = {
    name: "band",
    orientation: 1,
    domain: [-20, 0],
    period: 2 * Math.PI,
    jet: (u: number, v: number) => ({
      p: [R * Math.cos(v), g(v) + u, R * Math.sin(v)],
      u: [0, 1, 0],
      v: [-R * Math.sin(v), -5 * Math.sin(v), R * Math.cos(v)],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [-R * Math.cos(v), -5 * Math.cos(v), -R * Math.sin(v)],
    }),
  };
  const n: number = 24;
  const phases: number[] = Array.from({ length: n }, (_: unknown, k: number): number => (2 * Math.PI * k) / n);
  const next = (k: number): number => (k + 1 < n ? phases[k + 1]! : 2 * Math.PI);
  const body: IAutoMovieSolidBody.IBody = AutoMovieSolidBody.create("sagitta", [
    { surface: sheet, stations: [-20, 20], phases },
    { surface: band, stations: [-20, 0], phases },
  ]);
  body.faces[0]!.cycles.push({
    kind: "start",
    vertices: phases.map((_: number, k: number): number => k),
    chart: phases.map((v: number): [number, number] => [g(v), v]),
    neighbours: phases.map((v: number, k: number) => ({
      face: 1,
      from: [0, v] satisfies [number, number],
      to: [0, next(k)] satisfies [number, number],
    })),
    along: g,
  });
  body.faces[1]!.cycles.push({
    kind: "end",
    vertices: phases.map((_: number, k: number): number => k),
    chart: phases.map((v: number): [number, number] => [0, v]),
    neighbours: phases.map((v: number, k: number) => ({
      face: 0,
      from: [g(v), v] satisfies [number, number],
      to: [g(next(k)), next(k)] satisfies [number, number],
    })),
  });
  const host: IAutoMovieSolidAtlas = AutoMovieSolidBody.atlas(body).atlas;
  const h: number = (2 * Math.PI) / n;
  const star: number = Math.PI + h / 2;
  const chord: number = (g(Math.PI) + g(Math.PI + h)) / 2;
  const root: number = g(star) + 0.7 * (chord - g(star));
  const width: number = 0.25;

  // 1.
  TestValidator.predicate("premise", chord > root && root > g(star));

  // 2.
  const from: Vec3 = [R * Math.cos(star), root - width, R * Math.sin(star)];
  const m: Vec3 = [-Math.sin(star), 0, Math.cos(star)];
  const roots: { face: number; u: number }[] = [
    { face: 0, u: root },
    { face: 1, u: root - 2 * width - g(star) },
  ];
  for (const [face, u] of [
    [0, root + 0.1],
    [0, root + 0.3],
    [1, -0.1],
    [1, -0.05],
  ] satisfies [number, number][]) {
    const report: { reason: string; numbers: Record<string, number> } = { reason: "", numbers: {} };
    const out = AutoMovieSolidRailSolve.atlas(host, face, [u, star], from, m, [0, 1, 0], width, 40, 1e-12, 4, report);
    TestValidator.predicate(
      `face ${face} u ${u} ${report.reason}`,
      out !== null &&
        roots.some((r): boolean => r.face === out.face && Math.abs(out.chart[0] - r.u) <= 1e-9) &&
        Math.abs(out.chart[1] - star) <= 1e-9,
    );
  }
}

import { AutoMovieSolidBody, AutoMovieSolidRailSolve, type IAutoMovieSolidAtlas, type IAutoMovieSolidSurface } from "@automovie/engine";

type Vec3 = [number, number, number];

/**
 * A host rail whose root lies between a face's kept edge and the exact curve a neighbouring face ends on settles there: a cycle sampled
 * from an exact curve reads that curve between its vertices, so the strip under the chords belongs to the face past it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a body (`AutoMovieSolidBody.create`) of two faces on one cylinder of radius 10 mm about the y axis, station `u` along y and phase `v` round it: the "sheet" (y = u) and the "band" (y = g(v) + u, `u` up to 0), which ends on the exact curve y = g(v) = 5 cos v. The sheet's start cycle keeps the stations above its 24 vertices (g(v_k), v_k) and carries the curve (`along: g`), as a port's rail cycle does; the band's end cycle maps across to it. Through `AutoMovieSolidBody.atlas` it calls `AutoMovieSolidRailSolve.atlas` with the section plane through the axis at the phase v* midway between the vertices at pi and pi + 2 pi / 24, where g is convex and the chord stands above the curve, and a rail circle of radius 0.25 mm centred on the sheet, whose root on the rail's side lies in that strip, at 0.7 of the way from the curve to the chord. Started on the sheet (`u` 0.1 and 0.3 past the root) and on the band (`u` -0.1 and -0.05).
 * @evidence contracts/development/testing.md#independent-expectations In the section plane the cylinder's line is y itself, so the circle's two roots are the stations u* and u* - 0.5 mm at phase v*, closed forms of the layout: u* on the sheet, past the curve, and u* - 0.5 on the band, at band `u` = u* - 0.5 - g(v*). The solve is local, so either root is accepted on its face. Premise checked: the chord's station at v* exceeds g(v*), and u* lies between them. Limits: the published chart within 1e-9 of a root's.
 * @evidence contracts/development/testing.md#distinguishing-cases Red when the sheet's cycle is read as chords: u* lies below the chord, so the sheet does not keep it and the band does not reach it, and the solve alternated until its switches ran out: from the sheet "solved on a trimmed-away part of a face with no chart switch left" at u* (faces visited 0, 1, 0, 1, 0), from the band "no Newton trial lowered the residual in twenty halvings" at its end (faces visited 1, 0, 1, 0, 1), all four starts refused. Green: every start settles on a root.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_operator_rail_sagitta`; closed-form faces in process, no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (the strip under a cycle's chords belongs to the face past the exact curve) as stated in this comment.
 */
export function test_construction_operator_rail_sagitta(): void {
  const failures: string[] = [];
  const R: number = 10;
  const A: number = 5;
  const g = (v: number): number => A * Math.cos(v);
  const sheet: IAutoMovieSolidSurface = {
    name: "sheet",
    orientation: 1,
    domain: [-20, 20],
    period: 2 * Math.PI,
    jet: (u: number, v: number) => ({ p: [R * Math.cos(v), u, R * Math.sin(v)], u: [0, 1, 0], v: [-R * Math.sin(v), 0, R * Math.cos(v)], uu: [0, 0, 0], uv: [0, 0, 0], vv: [-R * Math.cos(v), 0, -R * Math.sin(v)] }),
  };
  const band: IAutoMovieSolidSurface = {
    name: "band",
    orientation: 1,
    domain: [-20, 0],
    period: 2 * Math.PI,
    jet: (u: number, v: number) => ({ p: [R * Math.cos(v), g(v) + u, R * Math.sin(v)], u: [0, 1, 0], v: [-R * Math.sin(v), -A * Math.sin(v), R * Math.cos(v)], uu: [0, 0, 0], uv: [0, 0, 0], vv: [-R * Math.cos(v), -A * Math.cos(v), -R * Math.sin(v)] }),
  };
  const n: number = 24;
  const phases: number[] = Array.from({ length: n }, (_: unknown, k: number): number => (2 * Math.PI * k) / n);
  const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create("sagitta", [
    { surface: sheet, stations: [-20, 20], phases },
    { surface: band, stations: [-20, 0], phases },
  ]);
  const next = (k: number): number => (k + 1 < n ? phases[k + 1]! : 2 * Math.PI);
  body.faces[0]!.cycles.push({
    kind: "start",
    vertices: phases.map((_: number, k: number): number => k),
    chart: phases.map((v: number): [number, number] => [g(v), v]),
    neighbours: phases.map((v: number, k: number) => ({ face: 1, from: [0, v] as [number, number], to: [0, next(k)] as [number, number] })),
    along: g,
  });
  body.faces[1]!.cycles.push({
    kind: "end",
    vertices: phases.map((_: number, k: number): number => k),
    chart: phases.map((v: number): [number, number] => [0, v]),
    neighbours: phases.map((v: number, k: number) => ({ face: 0, from: [g(v), v] as [number, number], to: [g(next(k)), next(k)] as [number, number] })),
  });
  const host: IAutoMovieSolidAtlas = AutoMovieSolidBody.atlas(body).atlas;

  const h: number = (2 * Math.PI) / n;
  const star: number = Math.PI + h / 2;
  const chord: number = (g(Math.PI) + g(Math.PI + h)) / 2;
  const root: number = g(star) + 0.7 * (chord - g(star));
  if (!(chord > root && root > g(star))) failures.push(`premise: the chord ${chord} does not stand above the root ${root} above the curve ${g(star)}`);
  const width: number = 0.25;
  const from: Vec3 = [R * Math.cos(star), root - width, R * Math.sin(star)];
  const m: Vec3 = [-Math.sin(star), 0, Math.cos(star)];
  const roots: { face: number; u: number }[] = [
    { face: 0, u: root },
    { face: 1, u: root - 2 * width - g(star) },
  ];
  for (const [face, u] of [[0, root + 0.1], [0, root + 0.3], [1, -0.1], [1, -0.05]] as const) {
    const report: { reason: string; numbers: Record<string, number> } = { reason: "", numbers: {} };
    const out = AutoMovieSolidRailSolve.atlas(host, face, [u, star], from, m, [0, 1, 0], width, 40, 1e-12, 4, report);
    const visits: string = Object.entries(report.numbers).filter(([key]) => key.startsWith("visit")).map(([, f]) => f).join(", ");
    const label: string = `from face ${face} at u ${u} (roots: sheet u ${root}, band u ${roots[1]!.u}; curve ${g(star)}, chord ${chord}, v* ${star})`;
    if (out === null) failures.push(`${label}: refused (${report.reason}; at face ${report.numbers.face} u ${report.numbers.u} v ${report.numbers.v}, switches left ${report.numbers.switchesLeft}; faces visited ${visits})`);
    else if (!roots.some((r): boolean => r.face === out.face && Math.abs(out.chart[0] - r.u) <= 1e-9) || !(Math.abs(out.chart[1] - star) <= 1e-9))
      failures.push(`${label}: settled on face ${out.face} at (${out.chart[0]}, ${out.chart[1]}) (faces visited ${visits}), expected a root`);
  }
  if (failures.length) throw new Error(`${failures.length} rail sagitta failures:\n${failures.join("\n")}`);
}

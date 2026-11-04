import { type AutoMovieConstructionRealization, type IAutoMovieSolidSurface, realizeAutoMovieConstruction } from "@automovie/engine";
import type { IAutoMovieConstructionKnot, IAutoMovieConstructionView } from "@automovie/interface";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A view part whose fullness is its tape girth realizes sections whose taut
 * tape is that girth: given the inscribed ellipse's perimeter as its girth,
 * an elliptical box's section is that ellipse.
 *
 * Scenarios:
 * 1. A straight part of half axes 0.03 by 0.02 m, its girth knots the ellipse's AGM perimeter: at every knot station the realized section's taut tape (its convex hull's perimeter at 1024 phases) is the girth, and its points stand on the ellipse, each within the section spline's error bound, with no diagnostic.
 * 2. Red: the realized section read against a girth 1 mm larger misses it.
 *
 * @evidence contracts/testing.md#behavioral-verification Realizes the part with `realizeAutoMovieConstruction` and reads its surface at the knot stations. It catches a girth owner that is not honoured (a shoulder solved against another measure, a section not convex where the tape lies) and an ellipse box whose girth-solved section is not the ellipse; any construction that solves the one shoulder giving the girth passes.
 * @evidence contracts/testing.md#independent-expectations The ellipse's perimeter by the AGM (`ConstructionShapes.Oracle.perimeter`); one girth gives one shoulder (the perimeter rises with it, `IAutoMovieConstructionGirth`), so the ellipse's perimeter gives the ellipse's shoulder; the periodic cubic section through `order` points errs by at most `5 (2 pi / n)^4 a / 384`, and a polygon of 1024 sides under-reads a perimeter by under 4e-6 of it. Oracle limit: the girth solve's own tolerance, 1e-9 of the girth, stands far below the section's error.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the ellipse's girth. Negative: a girth 1 mm off. A girth outside the reach belongs to `test_construction_diagnostics`; the touch at the guides to `test_construction_view_touch`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_view_girth`; it realizes made trees in process and starts no host, browser or GPU.
 */
export function test_construction_view_girth(): void {
  const failures: string[] = [];
  const [a, b]: [number, number] = [0.03, 0.02];
  const frame: ConstructionShapes.IFrame = ConstructionShapes.DOWN;
  const base: IAutoMovieConstructionView = ConstructionShapes.part("band", frame, ConstructionShapes.uniform(0, 0.08, 5), (): [number, number, number, number] => [a, b, a, b], "open");
  const perimeter: number = ConstructionShapes.Oracle.perimeter(a, b);
  const part: IAutoMovieConstructionView = {
    ...base,
    fullness: { type: "girth", girth: { knots: base.stations.map((s: number, i: number): IAutoMovieConstructionKnot => ({ site: `girth ${i}`, station: s, value: perimeter })) }, departures: null },
  };
  const real: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "made", root: part }, { chord: 1e-4 });
  if (real.diagnostics.length !== 0) failures.push(`diagnostics: ${ConstructionRead.diagnostics(real)}`);
  // The kernel's surfaces are in millimetres; the fixture's closed forms in metres.
  const surface: IAutoMovieSolidSurface = ConstructionRead.metres(ConstructionRead.surface(real, "band"));

  const bound: number = ConstructionChecks.sectionSpline(a, part.order);
  const tape: (s: number) => number = (s: number): number => hull(Array.from({ length: 1024 }, (_: unknown, k: number): [number, number] => ConstructionChecks.chart(frame, s, surface.jet(s, (2 * Math.PI * k) / 1024).p)));
  for (const s of part.stations) {
    const read: number = tape(s);
    if (!(Math.abs(read - perimeter) <= 2 * Math.PI * bound + 4e-6 * perimeter)) failures.push(`station ${s}: taut tape ${read} m against the girth ${perimeter} m`);
    for (let k: number = 0; k < 64; k++) {
      const [x, z]: [number, number] = ConstructionChecks.chart(frame, s, surface.jet(s, (2 * Math.PI * k) / 64).p);
      const off: number = Math.abs(Math.sqrt((x / a) ** 2 + (z / b) ** 2) - 1) * b;
      if (!(off <= bound)) failures.push(`station ${s} phase ${k}: ${off} m off the ellipse`);
    }
  }

  // Red: the same section read against a girth 1 mm larger.
  if (Math.abs(tape(part.stations[2]!) - (perimeter + 0.001)) <= 2 * Math.PI * bound + 4e-6 * perimeter) failures.push("proof: a girth 1 mm larger reads as honoured");
  if (failures.length !== 0) throw new Error(`${failures.length} girth failures:\n${failures.slice(0, 20).join("\n")}`);
}

/** The perimeter of a planar point set's convex hull (Andrew's monotone chain). */
function hull(points: [number, number][]): number {
  const p: [number, number][] = [...points].sort((u: [number, number], v: [number, number]): number => u[0] - v[0] || u[1] - v[1]);
  const turn: (o: [number, number], a: [number, number], b: [number, number]) => number = (o: [number, number], a: [number, number], b: [number, number]): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const q of p) {
    while (lower.length >= 2 && turn(lower[lower.length - 2]!, lower[lower.length - 1]!, q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: [number, number][] = [];
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && turn(upper[upper.length - 2]!, upper[upper.length - 1]!, q) <= 0) upper.pop();
    upper.push(q);
  }
  const loop: [number, number][] = [...lower.slice(0, -1), ...upper.slice(0, -1)];
  let sum: number = 0;
  for (let i: number = 0; i < loop.length; i++) sum += Math.hypot(loop[(i + 1) % loop.length]![0] - loop[i]![0], loop[(i + 1) % loop.length]![1] - loop[i]![1]);
  return sum;
}

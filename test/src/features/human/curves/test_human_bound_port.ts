import { AutoMovieLoftViewFullSource } from "@automovie/engine";
import { AutoMovieHumanBoundSection, AutoMovieHumanConicLoft, AutoMovieHumanConicSection } from "@automovie/human";
import type { AutoMovieVector3Tuple, IAutoMovieHumanConicLoft } from "@automovie/interface";

/**
 * A side part's port: its view starts at its joint's loop and its sections blend from the loop into its own (joints-one-shot.md, "The
 * port blend, ruled").
 *
 * The made part: a round tube of radius 4 mm along `+X` from the origin, its stored knots at 20, 40 and 60 mm, extended to 8 mm
 * (`AutoMovieHumanConicLoft.extended`). The made loop: `(14 + 2 cos c, 6 cos c, 6 sin c)`, a circle of radius 6 mm about the course
 * that wobbles between stations 12 and 16 mm, before the stored first knot. The mark: 20 mm, past the loop's deepest station.
 *
 * Scenarios:
 * 1. The extension leaves the first knot on the tube's own (zero) slope: the extended tube's sections at 8 to 20 mm are circles of radius
 *    4 within 1e-9 mm, and its view starts at 8 mm, so every loop clock has its one section plane before the stored first knot.
 * 2. At each master clock the port passes through the loop: radius 6 at the loop's own station and phase within 1e-6 mm.
 * 3. The port meets the tube's own surface at the mark: just before it the port's point and its first station derivative equal the
 *    tube's within 1e-6 (the quintic step's first and second derivatives vanish there).
 * 4. Between the loop and the mark every port radius lies between the loop's 6 and the tube's 4 mm: the convex blend of two
 *    star-shaped radial functions about one centre is star-shaped.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanConicLoft.extended` and `AutoMovieHumanBoundSection.port` on a made tube and loop.
 * @evidence contracts/development/testing.md#independent-expectations A round tube's constant fields give circles; the loop's radius and the tube's are known; a convex blend lies between its ends.
 * @evidence contracts/development/testing.md#distinguishing-cases Without the extension the view starts at 20 mm and the loop's clocks have no section plane; a blend not through the loop, not C1 at the mark or not convex fails scenario 2, 3 or 4.
 * @evidence contracts/development/testing.md#execution-ownership Made tube and loop only.
 * @evidence contracts/development/common.md#meaningful-documentation Names the made part, the loop, the mark and each expectation.
 */
export function test_human_bound_port(): void {
  const failures: string[] = [];
  type V = AutoMovieVector3Tuple;
  const ring = (r: number): number[] => [r, 0, Math.SQRT2 - 1, 0, r, Math.SQRT2 - 1, -r, 0, Math.SQRT2 - 1, 0, -r, Math.SQRT2 - 1];
  const rho: number = 1 / (1 + 1 / Math.cos(Math.PI / 8));
  const field: number[] = [...ring(4), ...Array.from({ length: 8 }, (): number => rho)];
  const tube: IAutoMovieHumanConicLoft.IFamily = { name: "tube", centres: [[0, 0, 0], [60, 0, 0]], halves: [], up: [0, 1, 0],
    layout: AutoMovieHumanConicSection.limb(1), knots: [20, 40, 60], values: field.map((x: number): number[] => [x, x, x]) };
  const part = AutoMovieHumanConicLoft.extended(tube, 8);
  const stations: number[] = Array.from({ length: 27 }, (_, i: number): number => 8 + 2 * i);
  const view = AutoMovieHumanConicLoft.part(part, stations, false);
  const source = AutoMovieLoftViewFullSource.create(view);
  const axis = AutoMovieHumanConicLoft.axis(part);
  const radius = (p: readonly number[], s: number): number => { const o = axis.at(s).origin; return Math.hypot(p[1]! - o[1]!, p[2]! - o[2]!); };
  for (const s of [8, 11, 14, 17, 20]) for (const phi of [0, 1, 2.5, 4]) {
    const r: number = radius(source.point(s, phi), s);
    if (!(Math.abs(r - 4) <= 1e-9)) failures.push(`the extension at ${s} mm, phase ${phi} has radius ${r}`);
  }
  if (!(view.stations[0]! <= 8)) failures.push(`the extended view starts at ${view.stations[0]} mm`);

  const at = (c: number): { point: V; first: V; second: V } => ({
    point: [14 + 2 * Math.cos(c), 6 * Math.cos(c), 6 * Math.sin(c)],
    first: [-2 * Math.sin(c), -6 * Math.sin(c), 6 * Math.cos(c)],
    second: [-2 * Math.cos(c), -6 * Math.cos(c), -6 * Math.sin(c)],
  });
  const station = (world: V): [number, number][] => {
    const f = axis.at(world[0]), q = [world[0] - f.origin[0]!, world[1] - f.origin[1]!, world[2] - f.origin[2]!];
    const u = f.u, v = f.v;
    return [[world[0], Math.atan2(q[0]! * v[0]! + q[1]! * v[1]! + q[2]! * v[2]!, q[0]! * u[0]! + q[1]! * u[1]! + q[2]! * u[2]!)]];
  };
  const mark: number = 20;
  const made = AutoMovieHumanBoundSection.port({ view, station, at, count: 32, mark, tolerance: 1e-6 });
  const port = made.view.originalSection!;
  const local = (p: readonly number[]): number => Math.hypot(p[0]!, p[1]!);
  for (let k = 0; k < 64; ++k) {
    const c = (2 * Math.PI * k) / 64, [s, phi] = made.childAt(c).point;
    const r: number = local(port.point(s, phi));
    if (!(Math.abs(r - 6) <= 1e-6)) failures.push(`the port at clock ${k} (station ${s}, phase ${phi}) has radius ${r}, not the loop's 6`);
  }
  for (const phi of [0, 1, 2.5, 4]) {
    const s: number = mark - 1e-7;
    const p = port.jet(s, phi), q = port.jet(mark, phi);
    if (!(Math.hypot(p.p[0] - q.p[0], p.p[1] - q.p[1]) <= 1e-6 && Math.hypot(p.s[0] - q.s[0], p.s[1] - q.s[1]) <= 1e-6))
      failures.push(`the port does not meet the tube C1 at the mark, phase ${phi}`);
  }
  for (const s of [12, 14, 16, 18, 19.5]) for (let k = 0; k < 16; ++k) {
    const phi = (2 * Math.PI * k) / 16, r = local(port.point(s, phi));
    if (!(r >= 4 - 1e-9 && r <= 6 + 1e-9)) failures.push(`the port at ${s} mm, phase ${phi} has radius ${r}, outside the blend's 4 to 6`);
  }
  if (failures.length > 0) throw new Error("bound port:\n" + failures.join("\n"));
}

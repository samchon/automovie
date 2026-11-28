import { AutoMovieEngineLoftRelief, AutoMovieEngineViewAxis } from "@automovie/engine";
import {
  AutoMovieHumanConicRecentre as Recentre,
  AutoMovieHumanConicReliefRecentre as Nets,
} from "@automovie/human";
import type { IAutoMovieLoftRelief, IAutoMovieViewAxis } from "@automovie/interface";

/**
 * A relief net re-expressed in a re-centred chart leaves the skin where it was.
 *
 * The made wall is a cylinder of radius 40 mm about a straight course; its origin line stands `c(s) = 6 + 0.05 s` mm off the course along
 * `u`, so about that line the same circle has the radius `r'(t') = -c cos t' + sqrt(R^2 - c^2 sin^2 t')` (the positive root of
 * `|c u + r' e(t')| = R`). The made net is a smooth bump of 3 mm over stations 2 to 28 and phases 0.6 to 2.2.
 *
 * Scenarios:
 * 1. A fixed axis along the course (a height that leaves the section plane, as a cast straight down): the same wall point moves by the
 *    same vector, so the converted height at a new address `(s, t')` is the stored height at the stored address of that wall point,
 *    `tau = atan2(r' sin t', c + r' cos t')`.
 * 2. A net cast square to the chart, inward (`axis` and `turn` the chart's inward radial and its turn at the window's middle): the stored
 *    skin's radius about the course is `R - h(s, theta)`, so a point of the converted figure, read as polar `(rho, theta)` about the
 *    course, has `rho = R - h(s, theta)`; and its converted direction is the inward radial of the new chart at every phase.
 * 3. The converted window holds the stored window's edges, whose new angles are `atan2(R sin p, R cos p - c)`, and is no wider than their
 *    range over the window's stations and a rounding outward to four decimals.
 * 4. With no move, a net whose direction turns and leaves the section plane returns its own window and heights.
 * 5. Made defects: the stored net left as it is on the re-centred wall misses scenario 2's identity by more than a tenth of a
 *    millimetre, and a net with a station map is refused.
 *
 * The tolerance of scenarios 1 and 2 is 0.01 mm, the precision heights are stored at: a cubic net of 20 spans across the bump meets a
 * smooth re-parameterization of another cubic net to its fourth order, a few ten-thousandths of the bump's 3 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production conversion and reads its nets through the engine's own height and direction.
 * @evidence contracts/development/testing.md#independent-expectations The circle's radius about a shifted origin, the stored address of a wall point, the stored skin's polar radius about its own course and an edge point's polar angle are closed forms of the made inputs.
 * @evidence contracts/development/common.md#meaningful-documentation The converted relief checks carried axes, inward casts and mapped window edges on a circle with moved origin. Zero movement and an unconverted net provide controls.
 */
export function test_human_conic_relief_recentre(): void {
  const failures: string[] = [];
  type V3 = [number, number, number];
  const R: number = 40;
  const knots: number[] = [0, 10, 20, 30];
  const c = (s: number): number => 6 + 0.05 * s;
  const [origin, u, v]: V3[] = [[1, 2, 3], [1, 0, 0], [0, 0, 1]];
  const base: IAutoMovieViewAxis.IAxis = AutoMovieEngineViewAxis.straight(origin!, u!, v!);
  const at = (axis: IAutoMovieViewAxis.IAxis, s: number, x: number, y: number): V3 => {
    const frame = axis.at(s);
    return [0, 1, 2].map((k: number): number => frame.origin[k]! + x * frame.u[k]! + y * frame.v[k]!) as V3;
  };
  const wall = (shift: (s: number) => number): Nets.ISkin => {
    const axis: IAutoMovieViewAxis.IAxis = Recentre.axis(base, knots, { u: knots.map(shift), v: knots.map((): number => 0) });
    return {
      axis,
      stations: [0, 30],
      point: (s: number, t: number): V3 => {
        const r: number = -shift(s) * Math.cos(t) + Math.sqrt(R * R - (shift(s) * Math.sin(t)) ** 2);
        return at(axis, s, r * Math.cos(t), r * Math.sin(t));
      },
    };
  };
  const stored: Nets.ISkin = wall((): number => 0);
  const made: Nets.ISkin = wall(c);

  // The made net: a bump of 3 mm, its three outer rings zero.
  const [rows, columns]: [number, number] = [13, 23];
  const window = { start: 0.6, end: 2.2 };
  const middle: number = 1.4;
  const heights: number[] = Array.from({ length: rows * columns }, (_: unknown, i: number): number => {
    const [a, b]: [number, number] = [Math.floor(i / columns), i % columns];
    if (a < 3 || a > rows - 4 || b < 3 || b > columns - 4) return 0;
    return 3 * Math.sin((Math.PI * (a - 2)) / (rows - 5)) ** 2 * Math.sin((Math.PI * (b - 2)) / (columns - 5)) ** 2;
  });
  const inward: V3 = [-Math.cos(middle), 0, -Math.sin(middle)];
  const turning: V3 = [Math.sin(middle), 0, -Math.cos(middle)];
  const net = (axis: V3, turn?: V3): IAutoMovieLoftRelief => ({ name: "made", stations: { start: 2, end: 28 }, phases: window, axis, ...(turn === undefined ? {} : { turn }), rows, columns, heights });
  const addresses: [number, number][] = [];
  for (const s of [3.3, 8.1, 15, 21.7, 26.9]) for (let j: number = 0; j < 40; ++j) addresses.push([s, 0.45 + (2.1 * (j + 0.3)) / 40]);

  // 1. A kept axis along the course.
  const down: IAutoMovieLoftRelief = net([0, -1, 0]);
  const carried: Nets.INet = Nets.convert({ stored, made, reliefs: [down] })[0]!;
  if (carried.mode !== "carried") failures.push(`a kept axis was converted as ${carried.mode}`);
  let worst: number = 0;
  for (const [s, t] of addresses) {
    const r: number = -c(s) * Math.cos(t) + Math.sqrt(R * R - (c(s) * Math.sin(t)) ** 2);
    const tau: number = Math.atan2(r * Math.sin(t), c(s) + r * Math.cos(t));
    worst = Math.max(worst, Math.abs(AutoMovieEngineLoftRelief.height(carried.relief, s, t)[0] - AutoMovieEngineLoftRelief.height(down, s, tau)[0]));
  }
  if (!(worst <= 0.01)) failures.push(`a kept axis: the converted height stands ${worst} mm off the stored height of the same wall point`);

  // 2. A net cast square to the chart, and 5's first made defect: the same reading of the stored net left unconverted.
  const radial: IAutoMovieLoftRelief = net(inward, turning);
  const cast: Nets.INet = Nets.convert({ stored, made, reliefs: [radial] })[0]!;
  if (cast.mode !== "cast") failures.push(`a net cast square to its chart was converted as ${cast.mode}`);
  const off = (relief: IAutoMovieLoftRelief): number => {
    let most: number = 0;
    for (const [s, t] of addresses) {
      const h: number = AutoMovieEngineLoftRelief.height(relief, s, t)[0];
      const e: readonly number[] = AutoMovieEngineLoftRelief.direction(relief, t)[0];
      const p: V3 = made.point(s, t).map((x: number, k: number): number => x + h * e[k]!) as V3;
      const d: V3 = p.map((x: number, k: number): number => x - base.at(s).origin[k]!) as V3;
      const theta: number = Math.atan2(d[2], d[0]);
      most = Math.max(most, Math.abs(Math.hypot(d[0], d[2]) - (R - AutoMovieEngineLoftRelief.height(radial, s, theta)[0])));
    }
    return most;
  };
  if (!(off(cast.relief) <= 0.01)) failures.push(`a cast net: the converted figure stands ${off(cast.relief)} mm off the stored skin`);
  if (!(off(radial) > 0.1)) failures.push(`the unconverted net on the re-centred wall reads only ${off(radial)} mm off the stored skin: the check cannot see the defect`);
  for (const t of [0.7, 1.4, 2.1]) {
    const e: readonly number[] = AutoMovieEngineLoftRelief.direction(cast.relief, t)[0];
    if (!(Math.hypot(e[0]! + Math.cos(t), e[1]!, e[2]! + Math.sin(t)) <= 1e-12)) failures.push(`the converted direction at phase ${t} is [${e.join(", ")}], not the new chart's inward radial`);
  }

  // 3. The window.
  const mapped = (p: number, s: number): number => Math.atan2(R * Math.sin(p), R * Math.cos(p) - c(s));
  const { start: low, end: high } = cast.relief.phases;
  // The edge's angle grows with the move, which grows with the station: its least is at the window's first station, its most at the last.
  if (!(low <= mapped(window.start, 2.325) && low >= mapped(window.start, 2) - 1.0001e-4)) failures.push(`the window's first edge ${low} does not stand at the mapped edge ${mapped(window.start, 2)} rounded outward`);
  if (!(high >= mapped(window.end, 27.675) && high <= mapped(window.end, 28) + 1.0001e-4)) failures.push(`the window's last edge ${high} does not stand at the mapped edge ${mapped(window.end, 28)} rounded outward`);

  // 4. No move, a direction that turns and leaves the section plane.
  const tilted: V3 = [inward[0] * Math.SQRT1_2, Math.SQRT1_2, inward[2] * Math.SQRT1_2];
  const lifted: IAutoMovieLoftRelief = net(tilted, turning);
  const same: Nets.INet = Nets.convert({ stored, made: stored, reliefs: [lifted] })[0]!;
  if (same.mode !== "skew") failures.push(`a direction out of the section plane was converted as ${same.mode}`);
  if (!(Math.abs(same.relief.phases.start - window.start) <= 1e-12 && Math.abs(same.relief.phases.end - window.end) <= 1e-12)) failures.push(`with no move the window became [${same.relief.phases.start}, ${same.relief.phases.end}]`);
  const drift: number = Math.max(...same.relief.heights.map((h: number, i: number): number => Math.abs(h - heights[i]!)));
  if (!(drift <= 1e-6)) failures.push(`with no move the heights changed by ${drift} mm`);

  // 5. A station map is refused.
  try {
    Nets.convert({ stored, made, reliefs: [{ ...radial, shift: heights.map((): number => 0) }] });
    failures.push("a net with a station map was accepted");
  } catch {
    // refused as required
  }

  if (failures.length !== 0) throw new Error(failures.join("\n"));
}

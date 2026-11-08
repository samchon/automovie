import { AutoMovieHumanSeam } from "../../../../packages/human/src/lofting/AutoMovieHumanSeam";
import { AutoMovieHumanSeamKnot } from "../../../../packages/human/src/lofting/AutoMovieHumanSeamKnot";
import { AutoMovieSplineCurve } from "@automovie/engine";
import type { IAutoMovieHumanSeam } from "../../../../packages/human/src/lofting/IAutoMovieHumanSeam";
import { HumanSeamObserver } from "../../../../packages/human/src/inspection/HumanSeamObserver";

/**
 * A section assembled from guides and sectors owns every guide's point,
 * tangent and curvature exactly, and a copied curve jet keeps its geometry
 * whatever the neighbour's parameter speed.
 *
 * @evidence contracts/testing.md#behavioral-verification Assembles a 32-control section of a circle (radius 40 mm, centre (5, -3)) from four guides at knots 0, 6, 15 and 23 and the circle's own arcs between them with `AutoMovieHumanSeamKnot.assemble`, evaluates it with the chain's own spline evaluator, and reads each guide with `HumanSeamObserver.curve` from points alone; it also publishes and copies curve jets with `AutoMovieHumanSeam.publish` and `adopt`, round-trips knot jets with `knot` and `controls`, and reads two tangent circles of different radii. It catches a guide whose spline misses its published jet, a sector assembly that leaves a corner or curvature step at a guide, a copy whose geometry changes with the neighbour's speed, a wrong J2 inverse and an observer that cannot see a tangent-continuous curvature step. Any section passes whose guides carry their published jets and whose spline is C2.
 * @evidence contracts/testing.md#independent-expectations Expectations come from the circle itself and from closed forms: at a guide the spline must have the circle's point, tangent and curvature vector `-(p - c) / R^2`; a published tangent turned by 1e-3 rad must read 1e-3 rad against the circle, a curvature vector moved by 2e-3 /mm along the normal 2e-3 /mm, a point moved 0.05 mm a 0.05 mm gap; two circles of radii 40 and 25 mm tangent at a point read a curvature step of `1/25 - 1/40`. The spline's values come from `AutoMovieSplineCurve`, the chain's representation, not from the assembly under test. Readings from points are judged by `HumanSeamObserver.exact(46, 0.04)`, a hundred times the observer's rounding at that magnitude and step; jets read straight from the spline by 1e-12 relative, since assembly and evaluation are a few dozen double operations. Oracle limit: the observer resolves a curvature step only above about 2e-8 /mm at that step.
 * @evidence contracts/testing.md#distinguishing-cases Green: the exact circle at every guide; the J2 map and its inverse round trip both ways, each derivative order alone, at spacings 2pi/32, 0.05, 0.5 and 2; copies at speeds 0.5 and 3 with accelerations 0 and 2; tangent circles declared G1 pass. Red with exact numbers: turned tangent, moved curvature, moved point, tangent circles declared G2. The same circle samples through the global `AutoMovieSplineCurve.interpolate` filter miss the guide's curvature, the path the assembly replaces. Refused: three spans between guides, guides out of order, a sector count other than the guide count, a copy at a negative speed. Seams of loft chains along their stations, reflection and surface ribbons are owned by `test_human_seam_station` and `test_human_seam_ribbon`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_seam_section`; it builds only analytic curves in process and starts no host, browser or GPU.
 */
export const test_human_seam_section: () => void = (): void => {
  const failures: string[] = [];
  const R: number = 40;
  const centre: number[] = [5, -3];
  const N: number = 32;
  const tolerance: HumanSeamObserver.ITolerance = HumanSeamObserver.exact(R + 6, 1e-3 * R);
  const algebra: HumanSeamObserver.ITolerance = { gap: 1e-12 * R, angle: 1e-12, curvature: 1e-12 / R, basis: "algebraic copy, 1e-12 relative" };
  const close: (label: string, a: readonly number[], b: readonly number[], limit: number) => void = (
    label: string,
    a: readonly number[],
    b: readonly number[],
    limit: number,
  ): void => {
    const d: number = Math.hypot(...a.map((v: number, k: number): number => v - b[k]!));
    if (!(d <= limit)) failures.push(`${label}: differs by ${d} (limit ${limit})`);
  };

  // The circle by angle: point, first and second phase derivatives.
  const circle: (t: number, radius?: number, c?: number[]) => AutoMovieHumanSeamKnot.Jet = (
    t: number,
    radius: number = R,
    c: number[] = centre,
  ): AutoMovieHumanSeamKnot.Jet => [
    [c[0]! + radius * Math.cos(t), c[1]! + radius * Math.sin(t)],
    [-radius * Math.sin(t), radius * Math.cos(t)],
    [-radius * Math.cos(t), -radius * Math.sin(t)],
  ];
  const published: (t: number) => IAutoMovieHumanSeam.IArcJet = (t: number): IAutoMovieHumanSeam.IArcJet => {
    const [p, d1, d2]: AutoMovieHumanSeamKnot.Jet = circle(t);
    return AutoMovieHumanSeam.publish(p, d1, d2);
  };
  const knots: number[] = [0, 6, 15, 23];
  const phase: (k: number) => number = (k: number): number => (2 * Math.PI * k) / N;
  const build: (
    edit: (k: number, jet: IAutoMovieHumanSeam.IArcJet) => IAutoMovieHumanSeam.IArcJet,
  ) => number[] = (
    edit: (k: number, jet: IAutoMovieHumanSeam.IArcJet) => IAutoMovieHumanSeam.IArcJet,
  ): number[] =>
    AutoMovieHumanSeamKnot.assemble(
      N,
      knots.map((k: number): AutoMovieHumanSeamKnot.IGuide => ({ knot: k, jet: edit(k, published(phase(k))), speed: R })),
      knots.map(
        (k: number): AutoMovieHumanSeamKnot.ISector => ({
          name: `arc ${k}`,
          jet: (t: number): AutoMovieHumanSeamKnot.Jet => circle(t),
        }),
      ),
    );
  const point: (c: readonly number[]) => (t: number) => number[] =
    (c: readonly number[]): ((t: number) => number[]) =>
    (t: number): number[] => {
      const e: number[] = AutoMovieSplineCurve.evaluate(c, N, t);
      return [e[0]!, e[1]!];
    };
  const jetOf: (c: readonly number[], t: number) => IAutoMovieHumanSeam.IArcJet = (
    c: readonly number[],
    t: number,
  ): IAutoMovieHumanSeam.IArcJet => {
    const j: number[] = AutoMovieSplineCurve.jet(c, N, t);
    return AutoMovieHumanSeam.publish([j[0]!, j[1]!], [j[2]!, j[3]!], [j[4]!, j[5]!]);
  };
  const step: number = 1e-3;

  // Green: every guide owns the circle's jet, and the spline is C2 through it.
  const exact: number[] = build((_: number, j: IAutoMovieHumanSeam.IArcJet): IAutoMovieHumanSeam.IArcJet => j);
  for (const k of knots) {
    const got: IAutoMovieHumanSeam.IArcJet = jetOf(exact, phase(k));
    const want: IAutoMovieHumanSeam.IArcJet = published(phase(k));
    close(`guide ${k} point`, got.point, want.point, algebra.gap);
    close(`guide ${k} tangent`, got.tangent, want.tangent, algebra.angle);
    close(`guide ${k} curvature`, got.curvature, want.curvature, algebra.curvature);
    const f: (t: number) => number[] = point(exact);
    failures.push(
      ...HumanSeamObserver.audit(
        [
          HumanSeamObserver.curve(
            "assembled circle",
            `guide ${k}`,
            (s: number): number[] => f(phase(k) - s),
            (s: number): number[] => f(phase(k) + s),
            step,
          ),
        ],
        "G2",
        tolerance,
      ),
    );
  }

  // The global filter cannot honour the guide's curvature.
  const filtered: number[] = AutoMovieSplineCurve.interpolate(
    Array.from({ length: N }, (_: unknown, k: number): [number, number] => {
      const p: number[] = circle(phase(k))[0];
      return [p[0]!, p[1]!];
    }),
  );
  const miss: number = Math.hypot(
    ...jetOf(filtered, phase(6)).curvature.map((v: number, k: number): number => v - published(phase(6)).curvature[k]!),
  );
  if (!(miss > 1e6 * algebra.curvature))
    failures.push(`interpolate met the guide's curvature (${miss} /mm), so the assembly path would not be needed`);

  // Red: a guide's published jet moved by a known amount reads that amount.
  const delta: number = 1e-3;
  const turned: number[] = build((k: number, j: IAutoMovieHumanSeam.IArcJet): IAutoMovieHumanSeam.IArcJet =>
    k !== 15
      ? j
      : {
          ...j,
          tangent: [
            j.tangent[0]! * Math.cos(delta) - j.tangent[1]! * Math.sin(delta),
            j.tangent[0]! * Math.sin(delta) + j.tangent[1]! * Math.cos(delta),
          ],
        },
  );
  const tt: number[] = jetOf(turned, phase(15)).tangent;
  const tw: number[] = published(phase(15)).tangent;
  const read: number = Math.atan2(tw[0]! * tt[1]! - tw[1]! * tt[0]!, tw[0]! * tt[0]! + tw[1]! * tt[1]!);
  if (!(Math.abs(read - delta) <= algebra.angle)) failures.push(`turned guide reads ${read} rad, not ${delta}`);
  const dk: number = 2e-3;
  const bent: number[] = build((k: number, j: IAutoMovieHumanSeam.IArcJet): IAutoMovieHumanSeam.IArcJet => {
    if (k !== 6) return j;
    const n: number[] = j.curvature.map((v: number): number => v * R);
    return { ...j, curvature: j.curvature.map((v: number, c: number): number => v + dk * n[c]!) };
  });
  const bentRead: number = Math.hypot(
    ...jetOf(bent, phase(6)).curvature.map((v: number, c: number): number => v - published(phase(6)).curvature[c]!),
  );
  if (!(Math.abs(bentRead - dk) <= algebra.curvature)) failures.push(`bent guide reads ${bentRead} /mm, not ${dk}`);
  const gap: number = 0.05;
  const moved: number[] = build((k: number, j: IAutoMovieHumanSeam.IArcJet): IAutoMovieHumanSeam.IArcJet =>
    k !== 23 ? j : { ...j, point: j.point.map((v: number, c: number): number => v + gap * j.curvature[c]! * R) },
  );
  const gapRead: number = Math.hypot(
    ...jetOf(moved, phase(23)).point.map((v: number, c: number): number => v - published(phase(23)).point[c]!),
  );
  if (!(Math.abs(gapRead - gap) <= algebra.gap)) failures.push(`moved guide reads ${gapRead} mm, not ${gap}`);

  // J1: a copy keeps the geometry at any speed and acceleration.
  for (const [lambda, mu] of [[0.5, 0], [3, 0], [3, 2]] as [number, number][]) {
    const jet: IAutoMovieHumanSeam.IArcJet = published(1.1);
    const [q, q1, q2]: [number[], number[], number[]] = AutoMovieHumanSeam.adopt(jet, lambda, mu);
    const back: IAutoMovieHumanSeam.IArcJet = AutoMovieHumanSeam.publish(q, q1, q2);
    close(`copy at ${lambda}, ${mu} tangent`, back.tangent, jet.tangent, 1e-12);
    close(`copy at ${lambda}, ${mu} curvature`, back.curvature, jet.curvature, 1e-12 / R);
    if (!(Math.abs(Math.hypot(...q1) - lambda) <= 1e-12 * lambda)) failures.push(`copy at ${lambda} has speed ${Math.hypot(...q1)}`);
  }

  // J2: knot jets and their control points are inverse.
  const h: number = phase(1);
  const triple: [number[], number[], number[]] = [[3.2, -1.1], [4.7, 0.4], [5.1, 2.9]];
  const [b0, b1, b2]: [number[], number[], number[]] = AutoMovieHumanSeamKnot.controls(
    AutoMovieHumanSeamKnot.knot(...triple, h),
    h,
  );
  [b0, b1, b2].forEach((p: number[], i: number): void => close(`J2 round trip ${i}`, p, triple[i]!, 1e-12 * 10));

  // The other way round, at several spacings: a jet written as three control
  // points reads back as itself, each order alone, so a wrong weight on p''
  // (a fifth instead of a sixth in P0) or on p' cannot cancel.
  for (const spacing of [phase(1), 0.05, 0.5, 2])
    for (const jet of [
      [[3.2, -1.1], [0, 0], [0, 0]],
      [[0, 0], [1.7, -0.4], [0, 0]],
      [[0, 0], [0, 0], [-2.3, 0.9]],
      [[3.2, -1.1], [1.7, -0.4], [-2.3, 0.9]],
    ] as AutoMovieHumanSeamKnot.Jet[]) {
      const back: AutoMovieHumanSeamKnot.Jet = AutoMovieHumanSeamKnot.knot(...AutoMovieHumanSeamKnot.controls(jet, spacing), spacing);
      back.forEach((v: number[], o: number): void =>
        close(`J2 jet round trip at h ${spacing}, order ${o}`, v, jet[o]!, 1e-12 * (1 + Math.hypot(...jet[o]!)) / spacing ** o),
      );
    }
  const kj: AutoMovieHumanSeamKnot.Jet = AutoMovieHumanSeamKnot.knot(
    [exact[N - 1]!, exact[2 * N - 1]!], [exact[0]!, exact[N]!], [exact[1]!, exact[N + 1]!], h,
  );
  const sj: number[] = AutoMovieSplineCurve.jet(exact, N, 0);
  close("J2 knot jet against the spline", [...kj[0], ...kj[1], ...kj[2]], sj, 1e-9 * R);

  // The observer itself: tangent circles of radii 40 and 25 meet G1, not G2.
  const r2: number = 25;
  const second: number[] = [centre[0]! + R - r2, centre[1]!];
  const before: (s: number) => number[] = (s: number): number[] => circle(-s / R)[0];
  const after: (s: number) => number[] = (s: number): number[] => circle(s / r2, r2, second)[0];
  const pair: HumanSeamObserver.IReading = HumanSeamObserver.curve("tangent circles", "contact", before, after, step * R);
  if (HumanSeamObserver.audit([pair], "G1", tolerance).length) failures.push(`tangent circles fail G1: ${JSON.stringify(pair)}`);
  if (!(Math.abs(pair.curvature - (1 / r2 - 1 / R)) <= tolerance.curvature))
    failures.push(`tangent circles read a curvature step ${pair.curvature}, not ${1 / r2 - 1 / R}`);
  if (HumanSeamObserver.audit([pair], "G2", tolerance).length !== 1) failures.push("tangent circles declared G2 were not listed");

  // Refusals.
  const refuses: (label: string, run: () => unknown) => void = (label: string, run: () => unknown): void => {
    try {
      run();
      failures.push(`${label} was accepted`);
    } catch {
      // Expected.
    }
  };
  const guide: (k: number) => AutoMovieHumanSeamKnot.IGuide = (k: number): AutoMovieHumanSeamKnot.IGuide => ({
    knot: k,
    jet: published(phase(k)),
    speed: R,
  });
  const sector: AutoMovieHumanSeamKnot.ISector = {
    name: "arc",
    jet: (t: number): AutoMovieHumanSeamKnot.Jet => circle(t),
  };
  refuses("three spans between guides", (): number[] => AutoMovieHumanSeamKnot.assemble(N, [guide(0), guide(3)], [sector, sector]));
  refuses("guides out of order", (): number[] => AutoMovieHumanSeamKnot.assemble(N, [guide(10), guide(4)], [sector, sector]));
  refuses("one sector for two guides", (): number[] => AutoMovieHumanSeamKnot.assemble(N, [guide(0), guide(10)], [sector]));
  refuses("a copy at a negative speed", (): unknown => AutoMovieHumanSeam.adopt(published(0), -1));

  if (failures.length) throw new Error(`${failures.length} section seam failures:\n${failures.join("\n")}`);
};

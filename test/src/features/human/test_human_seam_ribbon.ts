import { AutoMovieHumanBodyStrip } from "../../../../packages/human/src/generation/AutoMovieHumanBodyStrip";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieLoftChain, AutoMovieSeamStation, AutoMovieSplineCurve, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanSeam } from "../../../../packages/human/src/lofting/AutoMovieHumanSeam";
import type { IAutoMovieHumanSeam } from "../../../../packages/human/src/lofting/IAutoMovieHumanSeam";
import { HumanSeamObserver } from "../internal/HumanSeamObserver";

/**
 * A ribbon leaving an owner's surface by the J4 cross derivatives meets it
 * G2 for any lean, and the appendage strip built through the shared module
 * meets both its appendage and its base G2.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds a quintic ribbon from a graph surface's seam jet with `AutoMovieHumanSeam.ribbon` at shares (1.3, 0.4) and (1, 0), and an appendage strip with `AutoMovieHumanBodyStrip.controls` and `point` between a 20 mm tube on a 100 mm column (both made C2 with `AutoMovieSeamStation.continuous`) along a 25 mm root loop; reads every seam with `HumanSeamObserver.surface` from points in the plane normal to the seam. It catches a ribbon that leaves the owner's tangent plane or bends differently across the seam, and a strip whose edge rows miss either surface's position, tangent plane or normal curvature. Any ribbon passes that copies the owner's jet in the J4 form.
 * @evidence contracts/testing.md#independent-expectations Expectations are closed forms of the made defect: a second cross derivative moved by e along the owner's unit normal reads `e / |q_w perp|^2`, a first cross derivative moved by e along it reads `atan(e / |q_w perp|)`, with `q_w perp` the cross derivative's part across the seam tangent, computed here from the analytic surface; the strip's third edge row moved by e along the tube's radius reads `27 e / l^2`, the clamped cubic's second derivative `6 (P2 - 2 P1 + P0) / (2 h^2)` over three spans, with the edge speed `l = 9 |P1 - P0|`. Limits are `HumanSeamObserver.exact(40, 0.005)` for the ribbon and `exact(530, 0.01)` for the strip, a hundred times the observer's rounding at each magnitude and step (truncation on the 30 mm quintic ribbon is near 1e-8 /mm at 0.005 mm), plus a millionth of the expected reading. Oracle limit: the strip is read at the tube's knot phases, where the B-spline circle's normal is its radius exactly; the strip's edge direction is read square to the loop's skin tangent (|cos| at most 1e-7, the finite tangent's 1e-6 rad step leaving 1e-9) and turning at most 1e-3 rad per 1e-4 rad of loop (a 25 mm circle turns its normal about 1e-4 rad there).
 * @evidence contracts/testing.md#distinguishing-cases Green: two leans of the ribbon, both strip edges at five knot phases including the loop's station extremes u = 0 and pi, where a strip turned in the chart alone (phase in radians against station in mm) read a 2.3e-4 /mm curvature step, left its loop 79 degrees off square and swung 90 degrees within 1e-4 rad. Red: the ribbon's bend and tilt each moved, the strip's third row moved. Refused: a ribbon with a non-positive cross share. Guides own `test_human_seam_section`, station seams and reflection `test_human_seam_station`; that the migrated strip draws the rows it drew before is proved bit for bit outside the suite, on the committed code paths.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_seam_ribbon`; it builds analytic surfaces and chains in process and starts no host, browser or GPU.
 */
export const test_human_seam_ribbon: () => void = (): void => {
  const failures: string[] = [];
  const tolerance: HumanSeamObserver.ITolerance = HumanSeamObserver.exact(40, 0.005);
  const step: number = 0.005;

  // The owner: a graph surface, its seam at c = 0, its side at c < 0.
  const S: (a: number, c: number) => number[] = (a: number, c: number): number[] => [
    a,
    c,
    0.002 * a * a - 0.003 * c * c + 0.001 * a * c,
  ];
  const jet: (a: number) => IAutoMovieHumanSeam.ISurfaceJet = (a: number): IAutoMovieHumanSeam.ISurfaceJet => ({
    point: S(a, 0),
    along: [1, 0, 0.004 * a],
    alongSecond: [0, 0, 0.004],
    across: [0, 1, 0.001 * a],
    acrossSecond: [0, 0, -0.006],
    twist: [0, 0, 0.001],
  });
  const L: number = 30;
  const end: (a: number) => number[] = (a: number): number[] => [a, L, 5];
  const quintic: (w: number) => number[] = (w: number): number[] => [
    1 - 10 * w ** 3 + 15 * w ** 4 - 6 * w ** 5,
    w - 6 * w ** 3 + 8 * w ** 4 - 3 * w ** 5,
    0.5 * w ** 2 - 1.5 * w ** 3 + 1.5 * w ** 4 - 0.5 * w ** 5,
    10 * w ** 3 - 15 * w ** 4 + 6 * w ** 5,
  ];
  const ribbon: (alpha: number, beta: number, edit?: Edit) => (a: number, sigma: number) => number[] =
    (
      alpha: number,
      beta: number,
      edit: Edit = (q: number[][]): number[][] => q,
    ): ((a: number, sigma: number) => number[]) =>
    (a: number, sigma: number): number[] => {
      const j: IAutoMovieHumanSeam.ISurfaceJet = jet(a);
      const [qw, qww]: [number[], number[]] = AutoMovieHumanSeam.ribbon(j, alpha, beta);
      const [p, d1, d2]: number[][] = edit([j.point, qw, qww], a);
      const h: number[] = quintic(sigma / L);
      const x: number[] = end(a);
      return [0, 1, 2].map((k: number): number => h[0]! * p![k]! + h[1]! * d1![k]! + h[2]! * d2![k]! + h[3]! * x[k]!);
    };
  const owner: (a: number, sigma: number) => number[] = (a: number, sigma: number): number[] => S(a, -sigma);
  const places: number[] = [-12, 0, 17];
  for (const [alpha, beta] of [[1.3, 0.4], [1, 0]] as [number, number][])
    failures.push(
      ...HumanSeamObserver.audit(
        places.map(
          (a: number): HumanSeamObserver.IReading =>
            HumanSeamObserver.surface(`ribbon ${alpha}, ${beta}`, `a ${a}`, owner, ribbon(alpha, beta), a, step),
        ),
        "G2",
        tolerance,
      ),
    );

  // Made defects along the owner's unit normal, against closed forms.
  const unitNormal: (a: number) => number[] = (a: number): number[] => {
    const j: IAutoMovieHumanSeam.ISurfaceJet = jet(a);
    const n: number[] = cross(j.along, j.across);
    return scale(n, 1 / Math.hypot(...n));
  };
  const across: (a: number, alpha: number, beta: number) => number = (a: number, alpha: number, beta: number): number => {
    const j: IAutoMovieHumanSeam.ISurfaceJet = jet(a);
    const qw: number[] = AutoMovieHumanSeam.ribbon(j, alpha, beta)[0];
    const T: number[] = scale(j.along, 1 / Math.hypot(...j.along));
    const lean: number = dot(qw, T);
    return Math.hypot(...qw.map((v: number, k: number): number => v - lean * T[k]!));
  };
  const e: number = 0.01;
  for (const a of places) {
    const bent: HumanSeamObserver.IReading = HumanSeamObserver.surface(
      "bent ribbon",
      `a ${a}`,
      owner,
      ribbon(1.3, 0.4, ([p, d1, d2]: number[][], x: number): number[][] => [
        p!,
        d1!,
        d2!.map((v: number, k: number): number => v + e * unitNormal(x)[k]!),
      ]),
      a,
      step,
    );
    const want: number = e / across(a, 1.3, 0.4) ** 2;
    if (!(Math.abs(bent.curvature - want) <= tolerance.curvature + 1e-6 * want))
      failures.push(`bent ribbon at ${a}: curvature step ${bent.curvature}, expected ${want}`);
    const tilted: HumanSeamObserver.IReading = HumanSeamObserver.surface(
      "tilted ribbon",
      `a ${a}`,
      owner,
      ribbon(1.3, 0.4, ([p, d1, d2]: number[][], x: number): number[][] => [
        p!,
        d1!.map((v: number, k: number): number => v + e * unitNormal(x)[k]!),
        d2!,
      ]),
      a,
      step,
    );
    const tilt: number = Math.atan(e / across(a, 1.3, 0.4));
    if (!(Math.abs(tilted.angle - tilt) <= tolerance.angle + 1e-6 * tilt))
      failures.push(`tilted ribbon at ${a}: angle ${tilted.angle}, expected ${tilt}`);
  }
  try {
    AutoMovieHumanSeam.ribbon(jet(0), 0, 1);
    failures.push("a ribbon with cross share 0 was accepted");
  } catch {
    // Expected.
  }

  // The appendage strip: a 20 mm tube along +x rooted on a 100 mm column.
  const N: number = 16;
  const rho: number = 6 / (4 + 2 * Math.cos((2 * Math.PI) / N));
  const circle: (radius: number) => number[] = (radius: number): number[] => [
    ...Array.from({ length: N }, (_: unknown, i: number): number => radius * rho * Math.cos((2 * Math.PI * i) / N)),
    ...Array.from({ length: N }, (_: unknown, i: number): number => radius * rho * Math.sin((2 * Math.PI * i) / N)),
  ];
  const chain: (name: string, layers: IAutoMovieLoftChain.ILayer[]) => IAutoMovieLoftChain = (
    name: string,
    layers: IAutoMovieLoftChain.ILayer[],
  ): IAutoMovieLoftChain =>
    AutoMovieSeamStation.continuous({ name, basis: "spline", order: N, rule: "polar", samples: 64, layers });
  const base: IAutoMovieLoftChain = chain(
    "column",
    [300, 400, 500, 600, 700].map((y: number): IAutoMovieLoftChain.ILayer => ({
      y,
      frame: { origin: [0, y, 0], u: [1, 0, 0], v: [0, 0, 1] },
      coefficients: circle(100),
      slopes: new Array<number>(2 * N).fill(0),
    })),
  );
  const tube: IAutoMovieLoftChain = chain(
    "tube",
    [0, 40, 80].map((s: number): IAutoMovieLoftChain.ILayer => ({
      y: s,
      frame: { origin: [130 + s, 500, 0], u: [0, 1, 0], v: [0, 0, 1] },
      coefficients: circle(20),
      slopes: new Array<number>(2 * N).fill(0),
    })),
  );
  const loop: (u: number) => [number, number] = (u: number): [number, number] => [
    500 + 25 * Math.cos(u),
    0.25 * Math.sin(u),
  ];
  const root: IAutoMovieHumanBodyCalibration.IAppendage = {
    chain: "tube",
    end: "bottom",
    base: "column",
    root: [
      ...Array.from({ length: N }, (_: unknown, i: number): number => 500 + 25 * rho * Math.cos((2 * Math.PI * i) / N)),
      ...Array.from({ length: N }, (_: unknown, i: number): number => 0.25 * rho * Math.sin((2 * Math.PI * i) / N)),
    ],
    reach: 1,
  };

  // Turning sense of the loop in the (phase, station) plane, by its area.
  let area: number = 0;
  for (let k: number = 0; k < 64; k++) {
    const [s0, t0]: [number, number] = loop((2 * Math.PI * k) / 64);
    const [s1, t1]: [number, number] = loop((2 * Math.PI * (k + 1)) / 64);
    area += t0 * s1 - t1 * s0;
  }
  const sense: number = area >= 0 ? 1 : -1;
  const rows: (u: number) => number[][] = (u: number): number[][] =>
    AutoMovieHumanBodyStrip.controls(base, tube, root, u, sense);
  const strip: (edit?: Edit) => (u: number, w: number) => number[] =
    (edit: Edit = (r: number[][]): number[][] => r): ((u: number, w: number) => number[]) =>
    (u: number, w: number): number[] =>
      AutoMovieHumanBodyStrip.point(edit(rows(u), u) as [number, number, number][], w);
  const phase: (a: number) => number = (a: number): number => a / 20;
  const tubeSide: (a: number, sigma: number) => number[] = (a: number, sigma: number): number[] =>
    AutoMovieLoftChain.ring(tube, sigma, [phase(a)])[0]!;

  // The base side follows the root loop the strip itself reads, its spline,
  // and leaves it away from the loop's centre.
  const baseSide: (a: number, sigma: number) => number[] = (a: number, sigma: number): number[] => {
    const [s, t]: [number, number, number, number] = AutoMovieSplineCurve.evaluate(root.root, N, phase(a));
    return AutoMovieLoftChain.ring(base, s + (sigma * (s - 500)) / 25, [t + (0.01 * sigma * t) / 0.25])[0]!;
  };
  const wide: HumanSeamObserver.ITolerance = HumanSeamObserver.exact(530, 0.01);
  const span: number = 40;

  // Every fourth knot phase, the loop's station extremes u = 0 and pi among them.
  const knots: number[] = [0, 2, 5, 8, 11].map((i: number): number => (20 * 2 * Math.PI * i) / N);
  const fromTube: (s: (u: number, w: number) => number[]) => (a: number, sigma: number) => number[] =
    (s: (u: number, w: number) => number[]): ((a: number, sigma: number) => number[]) =>
    (a: number, sigma: number): number[] =>
      s(phase(a), sigma / span);
  const fromBase: (s: (u: number, w: number) => number[]) => (a: number, sigma: number) => number[] =
    (s: (u: number, w: number) => number[]): ((a: number, sigma: number) => number[]) =>
    (a: number, sigma: number): number[] =>
      s(phase(a), 1 - sigma / span);
  failures.push(
    ...HumanSeamObserver.audit(
      knots.flatMap((a: number): HumanSeamObserver.IReading[] => [
        HumanSeamObserver.surface("tube | strip", `phase ${phase(a)}`, tubeSide, fromTube(strip()), a, 0.01),
        HumanSeamObserver.surface("column | strip", `phase ${phase(a)}`, baseSide, fromBase(strip()), a, 0.01),
      ]),
      "G2",
      wide,
    ),
  );

  // The strip leaves the base square to the loop on the skin, and its cross
  // direction turns smoothly: the loop's tangent on the skin against the
  // edge's first row difference, at 64 phases and 1e-4 rad apart.
  const edge: (u: number) => number[] = (u: number): number[] => {
    const r: number[][] = rows(u);
    return r[r.length - 1]!.map((v: number, k: number): number => v - r[r.length - 2]![k]!);
  };
  const on: (u: number) => number[] = (u: number): number[] => rows(u)[rows(u).length - 1]!;
  const cosine: (a: number[], b: number[]) => number = (a: number[], b: number[]): number =>
    dot(a, b) / (Math.hypot(...a) * Math.hypot(...b));
  let worstSquare: number = 0;
  let worstTurn: number = 0;
  for (let k: number = 0; k < 64; k++) {
    const u: number = (2 * Math.PI * k) / 64;
    const tangent: number[] = on(u + 1e-6).map((v: number, c: number): number => v - on(u - 1e-6)[c]!);
    worstSquare = Math.max(worstSquare, Math.abs(cosine(edge(u), tangent)));
    worstTurn = Math.max(worstTurn, Math.acos(Math.min(1, cosine(edge(u), edge(u + 1e-4)))));
  }
  if (!(worstSquare <= 1e-7)) failures.push(`strip leaves the base off square to its loop: |cos| ${worstSquare}`);
  if (!(worstTurn <= 1e-3)) failures.push(`strip's cross direction turns ${worstTurn} rad within 1e-4 rad of loop`);

  // The third edge row moved along the tube's radius at a knot phase.
  for (const a of knots) {
    const u: number = phase(a);
    const radial: number[] = [0, Math.cos(u), Math.sin(u)];
    const moved: (u: number, w: number) => number[] = strip((r: number[][], x: number): number[][] => {
      const out: number[][] = r.map((p: number[]): number[] => [...p]);
      const n: number[] = [0, Math.cos(x), Math.sin(x)];
      out[2] = out[2]!.map((v: number, k: number): number => v + e * n[k]!);
      return out;
    });
    const r0: number[][] = rows(u);
    const l: number = 9 * Math.hypot(...r0[1]!.map((v: number, k: number): number => v - r0[0]![k]!));
    const got: HumanSeamObserver.IReading = HumanSeamObserver.surface(
      "tube | moved strip",
      `phase ${u}`,
      tubeSide,
      fromTube(moved),
      a,
      0.01,
    );
    const want: number = (27 * e * dot(radial, radial)) / (l * l);
    if (!(Math.abs(got.curvature - want) <= wide.curvature + 1e-6 * want))
      failures.push(`moved strip row at ${u}: curvature step ${got.curvature}, expected ${want}`);
  }

  if (failures.length) throw new Error(`${failures.length} ribbon seam failures:\n${failures.join("\n")}`);
};

/** An edit of a ribbon's or strip's rows at a place along its seam. */
type Edit = (q: number[][], a: number) => number[][];

/** Cross product. */
function cross(a: number[], b: number[]): number[] {
  return [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
}

/** Dot product. */
function dot(a: number[], b: number[]): number {
  return a.reduce((s: number, x: number, k: number): number => s + x * b[k]!, 0);
}

/** Scalar multiple. */
function scale(a: number[], s: number): number[] {
  return a.map((x: number): number => x * s);
}

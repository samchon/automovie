import { AutoMovieMeshExtract as X } from "@automovie/engine";

/** An independent cubic Hermite, written here from its factored basis functions. */
function hermite(s0: number, v0: number, m0: number, s1: number, v1: number, m1: number, s: number): number {
  const h: number = s1 - s0;
  const u: number = (s - s0) / h;
  return (1 + 2 * u) * (1 - u) ** 2 * v0 + u * (1 - u) ** 2 * h * m0 + u * u * (3 - 2 * u) * v1 + u * u * (u - 1) * h * m1;
}

/** The largest distance of a dense loop from its knots' spans, on the loop's own chord-length parameter. */
function deviation(dense: [number, number][], loop: { knots: X.ILoopKnot[]; length: number }): number {
  const t: number[] = [0];
  for (let j: number = 1; j < dense.length; ++j) t.push(t[j - 1]! + Math.hypot(dense[j]![0] - dense[j - 1]![0], dense[j]![1] - dense[j - 1]![1]));
  let worst: number = 0;
  for (let k: number = 0; k < loop.knots.length; ++k) {
    const a: X.ILoopKnot = loop.knots[k]!;
    const b: X.ILoopKnot = loop.knots[(k + 1) % loop.knots.length]!;
    const tb: number = b.t > a.t ? b.t : b.t + loop.length;
    for (let i: number = a.index; i !== b.index; i = (i + 1) % dense.length) {
      const ti: number = t[i]! < a.t ? t[i]! + loop.length : t[i]!;
      const x: number = hermite(a.t, a.point[0], a.tangent[0], tb, b.point[0], b.tangent[0], ti);
      const y: number = hermite(a.t, a.point[1], a.tangent[1], tb, b.point[1], b.tangent[1], ti);
      worst = Math.max(worst, Math.hypot(x - dense[i]![0], y - dense[i]![1]));
    }
  }
  return worst;
}

/** A deterministic uniform stream in [0, 1): the Park-Miller minimal standard generator. */
function stream(seed: number): () => number {
  let state: number = seed;
  return (): number => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

/** A 64-gon of radius 20 mm, each vertex's radius moved by `ripple(i)`. */
function polygon(ripple: (i: number) => number): [number, number][] {
  return Array.from({ length: 64 }, (_: unknown, i: number): [number, number] => {
    const r: number = 20 + ripple(i);
    return [r * Math.cos((2 * Math.PI * i) / 64), r * Math.sin((2 * Math.PI * i) / 64)];
  });
}

/**
 * A dense closed loop reduces to its fewest Hermite knots within the
 * tolerance, keeping its axis extremes and ignoring facet noise.
 *
 * Scenarios:
 * 1. Ellipse: a dense 30 by 20 mm ellipse reduces to fewer than 40 knots holding its four axis extremes, every dense point within 0.5 mm of the independently evaluated knots; a tighter tolerance keeps more; a pinned landmark is kept.
 * 2. Facets: a faceted 20 mm circle (a 64-gon) with a 0.2 mm facet ripple reduces to fewer than 10 knots within 0.5 mm, both for radii alternating +-0.1 mm (turning left and right at every vertex) and for radii moved by uniform noise in +-0.1 mm (a faceted reference section), and for a 20 mm circle sampled every 0.25 mm with the same noise (crossings close together). Red: tangents left at the noisy points' central differences, without the least-squares refit, keep many more knots on the dense circle.
 * 3. Profile curve: reduced circles of radius `20 + s / 10` at stations 0, 50 and 100 mm, sampled from different starting angles and the middle one clockwise, give a family over [0, 100] with period 1 whose clock 0 is the +a side, 0.25 the +b side (counter-clockwise), 0.5 the -a side and 1.25 wraps to 0.25 at every station within 0.5 mm, with station derivative (0.1, 0) and clock derivative (0, 2 pi r) at clock 0. Red: the origin or the orientation left as sampled.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `reduceLoop` and `profileCurve` of `AutoMovieMeshExtract` on made loops and reads the knots, their distance and the family's points and jets.
 * @evidence contracts/testing.md#independent-expectations Distances are re-measured from the knots with a Hermite written here on a chord-length parameter computed here; the axis extremes of the ellipse are its samples at 0, 90, 180 and 270 degrees; a circle needs few cubic spans at 0.5 mm; the circles' radius is linear in station, so their points at a fixed angle and its derivatives are analytic.
 * @evidence contracts/testing.md#distinguishing-cases Loose and tight tolerances; a pinned landmark; a smooth loop against regular and random facet ripples of the same amplitude.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include geometry_extract_loop`, on made loops with no person, reference file, loft or browser.
 */
export function test_geometry_extract_loop(): void {
  const failures: string[] = [];

  // 1. Ellipse.
  const ellipse: [number, number][] = Array.from({ length: 360 }, (_: unknown, i: number): [number, number] => [30 * Math.cos((2 * Math.PI * i) / 360), 20 * Math.sin((2 * Math.PI * i) / 360)]);
  const loop: { knots: X.ILoopKnot[]; length: number; error: number } = X.reduceLoop(ellipse, 0.5);
  for (const i of [0, 90, 180, 270]) if (!loop.knots.some((k: X.ILoopKnot): boolean => k.index === i)) failures.push(`the ellipse's axis extreme ${i} was removed`);
  if (!(deviation(ellipse, loop) <= 0.5)) failures.push(`the reduced ellipse deviates ${deviation(ellipse, loop)} mm`);
  if (!(loop.knots.length < 40)) failures.push(`the ellipse keeps ${loop.knots.length} knots`);
  if (!(X.reduceLoop(ellipse, 1e-4).knots.length > loop.knots.length)) failures.push("a tighter loop tolerance does not keep more knots");
  if (!X.reduceLoop(ellipse, 0.5, [45]).knots.some((k: X.ILoopKnot): boolean => k.index === 45)) failures.push("a pinned loop landmark was removed");

  // 2. Facets.
  const random: () => number = stream(20261108);
  for (const [label, dense] of [
    ["alternating", polygon((i: number): number => (i % 2 === 0 ? 0.1 : -0.1))],
    ["random", polygon((): number => 0.2 * (random() - 0.5))],
    // Crossings close together: a 20 mm circle sampled every 0.25 mm with the same noise.
    [
      "densely sampled",
      Array.from({ length: 512 }, (_: unknown, i: number): [number, number] => {
        const r: number = 20 + 0.2 * (random() - 0.5);
        return [r * Math.cos((2 * Math.PI * i) / 512), r * Math.sin((2 * Math.PI * i) / 512)];
      }),
    ],
  ] as const) {
    const faceted: { knots: X.ILoopKnot[]; length: number; error: number } = X.reduceLoop(dense, 0.5);
    if (!(faceted.knots.length < 10 && deviation(dense, faceted) <= 0.5)) failures.push(`the ${label} rippled 64-gon keeps ${faceted.knots.length} knots, deviation ${deviation(dense, faceted)}`);
  }

  // 3. Profile curve: circles of radius 20 + s / 10 at stations 0, 50 and
  // 100 mm, sampled from different starting angles, the middle one clockwise.
  const circle = (radius: number, start: number, sign: number): [number, number][] =>
    Array.from({ length: 360 }, (_: unknown, i: number): [number, number] => {
      const angle: number = start + (sign * 2 * Math.PI * i) / 360;
      return [radius * Math.cos(angle), radius * Math.sin(angle)];
    });
  const family = X.profileCurve(
    [
      [0, 1.3, 1],
      [50, 4.1, -1],
      [100, 2.2, 1],
    ].map(([station, start, sign]: number[]): X.IStationLoop => ({ station: station!, loop: X.reduceLoop(circle(20 + station! / 10, start!, sign!), 0.05) })),
  );
  if (!(family.domain[0] === 0 && family.domain[1] === 100 && family.period === 1)) failures.push(`the profile curve's domain ${family.domain} and period ${family.period}`);
  for (const station of [0, 25, 50, 75, 100]) {
    const r: number = 20 + station / 10;
    for (const [clock, x, y] of [
      [0, r, 0],
      [0.25, 0, r],
      [0.5, -r, 0],
      [1.25, 0, r],
    ] as const) {
      const p: [number, number] = family.point(station, clock);
      if (!(Math.hypot(p[0] - x, p[1] - y) <= 0.5)) failures.push(`the profile at station ${station}, clock ${clock} reads ${p}, expected ${x}, ${y}`);
    }
    const jet = family.jet(station, 0);
    // d point / d station of radius 20 + s / 10 at angle 0 is (0.1, 0); d point / d clock is (0, 2 pi r).
    if (jet === null || !(Math.hypot(jet.s[0] - 0.1, jet.s[1]) <= 0.02 && Math.hypot(jet.t[0], jet.t[1] - 2 * Math.PI * r) <= 0.02 * 2 * Math.PI * r)) failures.push(`the profile's jet at station ${station}, clock 0: ${JSON.stringify(jet)}`);
  }
  if (failures.length !== 0) throw new Error(`${failures.length} loop reduction failures:\n${failures.join("\n")}`);
}

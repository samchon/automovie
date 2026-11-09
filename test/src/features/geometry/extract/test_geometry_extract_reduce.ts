import { AutoMovieMeshExtract as X } from "@automovie/engine";

/** An independent cubic Hermite, written here from its factored basis functions. */
function hermite(
  s0: number,
  v0: number,
  m0: number,
  s1: number,
  v1: number,
  m1: number,
  s: number,
): number {
  const h: number = s1 - s0;
  const u: number = (s - s0) / h;
  return (
    (1 + 2 * u) * (1 - u) ** 2 * v0 +
    u * (1 - u) ** 2 * h * m0 +
    u * u * (3 - 2 * u) * v1 +
    u * u * (u - 1) * h * m1
  );
}

/** The largest deviation of a dense run from its knots' spans, measured with the Hermite above. */
function deviation(run: [number, number][], knots: X.IKnot[]): number {
  let worst: number = 0;
  for (let k: number = 0; k + 1 < knots.length; ++k) {
    const a: X.IKnot = knots[k]!;
    const b: X.IKnot = knots[k + 1]!;
    for (let i: number = a.index; i <= b.index; ++i)
      worst = Math.max(
        worst,
        Math.abs(
          run[i]![1] -
            hermite(a.s, a.value, a.slope, b.s, b.value, b.slope, run[i]![0]),
        ),
      );
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

/**
 * A dense run reduces to its fewest Hermite knots within the tolerance,
 * keeping its prominent features and ignoring facet noise.
 *
 * Scenarios:
 * 1. Shape: a dense run of `100 s^3` on [-1, 1] keeps its ends and its inflection, holds 0.5 mm checked by an independent Hermite with at most 6 knots, and a pinned landmark is kept; `10 sin s` on [0, 2 pi] keeps both extrema and its inflection, and a tighter tolerance keeps more knots.
 * 2. Exclusion: a flat run with a 20 mm spike sample keeps the spike as a knot, and with the spike excluded reduces to its two ends within 0.5 mm.
 * 3. Facet noise: a flat run with a 0.2 mm alternating ripple (an extremum and an inflection at every sample) reduces to fewer than 10 knots within 0.5 mm; `30 + 10 sin(s / 40)` over 200 mm sampled every millimetre with uniform noise in +-0.1 mm (a faceted reference's extreme against station) reduces to fewer than 12 knots within 0.5 mm, keeping its highest sample; sampled every 0.25 mm (crossings close together) it still reduces to fewer than 12 knots. Red: slopes left at the noisy samples' central differences, without the least-squares refit, keep many more knots on the dense run.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `reduce` of `AutoMovieMeshExtract` on made runs and reads the knots and their deviation.
 * @evidence contracts/development/testing.md#independent-expectations Deviations are re-measured from the knots with a Hermite written here, not the module's; the feature positions are those of the analytic cubic and sine; the knot bounds follow from a smooth curve needing few cubic spans at 0.5 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Loose and tight tolerances; a pinned landmark; an excluded and a kept spike; prominent extrema and inflections against facet ripples of the same shape, regular and random.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include geometry_extract_reduce`, on made runs with no person, reference file, loft or browser.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Shape: a dense run of `100 s^3` on [-1, 1] keeps its ends and its inflection, holds 0.5 mm checked by an independent Hermite with at most...).
 */
export function test_geometry_extract_reduce(): void {
  const failures: string[] = [];

  // 1. Shape.
  const cubic: [number, number][] = Array.from(
    { length: 201 },
    (_: unknown, i: number): [number, number] => {
      const s: number = -1 + i / 100;
      return [s, 100 * s ** 3];
    },
  );
  const loose: { knots: X.IKnot[]; error: number } = X.reduce(cubic, 0.5);
  if (!(deviation(cubic, loose.knots) <= 0.5))
    failures.push(
      `the reduced cubic deviates ${deviation(cubic, loose.knots)} mm`,
    );
  if (!(loose.knots[0]!.index === 0 && loose.knots.at(-1)!.index === 200))
    failures.push("the run's ends were removed");
  if (!loose.knots.some((k: X.IKnot): boolean => Math.abs(k.s) <= 0.011))
    failures.push("the cubic's inflection at 0 was removed");
  if (!(loose.knots.length <= 6))
    failures.push(`the cubic keeps ${loose.knots.length} knots at 0.5 mm`);
  if (
    !X.reduce(cubic, 0.5, [150]).knots.some(
      (k: X.IKnot): boolean => k.index === 150,
    )
  )
    failures.push("a pinned landmark was removed");
  const sine: [number, number][] = Array.from(
    { length: 629 },
    (_: unknown, i: number): [number, number] => [
      i / 100,
      10 * Math.sin(i / 100),
    ],
  );
  const wave: X.IKnot[] = X.reduce(sine, 0.5).knots;
  for (const [label, at] of [
    ["maximum", Math.PI / 2],
    ["minimum", (3 * Math.PI) / 2],
    ["inflection", Math.PI],
  ] as const)
    if (!wave.some((k: X.IKnot): boolean => Math.abs(k.s - at) <= 0.011))
      failures.push(`the sine's ${label} was removed`);
  if (!(deviation(sine, wave) <= 0.5))
    failures.push(`the reduced sine deviates ${deviation(sine, wave)}`);
  if (!(X.reduce(sine, 1e-4).knots.length > wave.length))
    failures.push("a tighter tolerance does not keep more knots");

  // 2. Exclusion.
  const spiked: [number, number][] = Array.from(
    { length: 101 },
    (_: unknown, i: number): [number, number] => [i, i === 50 ? 20 : 0],
  );
  if (
    !X.reduce(spiked, 0.5).knots.some((k: X.IKnot): boolean => k.index === 50)
  )
    failures.push(
      "the unexcluded spike sample is not kept (the run cannot hold it)",
    );
  const cleaned: { knots: X.IKnot[]; error: number } = X.reduce(
    spiked,
    0.5,
    [],
    [50],
  );
  if (
    cleaned.knots.some((k: X.IKnot): boolean => k.index === 50) ||
    !(cleaned.error <= 0.5) ||
    cleaned.knots.length !== 2
  )
    failures.push(
      `the excluded spike leaves ${cleaned.knots.length} knots, error ${cleaned.error}`,
    );

  // 3. Facet noise.
  const ripple: [number, number][] = Array.from(
    { length: 201 },
    (_: unknown, i: number): [number, number] => [i, i % 2 === 0 ? 0.1 : -0.1],
  );
  const calm: X.IKnot[] = X.reduce(ripple, 0.5).knots;
  if (!(calm.length < 10 && deviation(ripple, calm) <= 0.5))
    failures.push(
      `the rippled flat run keeps ${calm.length} knots, deviation ${deviation(ripple, calm)}`,
    );
  const random: () => number = stream(20261108);
  const noisy: [number, number][] = Array.from(
    { length: 201 },
    (_: unknown, i: number): [number, number] => [
      i,
      30 + 10 * Math.sin(i / 40) + 0.2 * (random() - 0.5),
    ],
  );
  const faceted: X.IKnot[] = X.reduce(noisy, 0.5).knots;
  const top: number = Math.max(
    ...noisy.map((p: [number, number]): number => p[1]),
  );
  if (!(faceted.length < 12 && deviation(noisy, faceted) <= 0.5))
    failures.push(
      `the noisy sine keeps ${faceted.length} of 201 knots, deviation ${deviation(noisy, faceted)}`,
    );
  if (!faceted.some((k: X.IKnot): boolean => k.value === top))
    failures.push("the noisy sine's highest sample was removed");
  // Crossings close together (a cut near a ring puts a diagonal crossing
  // beside a vertical one): the same noisy sine sampled every 0.25 mm, where
  // a central difference over 0.5 mm turns +-0.1 mm of noise into +-0.4 of slope.
  const fine: [number, number][] = Array.from(
    { length: 801 },
    (_: unknown, i: number): [number, number] => [
      i / 4,
      30 + 10 * Math.sin(i / 160) + 0.2 * (random() - 0.5),
    ],
  );
  const dense: X.IKnot[] = X.reduce(fine, 0.5).knots;
  if (!(dense.length < 12 && deviation(fine, dense) <= 0.5))
    failures.push(
      `the densely sampled noisy sine keeps ${dense.length} of 801 knots, deviation ${deviation(fine, dense)}`,
    );
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} run reduction failures:\n${failures.join("\n")}`,
    );
}

import {
  AutoMovieLoftSectionBoundary,
  AutoMovieLoftSectionLegacy,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  type IAutoMovieViewPart,
} from "@automovie/engine";

/** Physical station value/first/second, supplied independently of the implementation algebra. */
type Scalar = readonly [number, number, number];

/** Independent scalar-law and cap-support questions within the one final phase unit. */
export namespace ConstructionLoftSectionBoundary {
  /** Gather cap rounding, explicit scalar continuation and finite-capability findings together. */
  export function observe(failures: string[], input: IAutoMovieViewPart): void {
    for (const [name, run] of [
      ["cap support", (): void => caps(failures, input)],
      ["scalar boundary", (): void => bridge(failures)],
      ["finite capability", (): void => finite(failures)],
    ] as const) {
      try {
        run();
      } catch (error: unknown) {
        failures.push(
          `${name}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}

/** Expanded quintic derivatives distinguish support from a rounded primal zero. */
function caps(failures: string[], input: IAutoMovieViewPart): void {
  const h: number = 2 ** -20;
  const y: number = 2 ** -20;

  // Keep the same tiny cap support in an admitted knot span: h/end=1/2
  // satisfies the existing 1e-6 relative spline-gap premise.
  const end: number = 2 * h;
  const outline: (sign: number) => IAutoMovieViewPart.IOutline = (
    sign: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: [
      { site: "pole", station: 0, value: 0 },
      { site: "near", station: h, value: sign },
      { site: "end", station: end, value: sign },
    ],
  });
  const constant: IAutoMovieViewPart.IOutline = {
    knots: [
      { site: "start", station: 0, value: 0.3 },
      { site: "end", station: end, value: 0.3 },
    ],
  };
  const part: IAutoMovieViewPart = {
    ...input,
    pole: "bottom",
    stations: [0, h, end],
    front: { positive: outline(1), negative: outline(-1) },
    side: { positive: outline(1), negative: outline(-1) },
    fullness: { kind: "shoulder", shoulder: constant },
  };
  const admitted: AutoMovieLoftViewSource.IResult | null =
    AutoMovieLoftViewSource.create(part);
  if (admitted === null || admitted.source === null)
    throw new Error(
      `The cap fixture has no original scalar source: ${JSON.stringify(admitted?.diagnostics)}`,
    );
  const source: AutoMovieLoftViewSource.ISource = admitted.source;
  const station: number = h * (1 - y);
  const reading: AutoMovieLoftViewRead.IJets | string =
    AutoMovieLoftViewRead.jets(source, station);
  if (typeof reading === "string") throw new Error(reading);
  const difference: number = Math.SQRT2 - 1 - 0.3;
  const q: number = 10 * y ** 3 - 15 * y ** 4 + 6 * y ** 5;
  const first: number = -(30 * y ** 2 - 60 * y ** 3 + 30 * y ** 4) / h;
  const second: number = (60 * y - 180 * y ** 2 + 120 * y ** 3) / (h * h);
  check(
    reading.shoulders[0]!,
    [0.3 + q * difference, first * difference, second * difference],
    "near-far cap source2",
    failures,
  );
  const rounded: number =
    1 - (1 - y) ** 3 * (10 - 15 * (1 - y) + 6 * (1 - y) ** 2);
  if (Math.abs(rounded - q) <= 0.5 * q)
    failures.push(
      "The cap fixture no longer distinguishes the old rounded small weight.",
    );
  const malformed: AutoMovieLoftViewSource.ISource = {
    ...source,
    caps: [
      { pole: 0, near: end, span: end },
      { pole: end, near: 0, span: end },
    ],
  };
  for (const read of [
    AutoMovieLoftViewRead.values,
    AutoMovieLoftViewRead.jets,
  ]) {
    const result: ReturnType<typeof read> = read(malformed, h);
    if (typeof result !== "string" || !result.includes("overlap"))
      failures.push(
        "Overlapping present cap supports lost their named admission failure.",
      );
  }
  const constantCap: AutoMovieLoftViewSource.ISource = {
    ...malformed,
    caps: [
      { pole: 0, near: null, span: null },
      { pole: end, near: 0, span: end },
    ],
  };
  const ellipse: AutoMovieLoftViewRead.IJets | string =
    AutoMovieLoftViewRead.jets(constantCap, h);
  if (typeof ellipse === "string") throw new Error(ellipse);
  check(
    ellipse.shoulders[0]!,
    [Math.SQRT2 - 1, 0, 0],
    "constant cap maximum",
    failures,
  );
}

/** A zero-end-jet log/logit bridge has an independent expanded quintic closed form. */
function bridge(failures: string[]): void {
  const inputs: (
    extent: number,
    shoulder: number,
  ) => AutoMovieLoftViewRead.IJets = (
    extent: number,
    shoulder: number,
  ): AutoMovieLoftViewRead.IJets => ({
    extents: Array.from({ length: 4 }, (): Scalar => [extent, 0, 0]),
    shoulders: Array.from({ length: 4 }, (): Scalar => [shoulder, 0, 0]),
  });
  const a: AutoMovieLoftSectionBoundary.IEnd = {
    station: 2,
    inputs: inputs(2, 0.3),
  };
  const b: AutoMovieLoftSectionBoundary.IEnd = {
    station: 5,
    inputs: inputs(5, 0.6),
  };
  const made: AutoMovieLoftSectionBoundary.IBridge | string =
    AutoMovieLoftSectionBoundary.create(a, b);
  if (typeof made === "string") throw new Error(made);
  for (const end of [a, b]) {
    const value: AutoMovieLoftViewRead.IJets | string =
      AutoMovieLoftSectionBoundary.read(made, end.station);
    if (JSON.stringify(value) !== JSON.stringify(end.inputs))
      failures.push(
        "A scalar bridge changed an exact retained endpoint tuple.",
      );
  }
  for (const u of [0.125, 0.5, 0.875]) {
    const q: number = 10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5;
    const qs: number = (30 * u ** 2 - 60 * u ** 3 + 30 * u ** 4) / 3;
    const qss: number = (60 * u - 180 * u ** 2 + 120 * u ** 3) / 9;
    const dz: number = Math.log(5) - Math.log(2);
    const extent: number = Math.exp(Math.log(2) + dz * q);
    const du: number = Math.log(0.6 / 0.4) - Math.log(0.3 / 0.7);
    const shoulder: number =
      1 / (1 + Math.exp(-(Math.log(0.3 / 0.7) + du * q)));
    const result: AutoMovieLoftViewRead.IJets | string =
      AutoMovieLoftSectionBoundary.read(made, 2 + 3 * u);
    if (typeof result === "string") throw new Error(result);
    check(
      result.extents[0]!,
      [extent, extent * dz * qs, extent * (dz * qss + (dz * qs) ** 2)],
      "log bridge",
      failures,
    );
    check(
      result.shoulders[0]!,
      [
        shoulder,
        shoulder * (1 - shoulder) * du * qs,
        shoulder *
          (1 - shoulder) *
          (du * qss + (1 - 2 * shoulder) * (du * qs) ** 2),
      ],
      "logit bridge",
      failures,
    );
  }
  const tiny: AutoMovieLoftSectionBoundary.IBridge | string =
    AutoMovieLoftSectionBoundary.create(
      { ...a, station: 0 },
      { ...b, station: 1e-200 },
    );
  if (typeof tiny === "string") throw new Error(tiny);
  if (typeof AutoMovieLoftSectionBoundary.values(tiny, 5e-201) === "string")
    failures.push("Finite scalar bridge values incorrectly require physical2.");
  if (typeof AutoMovieLoftSectionBoundary.read(tiny, 5e-201) !== "string")
    failures.push("An unrepresentable physical bridge2 was admitted.");
}

/** Required generated rows fail explicitly, independently of finite input admission. */
function finite(failures: string[]): void {
  try {
    AutoMovieLoftSectionLegacy.extend(
      [
        [1e308, 0],
        [1e308, 0],
        [0, 0],
      ],
      1,
      1,
      0,
    );
    failures.push("An overflowing basis extension value row was admitted.");
  } catch (error: unknown) {
    if (!(error instanceof Error) || !error.message.includes("finite value"))
      failures.push("Basis extension overflow lost its named value failure.");
  }
}

/** Compare independent closed values with a relative arithmetic budget, never a sampled derivative. */
function check(
  actual: readonly number[],
  expected: readonly number[],
  name: string,
  failures: string[],
): void {
  if (
    actual.length !== expected.length ||
    actual.some(
      (value: number, q: number): boolean =>
        !Number.isFinite(value) ||
        Math.abs(value - expected[q]!) >
          1e-9 * Math.max(1, Math.abs(expected[q]!)),
    )
  )
    failures.push(`${name}: actual ${actual}, expected ${expected}`);
}

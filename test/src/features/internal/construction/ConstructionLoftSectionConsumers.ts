import {
  AutoMovieConstructionContinuation,
  AutoMovieLoftChain,
  AutoMovieLoftFrame,
  AutoMovieLoftJet,
  AutoMovieLoftSectionConnect,
  AutoMovieLoftSectionSource,
  type AutoMovieLoftViewRead,
  AutoMovieViewLoft,
  type IAutoMovieLoftChain,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { ConstructionConicFieldOracle } from "./ConstructionConicFieldOracle";

/** One physical station jet, independently authored at source knots. */
type Scalar = readonly [number, number, number];

/** Actual producer/consumer questions supplementing the unchanged final phase expectations. */
export namespace ConstructionLoftSectionConsumers {
  /** Gather source2, all end signs, mixed rounding, finite Point0 and cache/copy observations. */
  export function observe(failures: string[], input: IAutoMovieViewPart): void {
    for (const [name, run] of [
      ["actual scalar2", (): void => original(failures, input)],
      ["continuation", (): void => continuation(failures, input)],
      ["mixed small weight", (): void => mixed(failures)],
      ["point availability", (): void => availability(failures, input)],
      ["copy and retention", (): void => copies(failures, input)],
    ] as const) {
      try {
        run();
      } catch (error: unknown) {
        failures.push(
          `${name}: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
        );
      }
    }
  }
}

/** The implicit ellipse supplies six closed radial derivatives, independently of native lifting. */
function original(failures: string[], input: IAutoMovieViewPart): void {
  const outline: (sign: number) => IAutoMovieViewPart.IOutline = (
    sign: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: [
      {
        site: "start",
        station: 0,
        value: sign,
        jet: { first: 0, second: 2 * sign },
      },
      {
        site: "end",
        station: 1,
        value: 2 * sign,
        jet: { first: 2 * sign, second: 2 * sign },
      },
    ],
  });
  const chain: IAutoMovieLoftChain = made({
    ...input,
    front: { positive: outline(1), negative: outline(-1) },
  });
  for (const s of [0, 0.125, 0.5, 0.875, 1])
    for (const phi of [-0.37, 0, 0.41, 1.9, 4.3, 7.1]) {
      const expected: readonly number[] = ConstructionConicFieldOracle.ellipse(
        [1 + s * s, 2 * s, 2],
        [2, 0, 0],
        phi,
      );
      const jet: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(chain, s, phi);
      const c: number = Math.cos(phi);
      const t: number = Math.sin(phi);
      const radial: (row: readonly number[]) => number = (
        row: readonly number[],
      ): number => row[0]! * c + row[2]! * t;
      const actual: number[] = [
        radial(jet.p),
        radial(jet.s),
        radial(jet.t),
        radial(jet.ss),
        radial(jet.st),
        radial(jet.tt) + radial(jet.p),
      ];
      close(
        actual,
        expected,
        3e-8,
        `actual original radial6 ${s}/${phi}`,
        failures,
      );
      close(
        [jet.t[2] * c - jet.t[0] * t, jet.st[2] * c - jet.st[0] * t],
        [expected[0]!, expected[1]!],
        3e-8,
        "orthogonal phase components",
        failures,
      );
    }
}

/** Boundary equalities use the unchanged host and the declared station/phase signs. */
function continuation(failures: string[], input: IAutoMovieViewPart): void {
  const host: IAutoMovieLoftChain = made(input);
  const child: IAutoMovieLoftChain = made({
    ...input,
    name: "phase.child",
    front: { positive: constant(3), negative: constant(-3) },
    side: { positive: constant(4), negative: constant(-4) },
  });
  for (const hostEnd of ["bottom", "top"] as const)
    for (const partEnd of ["bottom", "top"] as const) {
      const result: IAutoMovieLoftChain | string =
        AutoMovieConstructionContinuation.apply(host, hostEnd, child, partEnd);
      if (typeof result === "string") {
        failures.push(result);
        continue;
      }
      const sign: number = hostEnd === partEnd ? -1 : 1;
      const hs: number = hostEnd === "bottom" ? 0 : 1;
      const ps: number = partEnd === "bottom" ? 0 : 1;
      for (const phi of [-0.37, 0, 0.43, 2.7, 7.1]) {
        const a: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(
          host,
          hs,
          sign * phi,
        );
        const b: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(result, ps, phi);
        for (const key of ["p", "s", "t", "ss", "st", "tt"] as const) {
          const factor: number = key === "s" || key === "t" ? sign : 1;
          close(
            b[key],
            a[key].map((value: number): number => factor * value),
            5e-9,
            `shared native ${hostEnd}/${partEnd}/${key}`,
            failures,
          );
        }
        const near: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(
          result,
          ps + (partEnd === "bottom" ? 1 : -1) * 2 ** -24,
          phi,
        );
        for (const key of ["p", "s", "t", "ss", "st", "tt"] as const)
          close(
            near[key],
            b[key],
            1e-3,
            `adjacent native ${hostEnd}/${partEnd}/${key}`,
            failures,
          );
      }
    }
}

/** An independently expanded tiny quintic weight must survive a rounded complementary one. */
function mixed(failures: string[]): void {
  const inputs: AutoMovieLoftViewRead.IJets = {
    extents: Array.from({ length: 4 }, (): Scalar => [1, 0, 0]),
    shoulders: Array.from({ length: 4 }, (): Scalar => [Math.SQRT2 - 1, 0, 0]),
  };
  const bottom: IAutoMovieLoftChain.ILayer = layer(0, 1);
  const top: IAutoMovieLoftChain.ILayer = layer(1, 1e16);
  bottom.sectionSource = AutoMovieLoftSectionSource.bind(bottom, {
    kind: "native",
    inputs,
  });
  top.sectionSource = AutoMovieLoftSectionSource.bind(top, {
    kind: "basis",
    order: 8,
    rows: [[...top.coefficients], [...top.slopes], [...top.curvatures!]],
  });
  const chain: IAutoMovieLoftChain = AutoMovieLoftSectionConnect.finish({
    name: "phase.mixed",
    basis: "spline",
    order: 8,
    rule: "polar",
    samples: 8,
    layers: [bottom, top],
  });
  const u: number = 2 ** -20;
  const q: number = 10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5;
  const first: number = 30 * u ** 2 - 60 * u ** 3 + 30 * u ** 4;
  const second: number = 60 * u - 180 * u ** 2 + 120 * u ** 3;
  const expected: number = 1 + q * (1e16 - 1);
  const point: [number, number, number] = AutoMovieLoftChain.point(chain, u, 0);
  const jet: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(chain, u, 0);
  close(
    [point[0], jet.p[0], jet.s[0], jet.ss[0]],
    [expected, expected, first * (1e16 - 1), second * (1e16 - 1)],
    3e-10,
    "actual mixed complementary weight",
    failures,
  );
  for (const s of [0, 1]) {
    const result: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(chain, s, 0);
    close(
      [result.p[0], result.s[0], result.ss[0]],
      [s === 0 ? 1 : 1e16, 0, 0],
      1e-12,
      "mixed exact endpoint",
      failures,
    );
  }
}

/** A root-coordinate endpoint may retain finite values while physical source2 is unavailable. */
function availability(failures: string[], input: IAutoMovieViewPart): void {
  const root: (sign: number) => IAutoMovieViewPart.IOutline = (
    sign: number,
  ): IAutoMovieViewPart.IOutline => ({
    parameter: { type: "root", end: "bottom", pole: 0 },
    knots: [
      { site: "start", station: 0, value: sign },
      { site: "end", station: 1, value: 2 * sign },
    ],
  });
  const result: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create({
    ...input,
    front: { positive: root(1), negative: root(-1) },
  });
  if (result.chain === null)
    throw new Error(JSON.stringify(result.diagnostics));
  const point: [number, number, number] = AutoMovieLoftChain.point(
    result.chain,
    0,
    0.37,
  );
  const phase: ReturnType<ReturnType<typeof AutoMovieLoftChain.phaseSampler>> =
    AutoMovieLoftChain.phaseSampler(result.chain, 0)(0.37);
  if (![...point, ...phase.p, ...phase.t].every(Number.isFinite))
    failures.push("Finite root endpoint Point0/phase-only was lost.");
  try {
    AutoMovieLoftJet.at(result.chain, 0, 0.37);
    failures.push("Missing physical source2 was replaced by an analytic jet.");
  } catch (error: unknown) {
    if (!(error instanceof Error) || !error.message.includes("unavailable"))
      failures.push("Missing physical source2 lost its named premise.");
  }
}

/** Cold equal-value copies, actual coefficient rewrite rejection and caller-held samplers share no history. */
function copies(failures: string[], input: IAutoMovieViewPart): void {
  const chain: IAutoMovieLoftChain = made(input);
  const copy: IAutoMovieLoftChain = {
    ...chain,
    nativeSource: JSON.parse(
      JSON.stringify(chain.nativeSource),
    ) as AutoMovieLoftSectionSource.ISource,
    layers: chain.layers.map(
      (row: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => ({
        ...row,
        coefficients: [...row.coefficients],
        slopes: [...row.slopes],
        curvatures: row.curvatures?.slice(),
      }),
    ),
  };
  const expected: [number, number, number] = AutoMovieLoftChain.point(
    chain,
    0.37,
    0.41,
  );
  close(
    AutoMovieLoftChain.point(copy, 0.37, 0.41),
    expected,
    1e-12,
    "cold numeric copy",
    failures,
  );
  const held: ReturnType<typeof AutoMovieLoftChain.sampler> =
    AutoMovieLoftChain.sampler(chain, 0.37);
  const first: [number, number, number] = held(0.41);
  first[0] = 999;
  for (let q: number = 0; q < 10; q++) {
    AutoMovieLoftChain.point(chain, q / 10, 0.41);
    AutoMovieLoftJet.at(chain, q / 10, 0.41);
  }
  close(
    held(0.41),
    expected,
    1e-12,
    "held sampler after eviction/fresh vector",
    failures,
  );
  const stale: IAutoMovieLoftChain = {
    ...copy,
    layers: copy.layers.map(
      (row: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => ({
        ...row,
        coefficients: row.coefficients.map(
          (value: number, q: number): number => value + (q === 0 ? 1 : 0),
        ),
      }),
    ),
  };
  try {
    AutoMovieLoftChain.point(stale, 0.37, 0.41);
    failures.push("A stale present native source silently selected geometry.");
  } catch (error: unknown) {
    if (!(error instanceof Error) || !error.message.includes("rewritten"))
      failures.push("Stale native ownership lost its named failure.");
  }
}

/** The actual producer, with its diagnostic result preserved on failure. */
function made(input: IAutoMovieViewPart): IAutoMovieLoftChain {
  const result: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(input);
  if (result.chain === null)
    throw new Error(JSON.stringify(result.diagnostics));
  return result.chain;
}

/** Authored constant scalar, without a principal source reconstruction. */
function constant(value: number): IAutoMovieViewPart.IOutline {
  return {
    knots: [
      { site: "start", station: 0, value },
      { site: "end", station: 1, value },
    ],
  };
}

/** An explicit complete constant legacy basis, including actual zero station derivatives. */
function layer(y: number, x: number): IAutoMovieLoftChain.ILayer {
  return {
    y,
    coefficients: [
      ...new Array<number>(8).fill(x),
      ...new Array<number>(8).fill(0),
    ],
    slopes: new Array<number>(16).fill(0),
    curvatures: new Array<number>(16).fill(0),
    frame: AutoMovieLoftFrame.horizontal(y),
    frameSlopes: { origin: [0, 1, 0], u: [0, 0, 0], v: [0, 0, 0] },
    frameCurvatures: { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] },
  };
}

/** Value-relative binary arithmetic allowance; no derivative is estimated by differences. */
function close(
  actual: readonly number[],
  expected: readonly number[],
  budget: number,
  name: string,
  failures: string[],
): void {
  if (
    actual.length !== expected.length ||
    actual.some(
      (value: number, q: number): boolean =>
        !Number.isFinite(value) ||
        Math.abs(value - expected[q]!) >
          budget * Math.max(1, Math.abs(expected[q]!)),
    )
  )
    failures.push(`${name}: actual ${actual}, expected ${expected}`);
}

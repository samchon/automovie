import {
  AutoMovieLoftChain,
  AutoMovieLoftFrame,
  AutoMovieLoftJet,
  AutoMovieLoftSectionConnect,
  AutoMovieLoftSectionSource,
  type AutoMovieLoftViewRead,
  AutoMovieSeamStation,
  AutoMovieSolidChain,
  AutoMovieViewLoft,
  type IAutoMovieLoftChain,
  type IAutoMovieViewPart,
} from "@automovie/engine";

/** Source-aware coordinator questions, kept inside the existing final phase unit. */
export namespace ConstructionLoftSectionAdapters {
  /** Clip, exact horizontal adaptation and endpoint-only source2 are independent adapter combinations. */
  export function observe(failures: string[], input: IAutoMovieViewPart): void {
    for (const [name, run] of [
      ["clipped native coordinator", (): void => clipped(failures, input)],
      ["endpoint-only native coordinator", (): void => endpoints(failures)],
      ["missing adjoining field", (): void => incomplete(failures, input)],
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

/** Native clipping preserves the original function instead of refitting compatibility jets. */
function clipped(failures: string[], input: IAutoMovieViewPart): void {
  const outline: (sign: number) => IAutoMovieViewPart.IOutline = (
    sign: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: [
      { site: "start", station: 0, value: sign },
      { site: "middle", station: 0.5, value: 2 * sign },
      { site: "end", station: 1, value: sign },
    ],
  });
  const result: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create({
    ...input,
    stations: [0, 0.5, 1],
    front: { positive: outline(1), negative: outline(-1) },
  });
  if (result.chain === null)
    throw new Error(JSON.stringify(result.diagnostics));
  const original: IAutoMovieLoftChain = result.chain;
  const copy: IAutoMovieLoftChain = {
    ...original,
    layers: original.layers.slice(0, 2),
  };
  const continuous: IAutoMovieLoftChain = AutoMovieSeamStation.continuous(copy);
  if (continuous.nativeSource !== copy.nativeSource)
    failures.push(
      "The coordinator replaced the original clipped scalar owner.",
    );
  for (let q: number = 0; q < copy.layers.length; q++) {
    if (
      JSON.stringify([
        continuous.layers[q]!.slopes,
        continuous.layers[q]!.curvatures,
      ]) !==
      JSON.stringify([copy.layers[q]!.slopes, copy.layers[q]!.curvatures])
    )
      failures.push("The coordinator rewrote native compatibility jets.");
  }
  const unframed: IAutoMovieLoftChain = {
    ...copy,
    layers: copy.layers.map(
      (layer: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => {
        const value: IAutoMovieLoftChain.ILayer = { ...layer };
        delete value.frame;
        delete value.frameSlopes;
        delete value.frameCurvatures;
        delete value.frameSource;
        return value;
      },
    ),
  };
  const framed: IAutoMovieLoftChain = AutoMovieSolidChain.framed(unframed);
  if (
    !AutoMovieLoftJet.carries(framed) ||
    AutoMovieSolidChain.surface(framed) === null
  )
    failures.push(
      "A regular horizontal native source did not acquire its exact frame2.",
    );
  for (const chain of [continuous, framed])
    for (const s of [0, 0.125, 0.375, 0.5])
      for (const phi of [-0.31, 0, 0.77, 3.7]) {
        close(
          AutoMovieLoftChain.point(chain, s, phi),
          AutoMovieLoftChain.point(original, s, phi),
          "clipped source point",
          failures,
        );
        const actual: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(
          chain,
          s,
          phi,
        );
        const expected: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(
          original,
          s,
          phi,
        );
        for (const key of ["p", "s", "t", "ss", "st", "tt"] as const)
          close(actual[key], expected[key], `clipped source ${key}`, failures);
      }
}

/** Complete endpoint families supply local2 without any projection-curvature field. */
function endpoints(failures: string[]): void {
  const inputs: AutoMovieLoftViewRead.IJets = {
    extents: [
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
    ],
    shoulders: Array.from(
      { length: 4 },
      (): readonly [number, number, number] => [Math.SQRT2 - 1, 0, 0],
    ),
  };
  const layers: IAutoMovieLoftChain.ILayer[] = [0, 1].map(
    (y: number): IAutoMovieLoftChain.ILayer => {
      const layer: IAutoMovieLoftChain.ILayer = {
        y,
        coefficients: [
          ...new Array<number>(8).fill(1),
          ...new Array<number>(8).fill(0),
        ],
        slopes: new Array<number>(16).fill(0),
        frame: AutoMovieLoftFrame.horizontal(y),
        frameSlopes: { origin: [0, 1, 0], u: [0, 0, 0], v: [0, 0, 0] },
        frameCurvatures: { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] },
      };
      layer.sectionSource = AutoMovieLoftSectionSource.bind(layer, {
        kind: "native",
        inputs,
      });
      return layer;
    },
  );
  const chain: IAutoMovieLoftChain = AutoMovieLoftSectionConnect.finish({
    name: "phase.endpoint-only",
    basis: "spline",
    rule: "polar",
    orientation: 1,
    order: 8,
    samples: 8,
    layers,
  });
  const continuous: IAutoMovieLoftChain =
    AutoMovieSeamStation.continuous(chain);
  if (
    !AutoMovieLoftJet.carries(continuous) ||
    AutoMovieSolidChain.surface(continuous) === null
  )
    failures.push(
      "Complete endpoint/span native2 incorrectly requires projection curvature.",
    );
  if (
    continuous.layers.some(
      (layer: IAutoMovieLoftChain.ILayer): boolean =>
        layer.curvatures !== undefined,
    )
  )
    failures.push(
      "The coordinator fabricated an unnecessary projection curvature row.",
    );
  const cold: IAutoMovieLoftChain = JSON.parse(
    JSON.stringify(continuous),
  ) as IAutoMovieLoftChain;
  for (const phi of [-0.37, 0, 1.2, 4.3]) {
    const expected: number[] = [Math.cos(phi), 0.37, Math.sin(phi)];
    close(
      AutoMovieLoftChain.point(cold, 0.37, phi),
      expected,
      "cold endpoint-only native point",
      failures,
    );
    close(
      AutoMovieLoftJet.at(cold, 0.37, phi).p,
      expected,
      "cold endpoint-only native jet",
      failures,
    );
  }
}

/** A present changed boundary without its declared adjoining law cannot quietly read the old base field. */
function incomplete(failures: string[], input: IAutoMovieViewPart): void {
  const result: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(input);
  if (result.chain === null)
    throw new Error(JSON.stringify(result.diagnostics));
  const original: IAutoMovieLoftChain = result.chain;
  const field: AutoMovieLoftSectionSource.IEndpoint["field"] | string =
    AutoMovieLoftSectionConnect.capture(original, 0);
  if (typeof field === "string") throw new Error(field);
  const first: IAutoMovieLoftChain.ILayer = { ...original.layers[0]! };
  first.sectionSource = AutoMovieLoftSectionSource.bind(first, field);
  const broken: IAutoMovieLoftChain = {
    ...original,
    layers: [first, ...original.layers.slice(1)],
  };
  try {
    AutoMovieLoftChain.point(broken, 0.37, 0.41);
    failures.push(
      "An incomplete present native boundary selected the original base field.",
    );
  } catch (error: unknown) {
    if (!(error instanceof Error) || !error.message.includes("adjoining"))
      failures.push("An incomplete native boundary lost its named failure.");
  }
}

/** The unchanged original generator and exact horizontal identity give independent adapter expectations. */
function close(
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
          3e-9 * Math.max(1, Math.abs(expected[q]!)),
    )
  )
    failures.push(`${name}: actual ${actual}, expected ${expected}`);
}

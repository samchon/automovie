import {
  AutoMovieLoftChain,
  AutoMovieLoftFrame,
  AutoMovieLoftJet,
  AutoMovieLoftPhaseSource,
  AutoMovieSplineCurve,
  AutoMovieViewAxis,
  type AutoMovieViewConic,
  AutoMovieViewCurves,
  AutoMovieViewLoft,
  AutoMovieViewSection,
  type IAutoMovieLoftChain,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import { performance } from "node:perf_hooks";

/** Independent original-source and actual-consumer observations for the phase question. */
export namespace ConstructionPhaseSourceComparison {
  /**
   * Compare actual scalar 2-jets and native sections with principal
   * reinterpolation and real final consumers. Authored quadratic a(s)=1+s^2,
   * b(s)=2 supplies the independent expectation. This diagnostic compares
   * phase components; the final-consumer helper separately checks physical
   * station/mixed total2 without filling any unavailable derivative.
   */
  export function sources(failures: string[]): void {
    const input: IAutoMovieViewPart = original();
    const prepared: AutoMovieViewCurves.IResult =
      AutoMovieViewCurves.create(input);
    if (prepared.diagnostics.length !== 0)
      failures.push(
        `direct source admission: ${JSON.stringify(prepared.diagnostics)}`,
      );
    const first: AutoMovieViewSection.ISection = section(prepared, input, 0);
    const last: AutoMovieViewSection.ISection = section(prepared, input, 1);
    const principal: AutoMovieLoftPhaseSource.ISource | string =
      AutoMovieLoftPhaseSource.prepare([0, 1], [first.conics, last.conics]);
    const final: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(input);
    if (
      typeof principal === "string" ||
      final.chain === null ||
      final.surface === null
    ) {
      failures.push(
        `direct source comparison unavailable: ${typeof principal === "string" ? principal : JSON.stringify(final.diagnostics)}`,
      );
      return;
    }
    let directError: number = 0;
    let principalError: number = 0;
    let actualError: number = 0;
    let originalJetError: number = 0;
    let directPhaseJetError: number = 0;
    for (const s of [0, 0.125, 0.25, 0.5, 0.75, 0.875, 1]) {
      const native: AutoMovieViewSection.ISection = section(prepared, input, s);
      const at: AutoMovieLoftPhaseSource.IStation =
        AutoMovieLoftPhaseSource.station(principal, s);
      const reading: AutoMovieViewCurves.IReading | string =
        AutoMovieViewCurves.at(prepared.curves[0]!, input.axis, s);
      if (typeof reading === "string" || reading.scalar.stationJet === null) {
        failures.push(`original scalar jet absent at ${s}`);
        continue;
      }
      originalJetError = Math.max(
        originalJetError,
        Math.abs(reading.scalar.value - (1 + s * s)),
        Math.abs(reading.scalar.stationJet[0] - 2 * s),
        Math.abs(reading.scalar.stationJet[1] - 2),
      );
      for (let i: number = 0; i < 64; i++) {
        const phi: number = (2 * Math.PI * i) / 64;
        const radial: readonly number[] = AutoMovieViewSection.radius(
          native,
          phi,
        );
        const direct: number[] = [
          radial[0]! * Math.cos(phi),
          radial[0]! * Math.sin(phi),
        ];
        const expected: [number, number] = ellipsePoint(1 + s * s, 2, phi);
        const expectedJet: number[] = ellipseJet(1 + s * s, 2, phi);
        const directJet: number[] = [
          direct[0]!,
          direct[1]!,
          radial[1]! * Math.cos(phi) - radial[0]! * Math.sin(phi),
          radial[1]! * Math.sin(phi) + radial[0]! * Math.cos(phi),
          (radial[2]! - radial[0]!) * Math.cos(phi) -
            2 * radial[1]! * Math.sin(phi),
          (radial[2]! - radial[0]!) * Math.sin(phi) +
            2 * radial[1]! * Math.cos(phi),
        ];
        for (let k: number = 0; k < 6; k++)
          directPhaseJetError = Math.max(
            directPhaseJetError,
            Math.abs(directJet[k]! - expectedJet[k]!) /
              Math.max(1, Math.abs(expectedJet[k]!)),
          );
        const reinterpolated: [number, number] = AutoMovieLoftPhaseSource.point(
          at,
          phi,
        );
        const point: [number, number, number] = AutoMovieLoftChain.point(
          final.chain,
          s,
          phi,
        );
        const jet: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(
          final.chain,
          s,
          phi,
        );
        const surface: readonly number[] = final.surface.jet(s, phi).p;
        directError = Math.max(
          directError,
          Math.hypot(direct[0]! - expected[0], direct[1]! - expected[1]),
        );
        principalError = Math.max(
          principalError,
          Math.hypot(
            reinterpolated[0] - expected[0],
            reinterpolated[1] - expected[1],
          ),
        );
        for (const p of [point, jet.p, surface])
          actualError = Math.max(
            actualError,
            Math.hypot(p[0]! - expected[0], p[1]! - s, p[2]! - expected[1]),
          );
      }
    }
    if (
      directError > 1e-7 ||
      originalJetError > 1e-12 ||
      directPhaseJetError > 1e-9
    )
      failures.push(
        `original scalar/native source changed: point ${directError}, scalar2jet ${originalJetError}, phase2jet ${directPhaseJetError}`,
      );
    if (!(principalError >= 0.25 - 1e-12))
      failures.push(
        `principal reinterpolation counterexample was lost: ${principalError}`,
      );
    if (actualError > 1e-7)
      failures.push(
        `actual final loses original quadratic views between layers: maximum point error ${actualError} mm, budget 1e-7 mm`,
      );
    console.log({
      phaseOriginalSourceComparison: {
        source: "a(s)=1+s^2,b(s)=2",
        middleOriginalA: 1.25,
        middlePrincipalA: AutoMovieLoftPhaseSource.point(
          AutoMovieLoftPhaseSource.station(principal, 0.5),
          0,
        )[0],
        directError,
        originalJetError,
        directPhaseJetError,
        principalError,
        actualError,
        nativeStationMixedJet:
          "not provided; scalar jets and native phase jets only",
      },
    });
  }

  /**
   * Bounded synthetic cost against real sampler, cached point and Jet.
   * Native planar readers omit frame/lift work, so this is a component
   * comparison rather than full-surface speed equivalence or an f1 budget.
   */
  export function costs(failures: string[]): void {
    const native: AutoMovieViewConic.ICurve = ellipse(1, 8).conics;
    const old: number[] = AutoMovieSplineCurve.interpolate(
      Array.from({ length: 32 }, (_: unknown, i: number): [number, number] =>
        ellipsePoint(1, 8, (2 * Math.PI * i) / 32),
      ),
    );
    const observations: Record<string, number>[] = [];
    let checksum: number = 0;
    for (const layers of [2, 8, 32, 128]) {
      const before: number = performance.now();
      const made: AutoMovieLoftPhaseSource.ISource | string =
        AutoMovieLoftPhaseSource.prepare(
          Array.from({ length: layers }, (_: unknown, i: number): number => i),
          new Array<AutoMovieViewConic.ICurve>(layers).fill(native),
        );
      const prepared: number = performance.now();
      if (typeof made === "string") {
        failures.push(made);
        continue;
      }
      const s: number = 0.37 * (layers - 1);
      const at: AutoMovieLoftPhaseSource.IStation =
        AutoMovieLoftPhaseSource.station(made, s);
      const station: number = performance.now();
      const legacy: IAutoMovieLoftChain = chain(old, layers);
      const samplerStart: number = performance.now();
      const sample: (phi: number) => [number, number, number] =
        AutoMovieLoftChain.sampler(legacy, s);
      const samplerPrepared: number = performance.now();
      checksum += AutoMovieLoftChain.point(legacy, s, 0.123)[0];
      const pointPrepared: number = performance.now();
      checksum += AutoMovieLoftJet.at(legacy, s, 0.123).p[0];
      const jetPrepared: number = performance.now();
      for (let i: number = 0; i < 1024; i++)
        checksum += AutoMovieLoftPhaseSource.point(at, i * 0.071)[0];
      const point: number = performance.now();
      for (let i: number = 0; i < 1024; i++)
        checksum += AutoMovieLoftPhaseSource.jet(at, i * 0.071)[0]![0]!;
      const jet: number = performance.now();
      for (let i: number = 0; i < 1024; i++) checksum += sample(i * 0.071)[0];
      const cubicSampler: number = performance.now();
      for (let i: number = 0; i < 1024; i++)
        checksum += AutoMovieLoftChain.point(legacy, s, i * 0.071)[0];
      const cubicPoint: number = performance.now();
      for (let i: number = 0; i < 1024; i++)
        checksum += AutoMovieLoftJet.at(legacy, s, i * 0.071).p[0];
      const cubicJet: number = performance.now();
      observations.push({
        layers,
        nativePrepareMs: prepared - before,
        nativeStationMs: station - prepared,
        legacyChainDataMs: samplerStart - station,
        legacySamplerPrepareMs: samplerPrepared - samplerStart,
        legacyColdPointMs: pointPrepared - samplerPrepared,
        legacyColdJetMs: jetPrepared - pointPrepared,
        nativePointMs: point - jetPrepared,
        nativeJetMs: jet - point,
        legacySamplerMs: cubicSampler - jet,
        legacyPointMs: cubicPoint - cubicSampler,
        legacyJetMs: cubicJet - cubicPoint,
      });
    }
    const input: IAutoMovieViewPart = original();
    const start: number = performance.now();
    const source: AutoMovieViewCurves.IResult =
      AutoMovieViewCurves.create(input);
    const ready: number = performance.now();
    for (let i: number = 0; i < 128; i++)
      checksum += section(source, input, (i + 0.37) / 128).guides[0].value;
    const directStations: number = performance.now();
    const nativeDirect: AutoMovieViewSection.ISection = section(
      source,
      input,
      0.37,
    );
    const directPhaseStart: number = performance.now();
    for (let i: number = 0; i < 1024; i++)
      checksum += AutoMovieViewSection.radius(nativeDirect, i * 0.071)[0];
    const directPhaseEnd: number = performance.now();
    if (!Number.isFinite(checksum))
      failures.push("phase cost observation produced a nonfinite checksum");
    console.log({
      phaseCandidateCosts: observations,
      phaseDirectCosts: {
        originalScalarPrepareMs: ready - start,
        source2JetAndNative128StationsMs: directStations - ready,
        nativePhase1024Ms: directPhaseEnd - directPhaseStart,
        nativeStationMixedJet: "not provided",
        noCache: true,
      },
      checksum,
    });
  }
}

/** The authored normalized endpoint jets uniquely reproduce the quadratic source. */
function original(): IAutoMovieViewPart {
  const quadratic: (sign: number) => IAutoMovieViewPart.IOutline = (
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
  const constant: (value: number) => IAutoMovieViewPart.IOutline = (
    value: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: [
      { site: "start", station: 0, value, jet: { first: 0, second: 0 } },
      { site: "end", station: 1, value, jet: { first: 0, second: 0 } },
    ],
  });
  return {
    name: "phase.quadratic",
    axis: AutoMovieViewAxis.horizontal(),
    stations: [0, 1],
    front: { positive: quadratic(1), negative: quadratic(-1) },
    side: { positive: constant(2), negative: constant(-2) },
    fullness: { kind: "shoulder", shoulder: constant(Math.SQRT2 - 1) },
    order: 32,
    samples: 32,
  };
}

/** Read actual scalar 2-jets in their original chart, then prepare one native section. */
function section(
  source: AutoMovieViewCurves.IResult,
  input: IAutoMovieViewPart,
  s: number,
): AutoMovieViewSection.ISection {
  const values: number[] = source.curves.map(
    (curve: AutoMovieViewCurves.ICurve): number => {
      const reading: AutoMovieViewCurves.IReading | string =
        AutoMovieViewCurves.at(curve, input.axis, s);
      if (typeof reading === "string" || reading.scalar.stationJet === null)
        throw new Error(
          `actual scalar 2-jet unavailable at ${s}: ${typeof reading === "string" ? reading : reading.scalar.stationJetStatus}`,
        );
      return reading.scalar.value;
    },
  );
  return ellipseBox([values[0]!, values[2]!, -values[1]!, -values[3]!]);
}

/** The unchanged ellipse shoulder and original four extents, without girth quadrature. */
function ellipseBox(
  extents: [number, number, number, number],
): AutoMovieViewSection.ISection {
  return AutoMovieViewSection.bare({ extents }, [
    Math.SQRT2 - 1,
    Math.SQRT2 - 1,
    Math.SQRT2 - 1,
    Math.SQRT2 - 1,
  ]);
}

/** One constant symmetric ellipse source for the component cost observation. */
function ellipse(a: number, b: number): AutoMovieViewSection.ISection {
  return ellipseBox([a, b, a, b]);
}

/** Independent implicit ellipse ray intersection, without candidate interpolation. */
function ellipsePoint(a: number, b: number, phi: number): [number, number] {
  const radius: number = 1 / Math.hypot(Math.cos(phi) / a, Math.sin(phi) / b);
  return [radius * Math.cos(phi), radius * Math.sin(phi)];
}

/** Differentiate the independent implicit ellipse ray formula twice in phase. */
function ellipseJet(a: number, b: number, phi: number): number[] {
  const c: number = Math.cos(phi);
  const s: number = Math.sin(phi);
  const r: number = 1 / Math.hypot(c / a, s / b);
  const difference: number = 1 / (b * b) - 1 / (a * a);
  const first: number = -c * s * difference * r ** 3;
  const second: number =
    3 * c * c * s * s * difference * difference * r ** 5 -
    (c * c - s * s) * difference * r ** 3;
  return [
    r * c,
    r * s,
    first * c - r * s,
    first * s + r * c,
    (second - r) * c - 2 * first * s,
    (second - r) * s + 2 * first * c,
  ];
}

/** Legacy coefficient/frame data read through real public consumers in the cost observation. */
function chain(
  coefficients: readonly number[],
  count: number,
): IAutoMovieLoftChain {
  return {
    name: "phase.cost",
    basis: "spline",
    order: 32,
    rule: "polar",
    samples: 32,
    layers: Array.from(
      { length: count },
      (_: unknown, i: number): IAutoMovieLoftChain.ILayer => ({
        y: i,
        coefficients: [...coefficients],
        slopes: new Array<number>(64).fill(0),
        curvatures: new Array<number>(64).fill(0),
        frame: AutoMovieLoftFrame.horizontal(i),
        frameSlopes: { origin: [0, 1, 0], u: [0, 0, 0], v: [0, 0, 0] },
        frameCurvatures: { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] },
      }),
    ),
  };
}

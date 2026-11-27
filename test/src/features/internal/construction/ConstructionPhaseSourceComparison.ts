import {
  AutoMovieEngineLoftChain,
  AutoMovieEngineLoftJet,
  AutoMovieEngineLoftPhaseSource,
  AutoMovieEngineViewAxis,
  AutoMovieEngineViewCurves,
  AutoMovieEngineViewLoft,
  AutoMovieEngineViewSection,
} from "@automovie/engine";
import type {
  IAutoMovieLoftPhaseSource,
  IAutoMovieLoftSurfaceJet,
  IAutoMovieViewCurves,
  IAutoMovieViewLoft,
  IAutoMovieViewPart,
  IAutoMovieViewSection,
} from "@automovie/interface";

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
    const prepared: IAutoMovieViewCurves.IResult =
      AutoMovieEngineViewCurves.create(input);
    if (prepared.diagnostics.length !== 0)
      failures.push(
        `direct source admission: ${JSON.stringify(prepared.diagnostics)}`,
      );
    const first: IAutoMovieViewSection.ISection = section(prepared, input, 0);
    const last: IAutoMovieViewSection.ISection = section(prepared, input, 1);
    const principal: IAutoMovieLoftPhaseSource.ISource | string =
      AutoMovieEngineLoftPhaseSource.prepare([0, 1], [first.conics, last.conics]);
    const final: IAutoMovieViewLoft.IResult = AutoMovieEngineViewLoft.create(input);
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
      const native: IAutoMovieViewSection.ISection = section(
        prepared,
        input,
        s,
      );
      const at: IAutoMovieLoftPhaseSource.IStation =
        AutoMovieEngineLoftPhaseSource.station(principal, s);
      const reading: IAutoMovieViewCurves.IReading | string =
        AutoMovieEngineViewCurves.at(prepared.curves[0]!, input.axis, s);
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
        const radial: readonly number[] = AutoMovieEngineViewSection.radius(
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
        const reinterpolated: [number, number] = AutoMovieEngineLoftPhaseSource.point(
          at,
          phi,
        );
        const point: [number, number, number] = AutoMovieEngineLoftChain.point(
          final.chain,
          s,
          phi,
        );
        const jet: IAutoMovieLoftSurfaceJet = AutoMovieEngineLoftJet.at(
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
    axis: AutoMovieEngineViewAxis.horizontal(),
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
  source: IAutoMovieViewCurves.IResult,
  input: IAutoMovieViewPart,
  s: number,
): IAutoMovieViewSection.ISection {
  const values: number[] = source.curves.map(
    (curve: IAutoMovieViewCurves.ICurve): number => {
      const reading: IAutoMovieViewCurves.IReading | string =
        AutoMovieEngineViewCurves.at(curve, input.axis, s);
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
): IAutoMovieViewSection.ISection {
  return AutoMovieEngineViewSection.bare({ extents }, [
    Math.SQRT2 - 1,
    Math.SQRT2 - 1,
    Math.SQRT2 - 1,
    Math.SQRT2 - 1,
  ]);
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

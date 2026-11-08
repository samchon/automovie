import {
  AutoMovieViewOutline,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { AutoMovieHumanNeckFamily } from "../AutoMovieHumanNeckFamily";

/** C2 material transition preserving both original neck measurement courses. */
export namespace AutoMovieHumanTorsoCollar {
  /** The original neck facts actually consumed by the weight law; no loft or unrelated part is required. */
  export interface INeck {
    /** Actual finite-clock base declaration, clock length and protected normal band. */
    readonly controls: Pick<AutoMovieHumanNeckFamily.IOutput["controls"], "height" | "baseClock" | "band">;

    /** Actual supported physical interval of the same neck field. */
    readonly curve: Pick<AutoMovieHumanNeckFamily.IOutput["curve"], "domain">;

    /** Actual numerical base-course height range. */
    readonly courseRange: readonly [number, number];

    /** Original base height and phase two-jet, per radian. */
    height(phase: number): readonly [number, number, number];

    /** Original normal-course height and phase two-jet, per radian. */
    normalHeight(phase: number): readonly [number, number, number];
  }

  /** Actual scalar weight partials in physical station mm and original radians. */
  export interface IWeight {
    /** Value, zero at the authored start and one on either protected course. */
    p: number;

    /** First physical-station derivative. */
    s: number;

    /** First original-phase derivative. */
    t: number;

    /** Second physical-station derivative. */
    ss: number;

    /** Mixed physical-station/original-phase derivative. */
    st: number;

    /** Second original-phase derivative. */
    tt: number;
  }

  /** Actual piecewise source interval, independent of a rounded numeric weight. */
  export interface IReading extends IWeight {
    /** Retained body, retained neck, or the interior Cartesian transition. */
    source: "body" | "neck" | "blend";
  }

  /** One call-owned transition whose span is admitted before source publication. */
  export interface IField {
    /** Actual smallest start height, separately admitted against the neck support domain. */
    readonly minimumStart: number;

    /** The same original neck and nonplanar measurement course. */
    readonly neck: INeck;

    /** Original phase-dependent start height and its first two phase derivatives. */
    start(phase: number): readonly [number, number, number];

    /** Same C2 weight, with legitimate constant extensions rather than unavailable jets. */
    at(station: number, phase: number): IReading;
  }

  /**
   * Join actual Cartesian originals over phase-dependent positive spans.
   *
   * Each course has its own flat-two-jet quintic transition from the authored start. The smooth union 1-(1-A)(1-B) is exactly one with zero derivatives on either actual course, without a nonsmooth minimum of their heights. Both original coordinate frames remain unchanged. C2 composition alone does not prove regularity, simplicity or anatomical shape; actual curves and derivatives must still be inspected.
   */
  export function create(
    neck: INeck,
    start: IAutoMovieViewPart.IOutline,
  ): IField {
    const prepared: AutoMovieViewOutline.IOutline = prepare(start);
    const base: IAutoMovieViewPart.IOutline = neck.controls.height;
    const gap: IAutoMovieViewPart.IOutline = difference(base, start);
    const startRange: readonly [number, number] = range(prepared);
    const gapRange: readonly [number, number] = range(prepare(gap));
    if (
      startRange[0] < neck.curve.domain[0] ||
      !(gapRange[0] > 0 && startRange[1] < neck.controls.band[0]) ||
      neck.courseRange[1] > neck.curve.domain[1]
    )
      throw new Error(
        "S00 collar source spans are incompatible: " +
          JSON.stringify({
            domain: neck.curve.domain,
            startRange,
            gapRange,
            baseRange: neck.courseRange,
            normalBand: neck.controls.band,
          }),
      );

    /** Read the original start in its periodic course clock, retaining exact named-quarter identities. */
    const atStart: (phase: number) => readonly [number, number, number] = (
      phase: number,
    ): readonly [number, number, number] => {
      const period: number = 2 * Math.PI;
      const raw: number = phase % period;
      const angle: number = raw < 0 ? raw + period : raw;
      const quarter: number = [
        0,
        Math.PI / 2,
        Math.PI,
        (3 * Math.PI) / 2,
      ].indexOf(angle);
      const clock: number =
        quarter < 0
          ? (neck.controls.baseClock * angle) / period
          : (neck.controls.baseClock * quarter) / 4;
      const read: ReturnType<typeof AutoMovieViewOutline.at> =
        AutoMovieViewOutline.at(prepared, clock);
      if (typeof read === "string") throw new Error(read);
      if (read.stationJet === null)
        throw new Error("Actual collar start has unavailable phase2");
      const turn: number = neck.controls.baseClock / period;
      return [
        read.value,
        read.stationJet[0] * turn,
        read.stationJet[1] * turn * turn,
      ];
    };
    return {
      minimumStart: startRange[0],
      start: atStart,
      neck,
      at(station: number, phase: number): IReading {
        if (!Number.isFinite(station) || !Number.isFinite(phase))
          throw new Error("S00 collar requires finite original coordinates");
        if (station <= startRange[0])
          return { source: "body", p: 0, s: 0, t: 0, ss: 0, st: 0, tt: 0 };
        if (station >= neck.curve.domain[1])
          return { source: "neck", p: 1, s: 0, t: 0, ss: 0, st: 0, tt: 0 };
        const from: readonly [number, number, number] = atStart(phase);
        if (station <= from[0])
          return { source: "body", p: 0, s: 0, t: 0, ss: 0, st: 0, tt: 0 };
        const base: readonly [number, number, number] = neck.height(phase);
        const normal: readonly [number, number, number] =
          neck.normalHeight(phase);
        if (station >= base[0] || station >= normal[0])
          return { source: "neck", p: 1, s: 0, t: 0, ss: 0, st: 0, tt: 0 };
        const a: IWeight = transition(station, from, base);
        const b: IWeight = transition(station, from, normal);
        return {
          source: "blend",
          p: 1 - (1 - a.p) * (1 - b.p),
          s: a.s * (1 - b.p) + b.s * (1 - a.p),
          t: a.t * (1 - b.p) + b.t * (1 - a.p),
          ss: a.ss * (1 - b.p) + b.ss * (1 - a.p) - 2 * a.s * b.s,
          st: a.st * (1 - b.p) + b.st * (1 - a.p) - a.s * b.t - a.t * b.s,
          tt: a.tt * (1 - b.p) + b.tt * (1 - a.p) - 2 * a.t * b.t,
        };
      },
    };
  }
}

/**
 * Subtract original finite quintics on the union of their actual spans.
 * Restricting a degree-five polynomial by its endpoint value and two jets
 * is exact in this same linear clock; this is not a sampled refit or a new
 * interpolating curve through display points. Both original declarations
 * remain unchanged and are the actual weight consumers below.
 */
function difference(
  a: IAutoMovieViewPart.IOutline,
  b: IAutoMovieViewPart.IOutline,
): IAutoMovieViewPart.IOutline {
  if (a.parameter !== undefined || b.parameter !== undefined ||
    a.knots[0]!.station !== b.knots[0]!.station ||
    a.knots.at(-1)!.station !== b.knots.at(-1)!.station ||
    [...a.knots, ...b.knots].some((knot: IAutoMovieViewPart.IKnot): boolean =>
      typeof knot.jet?.first !== "number" || typeof knot.jet.second !== "number"))
    throw new Error("Collar difference needs actual finite-clock quintics and complete phase2");
  const aa: AutoMovieViewOutline.IOutline = prepare(a);
  const bb: AutoMovieViewOutline.IOutline = prepare(b);
  const span: number = a.knots.at(-1)!.station - a.knots[0]!.station;
  const stations: number[] = [...new Set([...a.knots, ...b.knots].map(
    (knot: IAutoMovieViewPart.IKnot): number => knot.station,
  ))].sort((x: number, y: number): number => x - y);
  return { knots: stations.map((station: number): IAutoMovieViewPart.IKnot => {
    const left: ReturnType<typeof AutoMovieViewOutline.at> = AutoMovieViewOutline.at(aa, station);
    const right: ReturnType<typeof AutoMovieViewOutline.at> = AutoMovieViewOutline.at(bb, station);
    if (typeof left === "string" || typeof right === "string" || left.stationJet === null || right.stationJet === null)
      throw new Error("Collar difference has unavailable original phase2");
    return { site: "collar.gap." + station, station, value: left.value - right.value,
      jet: { first: (left.stationJet[0] - right.stationJet[0]) * span,
        second: (left.stationJet[1] - right.stationJet[1]) * span * span } };
  }) };
}

/** Actual flat-two-jet quintic between two original phase-dependent heights. */
function transition(
  station: number,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
): AutoMovieHumanTorsoCollar.IWeight {
  if (station <= from[0]) return { p: 0, s: 0, t: 0, ss: 0, st: 0, tt: 0 };
  if (station >= to[0]) return { p: 1, s: 0, t: 0, ss: 0, st: 0, tt: 0 };
  const span: number = to[0] - from[0];
  const dt: number = to[1] - from[1];
  const dtt: number = to[2] - from[2];
  if (!(Number.isFinite(span) && span > 0))
    throw new Error("Collar query has no positive actual source interval");
  const u: number = (station - from[0]) / span;
  const us: number = 1 / span;
  const ut: number = -(from[1] + u * dt) / span;
  const ust: number = -dt / (span * span);
  const utt: number = -(from[2] + u * dtt + 2 * ut * dt) / span;
  const first: number = 30 * u * u * (u - 1) * (u - 1);
  const second: number = 60 * u * (2 * u * u - 3 * u + 1);
  return {
    p: u ** 3 * (u * (6 * u - 15) + 10),
    s: first * us,
    t: first * ut,
    ss: second * us * us,
    st: second * us * ut + first * ust,
    tt: second * ut * ut + first * utt,
  };
}

/** Preserve the original scalar admission rather than inventing a source or derivative. */
function prepare(
  input: IAutoMovieViewPart.IOutline,
): AutoMovieViewOutline.IOutline {
  const result: ReturnType<typeof AutoMovieViewOutline.create> =
    AutoMovieViewOutline.create(input);
  if ("detail" in result) throw new Error(result.detail);
  return result;
}

/** Endpoint/knot/critical numerical source range, explicitly not an interval certificate. */
function range(
  source: AutoMovieViewOutline.IOutline,
): readonly [number, number] {
  const values: number[] = [
    ...source.knots.map(
      (knot: IAutoMovieViewPart.IKnot): number => knot.station,
    ),
    ...AutoMovieViewOutline.criticalStations(source),
  ].map((station: number): number => {
    const value: ReturnType<typeof AutoMovieViewOutline.value> =
      AutoMovieViewOutline.value(source, station);
    if (typeof value === "string") throw new Error(value);
    return value;
  });
  return [Math.min(...values), Math.max(...values)];
}

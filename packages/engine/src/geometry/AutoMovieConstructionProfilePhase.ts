import type {
  IAutoMovieConstructionProfile,
  IAutoMovieConstructionProfilePhase,
  IAutoMovieConstructionProfilePiece,
  IAutoMovieConstructionProfileSource,
  IAutoMovieLoftSectionFrame,
} from "@automovie/interface";

import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";

/**
 * Qualified phase readings of actual profile fields, independently of
 * physical2.
 *
 * At a fixed station the original plane is constant in the curve clock. Thus
 * its first and second phase derivatives multiply only the original local
 * derivatives, with the piece's actual affine clock scale and its square. No
 * station or frame derivatives are requested or invented.
 */
export namespace AutoMovieConstructionProfilePhase {
  /**
   * Borrow already admitted immutable originals; explicit null never falls back
   * to total2.
   */
  export function create(
    source: IAutoMovieConstructionProfileSource,
    definition: IAutoMovieConstructionProfile,
  ): (
    piece: string,
    station: number,
    coordinate: number,
  ) => IAutoMovieConstructionProfilePhase.IReading {
    const charts: Map<string, Chart> = new Map();
    for (const loop of definition.loops)
      for (const piece of loop.pieces)
        charts.set(piece.id, {
          domain: [1000 * loop.domain[0], 1000 * loop.domain[1]],
          piece,
          curve: source.curves.get(piece.source)!,
        });
    return (
      piece: string,
      station: number,
      coordinate: number,
    ): IAutoMovieConstructionProfilePhase.IReading => {
      const chart: Chart | undefined = charts.get(piece);
      if (
        chart === undefined ||
        station < chart.domain[0] ||
        station > chart.domain[1] ||
        coordinate < 0 ||
        coordinate > 1
      )
        fail("Original phase query is outside its actual piece chart.");
      const original: IAutoMovieConstructionProfilePiece = chart!.piece;
      const factor: number =
        original.direction * (original.clock[1] - original.clock[0]);
      const clock: number =
        original.clock[original.direction === 1 ? 0 : 1] + factor * coordinate;
      const local: IAutoMovieConstructionProfileSource.IPhase | null =
        chart!.curve.phase === undefined
          ? chart!.curve.jet(station, clock)
          : chart!.curve.phase(station, clock);
      if (local === null)
        fail("Original profile phase derivatives are unavailable.");
      pair(local!.p);
      pair(local!.t);
      if (local!.tt !== null) pair(local!.tt);
      const frame: IAutoMovieLoftSectionFrame = source.plane.axis.at(station);
      for (const value of [frame.origin, frame.u, frame.v])
        if (value.length !== 3)
          fail("Original phase query has incomplete plane data.");

      /*
       * At fixed station only the actual local curve differentiates in phase.
       */
      const world: (
        value: readonly [number, number],
        scale: number,
      ) => [number, number, number] = (
        value: readonly [number, number],
        scale: number,
      ): [number, number, number] =>
        [0, 1, 2].map(
          (k: number): number =>
            scale * (frame.u[k]! * value[0] + frame.v[k]! * value[1]),
        ) as [number, number, number];
      const p: [number, number, number] = world(local!.p, 1);
      for (let k: number = 0; k < 3; k++) p[k]! += frame.origin[k]!;
      const result: IAutoMovieConstructionProfilePhase.IReading = {
        p,
        t: world(local!.t, factor),
        tt: local!.tt === null ? null : world(local!.tt, factor * factor),
      };

      return result;
    };
  }
}

/*
 * One already admitted original chart and its actual station ownership.
 */
type Chart = {
  /*
   * Actual physical station interval, kernel millimetres.
   */
  domain: [number, number];
  /*
   * Exact original clock interval and direction.
   */
  piece: IAutoMovieConstructionProfilePiece;
  /*
   * Borrowed immutable generating function owner.
   */
  curve: IAutoMovieConstructionProfileSource.ICurve;
};

/*
 * Every provided local derivative owns both components.
 */
function pair(value: readonly number[]): void {
  if (value.length !== 2)
    fail("Original phase reading requires two local components.");
}

/*
 * Numeric/unavailable admission remains separate from original callback
 * exceptions.
 */
function fail(message: string): never {
  throw new AutoMovieLoftAdmissionError(message);
}

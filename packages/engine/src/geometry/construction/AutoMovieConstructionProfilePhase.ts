import type { IAutoMovieConstructionProfile } from "@automovie/interface";

import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import type { IAutoMovieConstructionProfileSource } from "./IAutoMovieConstructionProfileSource";

/** One already admitted original chart and its actual station ownership. */
type Chart = {
  /** Actual physical station interval, kernel millimetres. */
  domain: [number, number];
  /** Exact original clock interval and direction. */
  piece: IAutoMovieConstructionProfile.IPiece;
  /** Borrowed immutable generating function owner. */
  curve: IAutoMovieConstructionProfileSource.ICurve;
};

/**
 * Qualified phase readings of actual profile fields, independently of physical2.
 *
 * At a fixed station the original plane is constant in the curve clock. Thus
 * its first and second phase derivatives multiply only the original local
 * derivatives, with the piece's actual affine clock scale and its square.
 * No station or frame derivatives are requested or invented.
 *
 * @evidence contracts/common.md#principled-implementation The fixed-station affine clock and actual plane value give the exact world phase product; absent original phase2 remains null while actual zero vectors remain zero.
 * @evidence contracts/common.md#clear-and-simple-design One indexed reader resolves original owners once and returns Point0, first phase and qualified second phase without requiring a regular station chart.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit unavailable phase refuses; only an absent phase capability may use the same owner's existing full total2. No finite differences, adjusted points or zero-filled missing derivatives occur.
 * @evidence contracts/common.md#meaningful-documentation Names physical station mm, normalized piece coordinates, immutable source lifetime and the distinction between phase-only and physical total2.
 * @evidence contracts/performance.md#efficient-algorithms Preparation indexes P admitted pieces in O(P) expected Map work; a query has expected constant lookup, one original phase/full2 and one actual frame reading, including their owning costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Every query shares the admitted original owners and chart index; old full2-only owners remain usable without constructing another surface or source.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller-owned reader retains O(P) chart records and borrowed original closures until released; each result owns fresh vectors and no global cache or external handle exists.
 */
export namespace AutoMovieConstructionProfilePhase {
  /** Actual world value and phase derivatives at one fixed physical station. */
  export interface IReading {
    /** World point, kernel millimetres. */
    p: [number, number, number];
    /** First derivative per normalized piece coordinate. */
    t: [number, number, number];
    /** Second normalized phase derivative, or null where not supplied. */
    tt: [number, number, number] | null;
  }

  /** Borrow already admitted immutable originals; explicit null never falls back to total2. */
  export function create(source: IAutoMovieConstructionProfileSource, definition: IAutoMovieConstructionProfile): (piece: string, station: number, coordinate: number) => IReading {
    const charts: Map<string, Chart> = new Map();
    for (const loop of definition.loops)
      for (const piece of loop.pieces)
        charts.set(piece.id, { domain: [1000 * loop.domain[0], 1000 * loop.domain[1]], piece, curve: source.curves.get(piece.source)! });
    return (piece: string, station: number, coordinate: number): IReading => {
      const chart: Chart | undefined = charts.get(piece);
      if (chart === undefined || !Number.isFinite(station) || !Number.isFinite(coordinate) || station < chart.domain[0] || station > chart.domain[1] || coordinate < 0 || coordinate > 1) fail("Original phase query is outside its actual piece chart.");
      const original: IAutoMovieConstructionProfile.IPiece = chart!.piece;
      const factor: number = original.direction * (original.clock[1] - original.clock[0]);
      const clock: number = original.clock[original.direction === 1 ? 0 : 1] + factor * coordinate;
      const local: IAutoMovieConstructionProfileSource.IPhase | null = chart!.curve.phase === undefined ? chart!.curve.jet(station, clock) : chart!.curve.phase(station, clock);
      if (local === null) fail("Original profile phase derivatives are unavailable.");
      pair(local!.p);
      pair(local!.t);
      if (local!.tt !== null) pair(local!.tt);
      const frame: AutoMovieLoftFrame.IFrame = source.plane.axis.at(station);
      for (const value of [frame.origin, frame.u, frame.v])
        if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) fail("Original phase query has incomplete or nonfinite plane data.");

      /** At fixed station only the actual local curve differentiates in phase. */
      const world: (value: readonly [number, number], scale: number) => [number, number, number] = (value: readonly [number, number], scale: number): [number, number, number] => [0, 1, 2].map((k: number): number => scale * (frame.u[k]! * value[0] + frame.v[k]! * value[1])) as [number, number, number];
      const p: [number, number, number] = world(local!.p, 1);
      for (let k: number = 0; k < 3; k++) p[k]! += frame.origin[k]!;
      const result: IReading = { p, t: world(local!.t, factor), tt: local!.tt === null ? null : world(local!.tt, factor * factor) };
      for (const vector of [result.p, result.t, ...(result.tt === null ? [] : [result.tt])])
        if (!vector.every(Number.isFinite)) fail("Original world phase reading is not finite.");
      return result;
    };
  }
}

/** Every provided local derivative owns both finite components. */
function pair(value: readonly number[]): void {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(Number.isFinite)) fail("Original phase reading requires two finite local components.");
}

/** Numeric/unavailable admission remains separate from original callback exceptions. */
function fail(message: string): never {
  throw new AutoMovieLoftAdmissionError(message);
}

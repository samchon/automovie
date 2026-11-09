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
 * @evidence contracts/development/common.md#meaningful-documentation Names physical station mm, normalized piece coordinates, immutable source lifetime and the distinction between phase-only and physical total2.
 * @evidence contracts/development/design.md#principled-representation Represents Qualified phase readings of actual profile fields, independently of physical2: companion namespace of 2 members (`IReading`, `create`); units and frames named in its text: world, second, local, frame. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieConstructionProfilePhase` in packages/engine/src/geometry/construction/AutoMovieConstructionProfilePhase.ts; its surface is the 2 members listed and the text shows 2 other files naming it, mostly packages/engine (1), packages/human (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieConstructionProfilePhase {
  /**
   * Actual world value and phase derivatives at one fixed physical station.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Actual world value and phase derivatives at one fixed physical station.
   * @evidence contracts/development/design.md#principled-representation Represents Actual world value and phase derivatives at one fixed physical station: interface of 3 members (`p`, `t`, `tt`); units and frames named in its text: world, second. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IReading` in packages/engine/src/geometry/construction/AutoMovieConstructionProfilePhase.ts; its surface is the 3 members listed and the text shows 64 other files naming it, mostly packages/human (35), test (19), packages/engine (10), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IReading {
    /** World point, kernel millimetres. */
    p: [number, number, number];
    /** First derivative per normalized piece coordinate. */
    t: [number, number, number];
    /** Second normalized phase derivative, or null where not supplied. */
    tt: [number, number, number] | null;
  }

  /**
   * Borrow already admitted immutable originals; explicit null never falls back to total2.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Borrow already admitted immutable originals; explicit null never falls back to total2.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Borrow already admitted immutable originals; explicit null never falls back to total2) directly over its typed inputs (`source`, `definition`) as nested iteration of depth 2 (for-of over definition.loops; for-of over loop.pieces; for-of over [frame.origin, frame.u, frame.v]), delegating to `charts.set`, `charts.get`, `Number.isFinite`, `fail`, `pair`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 1000, 3, whose basis this answer does not independently establish and a reviewer must confirm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 30 lines and 3 top-level statements that reuses `charts.set`, `charts.get`, `Number.isFinite`, `fail`, `pair` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 1 type assertion(s), 17 non-null assertion(s); these are the remaining shortcuts and are not justified here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `source`, `definition`; the dominant cost is nested iteration of depth 2 (for-of over definition.loops; for-of over loop.pieces; for-of over [frame.origin, frame.u, frame.v]), performed once per call with 9 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 9 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function create(
    source: IAutoMovieConstructionProfileSource,
    definition: IAutoMovieConstructionProfile,
  ): (piece: string, station: number, coordinate: number) => IReading {
    const charts: Map<string, Chart> = new Map();
    for (const loop of definition.loops)
      for (const piece of loop.pieces)
        charts.set(piece.id, {
          domain: [1000 * loop.domain[0], 1000 * loop.domain[1]],
          piece,
          curve: source.curves.get(piece.source)!,
        });
    return (piece: string, station: number, coordinate: number): IReading => {
      const chart: Chart | undefined = charts.get(piece);
      if (
        chart === undefined ||
        !Number.isFinite(station) ||
        !Number.isFinite(coordinate) ||
        station < chart.domain[0] ||
        station > chart.domain[1] ||
        coordinate < 0 ||
        coordinate > 1
      )
        fail("Original phase query is outside its actual piece chart.");
      const original: IAutoMovieConstructionProfile.IPiece = chart!.piece;
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
      const frame: AutoMovieLoftFrame.IFrame = source.plane.axis.at(station);
      for (const value of [frame.origin, frame.u, frame.v])
        if (
          !Array.isArray(value) ||
          value.length !== 3 ||
          !value.every(Number.isFinite)
        )
          fail("Original phase query has incomplete or nonfinite plane data.");

      /** At fixed station only the actual local curve differentiates in phase. */
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
      const result: IReading = {
        p,
        t: world(local!.t, factor),
        tt: local!.tt === null ? null : world(local!.tt, factor * factor),
      };
      for (const vector of [
        result.p,
        result.t,
        ...(result.tt === null ? [] : [result.tt]),
      ])
        if (!vector.every(Number.isFinite))
          fail("Original world phase reading is not finite.");
      return result;
    };
  }
}

/** Every provided local derivative owns both finite components. */
function pair(value: readonly number[]): void {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !value.every(Number.isFinite)
  )
    fail("Original phase reading requires two finite local components.");
}

/** Numeric/unavailable admission remains separate from original callback exceptions. */
function fail(message: string): never {
  throw new AutoMovieLoftAdmissionError(message);
}

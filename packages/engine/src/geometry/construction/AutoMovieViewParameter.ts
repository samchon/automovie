import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

/**
 * Source parameter arithmetic shared by radial outlines and nonzero world-coordinate curves.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes parameter endpoints, scalar values and radial closure, with kernel millimetre units.
 * @evidence contracts/development/design.md#principled-representation Represents Source parameter arithmetic shared by radial outlines and nonzero world-coordinate curves: companion namespace of 6 members (`prepare`, `at`, `station`, `jet`, `inverseJet`, `transferJet`); units and frames named in its text: second, frame. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieViewParameter` in packages/engine/src/geometry/construction/AutoMovieViewParameter.ts; its surface is the 6 members listed and the text shows 23 other files naming it, mostly packages/human (12), packages/engine (9), test (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieViewParameter {
  /**
   * Admit and copy parameter endpoints already converted to kernel millimetres.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Finite roots and a finite positive angle span define the monotone source domain.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns a copied record, undefined identity map, or named failure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses invalid endpoints without sorting or widening a domain.
   * @evidence contracts/development/common.md#meaningful-documentation States units and all return states.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant checks and a fixed-size copy.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One pure admission has no reusable effects.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns a copied record; no input is retained.
   */
  export function prepare(
    parameter: AutoMovieConstructionOutlineParameter | undefined,
  ): AutoMovieConstructionOutlineParameter | undefined | string {
    if (parameter === undefined) return undefined;
    if (parameter.type === "root")
      return Number.isFinite(parameter.pole) &&
        (parameter.end === "bottom" || parameter.end === "top")
        ? { ...parameter }
        : "root parameter needs a finite endpoint and its bottom/top side";
    return Number.isFinite(parameter.bottom) &&
      Number.isFinite(parameter.top) &&
      parameter.top > parameter.bottom &&
      Number.isFinite(parameter.top - parameter.bottom)
      ? { ...parameter }
      : "angle parameter needs finite increasing endpoints and a finite span";
  }

  /**
   * Map a station; nonfinite or outside-domain requests return NaN.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses signed square root or the equivalent angle root/asin expression from the nearer endpoint to avoid cancellation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map serves all scalar meanings, with omission as identity.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not clamp a station or alter any scalar value.
   * @evidence contracts/development/common.md#meaningful-documentation States admitted-domain and invalid-query behavior.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work with at most one root and asin.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure scalar mapping schedules no work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function at(
    parameter: AutoMovieConstructionOutlineParameter | undefined,
    station: number,
  ): number {
    if (!Number.isFinite(station)) return NaN;
    if (parameter === undefined) return station;
    if (parameter.type === "root") {
      const d: number =
        parameter.end === "bottom"
          ? station - parameter.pole
          : parameter.pole - station;
      return d >= 0
        ? (parameter.end === "bottom" ? 1 : -1) * Math.sqrt(d)
        : NaN;
    }
    const a: number = station - parameter.bottom;
    const b: number = parameter.top - station;
    if (a < 0 || b < 0) return NaN;
    const span: number = parameter.top - parameter.bottom;
    return a <= b
      ? 2 * Math.asin(Math.sqrt(a / span))
      : Math.PI - 2 * Math.asin(Math.sqrt(b / span));
  }

  /**
   * Invert an admitted in-span source parameter.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the square-root inverse and angle half-sine identity, from the nearer endpoint.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One inverse serves all critical-station observations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Assumes the admitted parameter span and invents no closure.
   * @evidence contracts/development/common.md#meaningful-documentation States the in-span premise and millimetre result.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic and at most one sine.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One pure scalar inverse schedules no work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function station(
    parameter: AutoMovieConstructionOutlineParameter | undefined,
    x: number,
  ): number {
    if (parameter === undefined) return x;
    if (parameter.type === "root")
      return parameter.pole + (parameter.end === "bottom" ? 1 : -1) * x * x;
    const span: number = parameter.top - parameter.bottom;
    return x <= Math.PI / 2
      ? parameter.bottom + span * Math.sin(x / 2) ** 2
      : parameter.top - span * Math.sin((Math.PI - x) / 2) ** 2;
  }

  /**
   * First/second parameter derivatives in station, absent at a singular parameter endpoint.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Differentiates signed root and two-end angle analytically; zero endpoint distance has no finite change-of-parameter jet.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pair feeds the scalar source chain rule, with null singularity.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses no finite difference and leaves overflowing arithmetic observable to the caller.
   * @evidence contracts/development/common.md#meaningful-documentation States derivative order, singular absence and admitted-domain premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic per requested jet.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure derivatives coordinate no work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns at most a two-number pair and retains nothing.
   */
  export function jet(
    parameter: AutoMovieConstructionOutlineParameter | undefined,
    station: number,
  ): [number, number] | null {
    if (parameter === undefined) return [1, 0];
    if (parameter.type === "root") {
      const d: number =
        parameter.end === "bottom"
          ? station - parameter.pole
          : parameter.pole - station;
      return d === 0
        ? null
        : [
            1 / (2 * Math.sqrt(d)),
            (parameter.end === "bottom" ? -1 : 1) / (4 * d ** 1.5),
          ];
    }
    const a: number = station - parameter.bottom;
    const b: number = parameter.top - station;
    const p: number = a * b;
    return a === 0 || b === 0
      ? null
      : [1 / Math.sqrt(p), (a - b) / (2 * p ** 1.5)];
  }

  /**
   * First two derivatives of station in the selected coordinate, including its finite pole limit.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Differentiates s=pole+sign*q^2 or s=bottom+span*sin(q/2)^2; the angle first derivative uses separate square roots to avoid overflowing a*b.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One inverse jet serves analytic frame and coefficient chain rules.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid domains and nonfinite results return null; a zero first inverse derivative at a pole does not imply a finite forward station derivative.
   * @evidence contracts/development/common.md#meaningful-documentation Parameter endpoints are kernel mm; results are ds/dq and d2s/dq2, independently of scalar values.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant checks and at most two roots use fixed storage.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure coordinate arithmetic schedules no work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh pair or null and retains nothing.
   */
  export function inverseJet(
    parameter: AutoMovieConstructionOutlineParameter | undefined,
    station: number,
  ): [number, number] | null {
    if (!Number.isFinite(at(parameter, station))) return null;
    if (parameter === undefined) return [1, 0];
    if (parameter.type === "root") {
      const distance: number =
        parameter.end === "bottom"
          ? station - parameter.pole
          : parameter.pole - station;
      return checked([
        2 * Math.sqrt(distance),
        parameter.end === "bottom" ? 2 : -2,
      ]);
    }
    const a: number = station - parameter.bottom;
    const b: number = parameter.top - station;
    return checked([Math.sqrt(a) * Math.sqrt(b), (b - a) / 2]);
  }

  /**
   * Derivatives of one source coordinate in another coordinate at the same station.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses analytic shared-pole root/angle compositions and their finite endpoint limits; other regular compositions use the two-order chain rule with the inverse jet.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One coordinate-transfer owner keeps scalar and frame derivative conversions on the same maps.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A singular source in a regular target or an unrepresentable result returns null. No Infinity-times-zero cancellation, derivative clamp or finite difference assigns a pole jet.
   * @evidence contracts/development/common.md#meaningful-documentation Returns dqSource/dqTarget and its second derivative; identical maps return identity, and distinct singular endpoints require the same station and inward side.
   * @evidence contracts/development/implementation.md#efficient-algorithms Bounded scalar cases take constant work and fixed result storage.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure source-coordinate arithmetic retains no preparation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns only a pair or null and keeps neither parameter record.
   */
  export function transferJet(
    source: AutoMovieConstructionOutlineParameter | undefined,
    target: AutoMovieConstructionOutlineParameter | undefined,
    station: number,
  ): [number, number] | null {
    if (
      !Number.isFinite(at(source, station)) ||
      !Number.isFinite(at(target, station))
    )
      return null;
    if (source === undefined) return inverseJet(target, station);
    if (same(source, target)) return [1, 0];

    // Cancel common square-root factors symbolically before evaluating a pole.
    if (
      source.type === "root" &&
      target?.type === "angle" &&
      source.pole === (source.end === "bottom" ? target.bottom : target.top)
    ) {
      const lower: number = Math.sqrt(station - target.bottom);
      const upper: number = Math.sqrt(target.top - station);
      return checked(
        source.end === "bottom"
          ? [upper / 2, -lower / 4]
          : [lower / 2, upper / 4],
      );
    }
    if (
      source.type === "angle" &&
      target?.type === "root" &&
      target.pole === (target.end === "bottom" ? source.bottom : source.top)
    ) {
      const other: number =
        target.end === "bottom"
          ? source.top - station
          : station - source.bottom;
      if (!(other > 0)) return null;
      const root: number = Math.sqrt(other);
      const coordinate: number = at(target, station);
      return checked([2 / root, (2 * coordinate) / other / root]);
    }
    if (source.type === "angle" && target?.type === "angle") {
      if (source.bottom === target.bottom) {
        const common: number = station - source.bottom;
        const other: number = source.top - station;
        if (!(other > 0)) return null;
        return checked([
          Math.sqrt(target.top - station) / Math.sqrt(other),
          common === 0
            ? 0
            : ((target.top - source.top) / other / 2) *
              (Math.sqrt(common) / Math.sqrt(other)),
        ]);
      }
      if (source.top === target.top) {
        const common: number = source.top - station;
        const other: number = station - source.bottom;
        if (!(other > 0)) return null;
        return checked([
          Math.sqrt(station - target.bottom) / Math.sqrt(other),
          common === 0
            ? 0
            : ((target.bottom - source.bottom) / other / 2) *
              (Math.sqrt(common) / Math.sqrt(other)),
        ]);
      }
    }
    const inverse: [number, number] | null = inverseJet(target, station);
    const forward: [number, number] | null = jet(source, station);
    if (inverse === null || forward === null || !forward.every(Number.isFinite))
      return null;
    return checked([
      forward[0] * inverse[0],
      forward[1] * inverse[0] * inverse[0] + forward[0] * inverse[1],
    ]);
  }
}

/** Finite derivative results remain explicit availability, never saturation. */
function checked(jet: [number, number]): [number, number] | null {
  return jet.every(Number.isFinite) ? jet : null;
}

/** Exact map identity compares the actual endpoint data, allowing equal-value copies. */
function same(
  source: AutoMovieConstructionOutlineParameter,
  target: AutoMovieConstructionOutlineParameter | undefined,
): boolean {
  return source.type === "root"
    ? target?.type === "root" &&
        source.pole === target.pole &&
        source.end === target.end
    : target?.type === "angle" &&
        source.bottom === target.bottom &&
        source.top === target.top;
}

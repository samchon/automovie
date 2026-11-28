import type { IAutoMovieConstructionOutlineParameter } from "@automovie/interface";

import { AutoMovieEngineConstructionRelativeTolerance } from "./AutoMovieEngineConstructionRelativeTolerance";

/**
 * Source parameter arithmetic shared by radial outlines and nonzero
 * world-coordinate curves.
 */
export namespace AutoMovieEngineViewParameter {
  /**
   * Copy a root or angle map with finite endpoints in kernel millimetres. An
   * angle map also requires a positive representable span. Undefined keeps the
   * station identity, and an invalid map returns its diagnostic.
   */
  export function prepare(
    parameter: IAutoMovieConstructionOutlineParameter | undefined,
  ): IAutoMovieConstructionOutlineParameter | undefined | string {
    if (parameter === undefined) return undefined;
    if (parameter.type === "root")
      return Number.isFinite(parameter.pole) &&
        (parameter.end === "bottom" || parameter.end === "top")
        ? { ...parameter }
        : "root parameter needs a finite endpoint and its bottom/top side";
    return parameter.top > parameter.bottom &&
      Number.isFinite(parameter.top - parameter.bottom)
      ? { ...parameter }
      : "angle parameter needs finite increasing endpoints and a finite span";
  }

  /**
   * Map a station; a station outside the domain by at most
   * {@link AutoMovieEngineConstructionRelativeTolerance} of its span (of the
   * root coordinate magnitude for a root map) reads as its endpoint, and
   * nonfinite or farther requests return NaN.
   */
  export function at(
    parameter: IAutoMovieConstructionOutlineParameter | undefined,
    station: number,
  ): number {
    if (!Number.isFinite(station)) return NaN;
    if (parameter === undefined) return station;
    const extent: number =
      parameter.type === "root"
        ? Math.max(Math.abs(parameter.pole), Math.abs(station))
        : parameter.top - parameter.bottom;
    const within = (gap: number): number =>
      gap < 0 && gap >= -AutoMovieEngineConstructionRelativeTolerance * extent
        ? 0
        : gap;
    if (parameter.type === "root") {
      const d: number = within(
        parameter.end === "bottom"
          ? station - parameter.pole
          : parameter.pole - station,
      );
      return d >= 0
        ? (parameter.end === "bottom" ? 1 : -1) * Math.sqrt(d)
        : NaN;
    }
    const a: number = within(station - parameter.bottom);
    const b: number = within(parameter.top - station);
    if (a < 0 || b < 0) return NaN;
    const span: number = parameter.top - parameter.bottom;
    return a <= b
      ? 2 * Math.asin(Math.sqrt(a / span))
      : Math.PI - 2 * Math.asin(Math.sqrt(b / span));
  }

  /**
   * Whether a station lies in the parameter's domain, an endpoint's tolerance
   * included (`at`): the root map's square root and the angle map's arcsine
   * read only there.
   */
  export function contains(
    parameter: IAutoMovieConstructionOutlineParameter | undefined,
    station: number,
  ): boolean {
    if (!Number.isFinite(station)) return false;
    if (parameter === undefined) return true;
    const extent: number =
      parameter.type === "root"
        ? Math.max(Math.abs(parameter.pole), Math.abs(station))
        : parameter.top - parameter.bottom;
    const tolerance: number =
      AutoMovieEngineConstructionRelativeTolerance * extent;
    if (parameter.type === "root")
      return (
        (parameter.end === "bottom"
          ? station - parameter.pole
          : parameter.pole - station) >= -tolerance
      );
    return (
      station - parameter.bottom >= -tolerance &&
      parameter.top - station >= -tolerance
    );
  }

  /**
   * Whether `jet`'s quotients are representable at a station: near a pole or a
   * parameter endpoint the root and power underflow so far that dividing by
   * them would overflow binary64.
   */
  export function jetRepresentable(
    parameter: IAutoMovieConstructionOutlineParameter | undefined,
    station: number,
  ): boolean {
    if (parameter === undefined) return true;
    if (parameter.type === "root") {
      const d: number =
        parameter.end === "bottom"
          ? station - parameter.pole
          : parameter.pole - station;
      return (
        d === 0 ||
        (2 * Math.sqrt(d) >= 1 / Number.MAX_VALUE &&
          4 * d ** 1.5 >= 1 / Number.MAX_VALUE)
      );
    }
    const a: number = station - parameter.bottom;
    const b: number = parameter.top - station;
    const p: number = a * b;
    return (
      a === 0 ||
      b === 0 ||
      (Math.sqrt(p) >= 1 / Number.MAX_VALUE &&
        2 * p ** 1.5 >= Math.abs(a - b) / Number.MAX_VALUE)
    );
  }

  /** Invert an admitted in-span source parameter. */
  export function station(
    parameter: IAutoMovieConstructionOutlineParameter | undefined,
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
   * First/second parameter derivatives in station, absent at a singular
   * parameter endpoint.
   */
  export function jet(
    parameter: IAutoMovieConstructionOutlineParameter | undefined,
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
   * First two derivatives of station in the selected coordinate, including its
   * finite pole limit; absent outside the square roots' domain.
   */
  export function inverseJet(
    parameter: IAutoMovieConstructionOutlineParameter | undefined,
    station: number,
  ): [number, number] | null {
    if (parameter === undefined) return [1, 0];
    if (parameter.type === "root") {
      const distance: number =
        parameter.end === "bottom"
          ? station - parameter.pole
          : parameter.pole - station;
      if (!(distance >= 0)) return null;
      return [2 * Math.sqrt(distance), parameter.end === "bottom" ? 2 : -2];
    }
    const a: number = station - parameter.bottom;
    const b: number = parameter.top - station;
    if (!(a >= 0 && b >= 0)) return null;
    return [Math.sqrt(a) * Math.sqrt(b), (b - a) / 2];
  }

  /**
   * Derivatives of one source coordinate in another coordinate at the same
   * station; absent outside either map's domain or where a quotient or a
   * product of the chain rule would leave binary64.
   */
  export function transferJet(
    source: IAutoMovieConstructionOutlineParameter | undefined,
    target: IAutoMovieConstructionOutlineParameter | undefined,
    station: number,
  ): [number, number] | null {
    if (!contains(source, station) || !contains(target, station)) return null;
    if (source === undefined) return inverseJet(target, station);
    if (same(source, target)) return [1, 0];

    // Cancel common square-root factors symbolically before evaluating a pole.
    if (
      source.type === "root" &&
      target?.type === "angle" &&
      source.pole === (source.end === "bottom" ? target.bottom : target.top)
    ) {
      if (!(station - target.bottom >= 0 && target.top - station >= 0))
        return null;
      const lower: number = Math.sqrt(station - target.bottom);
      const upper: number = Math.sqrt(target.top - station);
      return source.end === "bottom"
        ? [upper / 2, -lower / 4]
        : [lower / 2, upper / 4];
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
      if (!divides(2, root) || !divides(2 * coordinate, other * root))
        return null;
      return [2 / root, (2 * coordinate) / other / root];
    }
    if (source.type === "angle" && target?.type === "angle") {
      if (source.bottom === target.bottom)
        return shared(
          station - source.bottom,
          source.top - station,
          target.top - station,
          target.top - source.top,
        );
      if (source.top === target.top)
        return shared(
          source.top - station,
          station - source.bottom,
          station - target.bottom,
          target.bottom - source.bottom,
        );
    }
    const inverse: [number, number] | null = inverseJet(target, station);
    const forward: [number, number] | null = jet(source, station);
    if (
      inverse === null ||
      forward === null ||
      !jetRepresentable(source, station) ||
      !fits(forward[0], inverse[0]) ||
      !fits(inverse[0], inverse[0]) ||
      !fits(forward[1], inverse[0] * inverse[0]) ||
      !fits(forward[0], inverse[1]) ||
      !(
        Math.abs(forward[1] * inverse[0] * inverse[0]) <=
        Number.MAX_VALUE - Math.abs(forward[0] * inverse[1])
      )
    )
      return null;
    return [
      forward[0] * inverse[0],
      forward[1] * inverse[0] * inverse[0] + forward[0] * inverse[1],
    ];
  }
}

/*
 * Two angle maps sharing an endpoint: the transfer's jet with the common
 * square-root factor cancelled, absent where its ratio of roots overflows.
 * Parameter common: The station's distance from the shared endpoint.
 * Parameter other: Its distance from the source's other endpoint.
 * Parameter reach: Its distance from the target's other endpoint.
 * Parameter shift: The other endpoints' difference, target less source.
 */
function shared(
  common: number,
  other: number,
  reach: number,
  shift: number,
): [number, number] | null {
  if (!(other > 0 && reach >= 0 && common >= 0)) return null;
  const root: number = Math.sqrt(other);
  if (!divides(Math.sqrt(reach), root)) return null;
  if (common === 0) return [Math.sqrt(reach) / root, 0];
  if (!divides(shift, other) || !divides(Math.sqrt(common), root)) return null;
  const ratio: number = shift / other / 2;
  const roots: number = Math.sqrt(common) / root;
  if (!fits(ratio, roots)) return null;
  return [Math.sqrt(reach) / root, ratio * roots];
}

/*
 * Whether a quotient's magnitude stays within binary64, before it is formed.
 */
function divides(numerator: number, denominator: number): boolean {
  return (
    denominator !== 0 &&
    Math.abs(numerator) <= Math.abs(denominator) * Number.MAX_VALUE
  );
}

/*
 * Whether a product's magnitude stays within binary64, before it is formed.
 */
function fits(x: number, y: number): boolean {
  return y === 0 || Math.abs(x) <= Number.MAX_VALUE / Math.abs(y);
}

/*
 * Exact map identity compares the actual endpoint data, allowing equal-value
 * copies.
 */
function same(
  source: IAutoMovieConstructionOutlineParameter,
  target: IAutoMovieConstructionOutlineParameter | undefined,
): boolean {
  return source.type === "root"
    ? target?.type === "root" &&
        source.pole === target.pole &&
        source.end === target.end
    : target?.type === "angle" &&
        source.bottom === target.bottom &&
        source.top === target.top;
}

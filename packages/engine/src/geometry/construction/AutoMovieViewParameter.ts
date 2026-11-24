import type { IAutoMovieConstructionOutlineParameter } from "@automovie/interface";

import { AUTOMOVIE_CONSTRUCTION_RELATIVE_TOLERANCE } from "./AUTOMOVIE_CONSTRUCTION_RELATIVE_TOLERANCE";

/**
 * Source parameter arithmetic shared by radial outlines and nonzero
 * world-coordinate curves.
 */
export namespace AutoMovieViewParameter {
  /** Admit and copy parameter endpoints already converted to kernel millimetres. */
  export function prepare(
    parameter: IAutoMovieConstructionOutlineParameter | undefined,
  ): IAutoMovieConstructionOutlineParameter | undefined | string {
    if (parameter === undefined) return undefined;
    if (parameter.type === "root")
      return parameter.end === "bottom" || parameter.end === "top"
        ? { ...parameter }
        : "root parameter needs a finite endpoint and its bottom/top side";
    return parameter.top > parameter.bottom
      ? { ...parameter }
      : "angle parameter needs finite increasing endpoints and a finite span";
  }

  /**
   * Map a station; a station outside the domain by at most
   * {@link AUTOMOVIE_CONSTRUCTION_RELATIVE_TOLERANCE} of its span (of the root
   * coordinate magnitude for a root map) reads as its endpoint, and nonfinite
   * or farther requests return NaN.
   */
  export function at(
    parameter: IAutoMovieConstructionOutlineParameter | undefined,
    station: number,
  ): number {
    if (parameter === undefined) return station;
    const extent: number =
      parameter.type === "root"
        ? Math.max(Math.abs(parameter.pole), Math.abs(station))
        : parameter.top - parameter.bottom;
    const within = (gap: number): number =>
      gap < 0 && gap >= -AUTOMOVIE_CONSTRUCTION_RELATIVE_TOLERANCE * extent
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
    if (parameter === undefined) return true;
    const extent: number =
      parameter.type === "root"
        ? Math.max(Math.abs(parameter.pole), Math.abs(station))
        : parameter.top - parameter.bottom;
    const tolerance: number = AUTOMOVIE_CONSTRUCTION_RELATIVE_TOLERANCE * extent;
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
   * finite pole limit.
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
   * Derivatives of one source coordinate in another coordinate at the same
   * station.
   */
  export function transferJet(
    source: IAutoMovieConstructionOutlineParameter | undefined,
    target: IAutoMovieConstructionOutlineParameter | undefined,
    station: number,
  ): [number, number] | null {
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
    if (inverse === null || forward === null) return null;
    return checked([
      forward[0] * inverse[0],
      forward[1] * inverse[0] * inverse[0] + forward[0] * inverse[1],
    ]);
  }
}

/** Finite derivative results remain explicit availability, never saturation. */
function checked(jet: [number, number]): [number, number] | null {
  return jet;
}

/**
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

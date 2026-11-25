import type {
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieLoftChain,
  IAutoMovieLoftCoefficientSource,
  IAutoMovieStationHermite,
} from "@automovie/interface";

import { AutoMovieSeamStation } from "./AutoMovieSeamStation";
import { AutoMovieStationHermite } from "./AutoMovieStationHermite";
import { AutoMovieViewParameter } from "./AutoMovieViewParameter";

/**
 * New principal-coefficient interpolation in the part's selected common
 * root/angle pole coordinate.
 */
export namespace AutoMovieLoftCoefficientSource {
  /**
   * Prepare the capped coefficient data and carry its regular layer jets to
   * station.
   */
  export function prepare(
    chain: IAutoMovieLoftChain,
    parameter: IAutoMovieConstructionOutlineParameter,
  ): IAutoMovieLoftChain | string {
    const admitted:
      | IAutoMovieConstructionOutlineParameter
      | undefined
      | string = AutoMovieViewParameter.prepare(parameter);
    if (admitted === undefined || typeof admitted === "string")
      return typeof admitted === "string"
        ? admitted
        : "a capped coefficient source needs a pole parameter";
    const bottom: number | undefined = poleStation(admitted, "bottom");
    const top: number | undefined = poleStation(admitted, "top");
    if (
      (bottom !== undefined) !== closed(chain, "bottom") ||
      (top !== undefined) !== closed(chain, "top")
    )
      return "coefficient parameter endpoints do not match the chain's actual closing ends";
    const width: number = chain.layers[0]!.coefficients.length;
    const stations: number[] = [
      ...(bottom === undefined ? [] : [bottom]),
      ...chain.layers.map(
        (layer: IAutoMovieLoftChain.ILayer): number => layer.y,
      ),
      ...(top === undefined ? [] : [top]),
    ];
    const values: (readonly number[])[] = [
      ...(bottom === undefined ? [] : [new Array<number>(width).fill(0)]),
      ...chain.layers.map(
        (layer: IAutoMovieLoftChain.ILayer): readonly number[] =>
          layer.coefficients,
      ),
      ...(top === undefined ? [] : [new Array<number>(width).fill(0)]),
    ];
    const coordinates: number[] = stations.map((station: number): number =>
      AutoMovieViewParameter.at(admitted, station),
    );
    if (
      !coordinates.every(
        (coordinate: number, k: number): boolean =>
          k === 0 || coordinate > coordinates[k - 1]!,
      )
    )
      return "coefficient source parameters do not increase through finite intervals";
    const curvatures: number[][] = AutoMovieSeamStation.curvatures(
      coordinates,
      values,
    );
    const slopes: number[][] = AutoMovieSeamStation.slopes(
      coordinates,
      values,
      curvatures,
    );
    const end: (index: number) => IAutoMovieLoftCoefficientSource.IEnd = (
      index: number,
    ): IAutoMovieLoftCoefficientSource.IEnd => ({
      station: stations[index]!,
      value: values[index]!,
      slope: slopes[index]!,
      curvature: curvatures[index]!,
    });
    const ends: IAutoMovieLoftCoefficientSource.IEnds = {
      ...(bottom === undefined ? {} : { bottom: end(0) }),
      ...(top === undefined ? {} : { top: end(stations.length - 1) }),
    };
    const layers: Layer[] = [];
    for (let k: number = 0; k < chain.layers.length; k++) {
      const layer: IAutoMovieLoftChain.ILayer = chain.layers[k]!;
      const index: number = k + (bottom === undefined ? 0 : 1);
      const change: [number, number] | null = forward(admitted, layer.y);
      if (change === null)
        return `principal layer ${layer.y} has no finite station coefficient 2-jet`;
      const first: number[] = slopes[index]!.map(
        (value: number): number => value * change[0],
      );
      const second: number[] = curvatures[index]!.map(
        (value: number, j: number): number =>
          value * change[0] * change[0] + slopes[index]![j]! * change[1],
      );
      layers.push({
        ...layer,
        slopes: first,
        curvatures: second,
        coefficientSource: {
          parameter: admitted,
          slopes: slopes[index]!,
          curvatures: curvatures[index]!,
          ends,
        },
      });
    }
    return { ...chain, layers };
  }

  /**
   * Parameter span at a station, or null for an ordinary station-Hermite
   * boundary.
   */
  export function controls(
    chain: IAutoMovieLoftChain,
    station: number,
  ): IAutoMovieLoftCoefficientSource.IControls | null {
    const rows: readonly Layer[] = chain.layers;
    let lo: number = 0;
    let hi: number = rows.length - 1;
    while (hi - lo > 1) {
      const middle: number = (lo + hi) >> 1;
      if (rows[middle]!.y <= station) lo = middle;
      else hi = middle;
    }
    const a: Layer = rows[lo]!;
    const b: Layer = rows[hi]!;
    validate(a);
    validate(b);
    const low: boolean = station < rows[0]!.y;
    const high: boolean = station > rows[rows.length - 1]!.y;
    const anchor: Layer = low ? rows[0]! : rows[rows.length - 1]!;
    const source: IAutoMovieLoftCoefficientSource.ISource | undefined =
      low || high ? anchor.coefficientSource : a.coefficientSource;
    if (source === undefined) return null;
    let left: IAutoMovieStationHermite.IEnd;
    let right: IAutoMovieStationHermite.IEnd;
    let from: number;
    let to: number;
    if (low || high) {
      const which: "bottom" | "top" = low ? "bottom" : "top";
      const pole: IAutoMovieLoftCoefficientSource.IEnd | undefined =
        source.ends[which];
      if (pole === undefined || !closed(chain, which)) return null;
      if (pole.station !== poleStation(source.parameter, which))
        throw new Error("coefficient pole endpoint differs from its parameter");
      if (low ? station < pole.station : station > pole.station) return null;
      left = low ? pole : endpoint(anchor);
      right = low ? endpoint(anchor) : pole;
      from = low ? pole.station : anchor.y;
      to = low ? anchor.y : pole.station;
    } else {
      if (
        b.coefficientSource === undefined ||
        !same(source.parameter, b.coefficientSource.parameter)
      )
        return null;
      left = endpoint(a);
      right = endpoint(b);
      from = a.y;
      to = b.y;
    }
    const first: number = AutoMovieViewParameter.at(source.parameter, from);
    const last: number = AutoMovieViewParameter.at(source.parameter, to);
    const coordinate: number = AutoMovieViewParameter.at(
      source.parameter,
      station,
    );
    if (!(last > first))
      throw new Error(
        "coefficient source query has no finite increasing parameter interval",
      );
    const weights: number[][] = [0, 1, 2].map((order: number): number[] =>
      AutoMovieStationHermite.weights(
        (coordinate - first) / (last - first),
        last - first,
        order as 0 | 1 | 2,
        true,
      ),
    );
    return {
      a: left,
      b: right,
      weights,
      change: forward(source.parameter, station),
    };
  }

  /** Physical-station weights of one prepared coefficient span. */
  export function weights(
    controls: IAutoMovieLoftCoefficientSource.IControls,
    order: 0 | 1 | 2,
  ): number[] {
    if (order === 0) return controls.weights[0]!;
    if (controls.change === null)
      throw new Error(
        "a pole has no finite physical-station coefficient 2-jet",
      );
    const [first, second]: [number, number] = controls.change;
    return controls.weights[order]!.map((value: number, k: number): number =>
      order === 1
        ? value * first
        : value * first * first + controls.weights[1]![k]! * second,
    );
  }
}

/**
 * Principal coefficient values remain direct data, with optional explicit
 * pole-coordinate derivatives.
 */
type Layer = IAutoMovieLoftChain.ILayer;

/**
 * Station forward jet computed from the stable inverse map, absent at an actual
 * singularity or nonfinite result.
 */
function forward(
  parameter: IAutoMovieConstructionOutlineParameter,
  station: number,
): [number, number] | null {
  const inverse: [number, number] | null = AutoMovieViewParameter.inverseJet(
    parameter,
    station,
  );
  if (inverse === null || inverse[0] === 0) return null;
  const result: [number, number] = [
    1 / inverse[0],
    -inverse[1] / inverse[0] / inverse[0] / inverse[0],
  ];
  return result;
}

/**
 * Direct layer endpoint in its retained parameter; no parallel value copy can
 * become stale.
 */
function endpoint(layer: Layer): IAutoMovieStationHermite.IEnd {
  return {
    value: layer.coefficients,
    slope: layer.coefficientSource!.slopes,
    curvature: layer.coefficientSource!.curvatures,
  };
}

/**
 * Present interpolation metadata must carry its declared map and matching
 * derivative widths.
 */
function validate(layer: Layer): void {
  const source: IAutoMovieLoftCoefficientSource.ISource | undefined =
    layer.coefficientSource;
  if (
    source !== undefined &&
    (source.parameter === undefined ||
      source.slopes.length !== layer.coefficients.length ||
      source.curvatures.length !== layer.coefficients.length)
  )
    throw new Error(
      `coefficient source at station ${layer.y} has invalid parameter data`,
    );
}

/**
 * Actual closing endpoint membership, independent of the first/last surviving
 * section.
 */
function closed(chain: IAutoMovieLoftChain, end: "bottom" | "top"): boolean {
  return chain.pole?.end === end || chain.opposite?.end === end;
}

/** Station of a real parameter pole, absent on its open side. */
function poleStation(
  parameter: IAutoMovieConstructionOutlineParameter,
  end: "bottom" | "top",
): number | undefined {
  return parameter.type === "angle"
    ? parameter[end]
    : parameter.end === end
      ? parameter.pole
      : undefined;
}

/**
 * Numeric map equality preserves interpolation under value copying without
 * hidden registration identity.
 */
function same(
  a: IAutoMovieConstructionOutlineParameter,
  b: IAutoMovieConstructionOutlineParameter,
): boolean {
  return a.type === "root"
    ? b.type === "root" && a.pole === b.pole && a.end === b.end
    : b.type === "angle" && a.bottom === b.bottom && a.top === b.top;
}

import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

import { AutoMovieSeamStation } from "./AutoMovieSeamStation";
import { AutoMovieStationHermite } from "./AutoMovieStationHermite";
import { AutoMovieViewParameter } from "./AutoMovieViewParameter";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/**
 * New principal-coefficient interpolation in the part's selected common root/angle pole coordinate.
 *
 * @evidence contracts/common.md#principled-implementation Principal coefficient values and finite parameter derivatives define a new interpolant in the common pole coordinate; zero virtual endpoints participate in the same natural solve and station jets follow the chain rule. Variable-fullness source curves are not claimed reproduced exactly between layers.
 * @evidence contracts/common.md#clear-and-simple-design Explicit layer data stores parameter derivatives beside the existing station derivatives; finite virtual pole endpoints extend only an actually closed source end.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not replace the original pole law with a station fit, add rings to hide interpolation error, clamp a derivative or invent a finite station jet at a pole.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes direct coefficient data from callable frame ownership, source curves from the new coefficient interpolant and parameter jets from singular station jets. Scope is axis-centred zero-section caps; ViewLoft obtains each physical pole from the same actual axis at the same closing station.
 * @evidence contracts/performance.md#efficient-algorithms Preparation is O(LW) for L layers and W coefficients; queries bracket in O(log L) and prepare six fixed-size weights per derivative order.
 * @evidence contracts/performance.md#reuse-equivalent-work One parameter-coordinate natural solve prepares all layer/pole derivatives; pole endpoint arrays are shared by the layer records.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned chain owns O(LW) derivative data and at most two O(W) pole records; no registry or global cache retains the preparation.
 */
export namespace AutoMovieLoftCoefficientSource {
  /**
   * A finite virtual endpoint in the chosen coordinate, not a physical-station jet.
   *
   * @evidence contracts/common.md#principled-implementation A closing pole contributes the zero section and its natural-spline parameter jets without placing a degenerate principal layer in the chain.
   * @evidence contracts/common.md#clear-and-simple-design One station and one existing Hermite endpoint layout carry virtual cap data.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite parameter slopes/curvatures make no claim of finite physical-station derivatives.
   * @evidence contracts/common.md#meaningful-documentation Station uses kernel mm and slope/curvature use the selected parameter coordinate.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This endpoint record performs no solve.
   * @evidence contracts/performance.md#reuse-equivalent-work Every retained layer shares the same prepared cap endpoint arrays.
   * @evidence contracts/performance.md#bound-retention-and-release-resources At most two O(W) records belong to one prepared capped chain.
   */
  export interface IEnd extends AutoMovieStationHermite.IEnd {
    /** Actual pole station, kernel mm. */
    station: number;

    /** Finite first derivatives in the chosen parameter, rather than per-mm station derivatives. */
    slope: readonly number[];

    /** Finite second derivatives in the chosen coordinate. */
    curvature: readonly number[];
  }

  /**
   * Optional virtual coefficient endpoints for actual closing ends.
   *
   * @evidence contracts/common.md#principled-implementation Only a declared bottom/top pole receives a virtual zero section at its original station.
   * @evidence contracts/common.md#clear-and-simple-design Two optional records distinguish open ends from single/both caps.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Absence does not invent a cap or extend an open end.
   * @evidence contracts/common.md#meaningful-documentation Members identify which end owns each finite parameter endpoint.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Endpoint data executes no algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work One endpoint object is shared across its chain's layer records.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Its retaining layers own at most two endpoint references and their arrays.
   */
  export interface IEnds {
    /** Virtual zero section of a bottom cap; absent at an open bottom. */
    bottom?: IEnd;

    /** Virtual zero section of a top cap; absent at an open top. */
    top?: IEnd;
  }

  /**
   * Direct parameter-derivative data of one principal coefficient row.
   *
   * @evidence contracts/common.md#principled-implementation The layer's existing coefficients remain its values; these arrays supply their first/second derivatives in the explicit map, so equal-value copies retain the same interpolation.
   * @evidence contracts/common.md#clear-and-simple-design One map, two derivative arrays and shared endpoint data extend the existing principal-layer definition without a hidden source-value copy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A transformed endpoint must explicitly remove/re-express this parameter data; mismatched or absent endpoint maps select the documented station-Hermite boundary, never a fitted source.
   * @evidence contracts/common.md#meaningful-documentation Arrays use the existing coefficient layout; source data and the chain are immutable after preparation, as required by existing station caches.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This stored interpolation record executes no evaluation.
   * @evidence contracts/performance.md#reuse-equivalent-work Queries share the parameter derivative arrays and virtual cap endpoints.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Each layer owns O(W) parameter derivatives and shares one map/end record; no full source table is duplicated per layer.
   */
  export interface ISource {
    /** Admitted root/angle map with kernel-mm endpoints. */
    parameter: AutoMovieConstructionOutlineParameter;

    /** First derivative of the layer's coefficients in that map. */
    slopes: readonly number[];

    /** Second derivative of the same coefficient row in that map. */
    curvatures: readonly number[];

    /** Shared finite virtual pole records. */
    ends: IEnds;
  }

  /**
   * One parameter span's direct endpoint arrays and three interpolation-weight rows.
   *
   * @evidence contracts/common.md#principled-implementation Parameter Hermite weights and the forward map's optional station change define value and both physical derivative orders.
   * @evidence contracts/common.md#clear-and-simple-design Existing Hermite endpoint arrays preserve lazy per-control combination in the consumer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A null change keeps a finite parameter value but supplies no finite physical 2-jet.
   * @evidence contracts/common.md#meaningful-documentation Rows are value/first/second parameter orders; change is dq/ds,d2q/ds2.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This preparation record performs no phase evaluation.
   * @evidence contracts/performance.md#reuse-equivalent-work All phase controls at a station share these endpoint arrays and weights.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A retaining station owns three six-entry rows and borrows two endpoint records; it acquires no external resource.
   */
  export interface IControls {
    /** Lower endpoint values and parameter derivatives. */
    a: AutoMovieStationHermite.IEnd;

    /** Upper endpoint values and parameter derivatives. */
    b: AutoMovieStationHermite.IEnd;

    /** Value/first/second parameter-coordinate Hermite weights. */
    weights: number[][];

    /** Forward parameter derivatives in physical station, or null at a singular/nonfinite 2-jet. */
    change: [number, number] | null;
  }

  /**
   * Prepare the capped coefficient data and carry its regular layer jets to station.
   *
   * @evidence contracts/common.md#principled-implementation Adds zero pole rows and solves a new coefficient natural cubic in the selected common pole coordinate, then converts regular layer jets by both chain-rule orders. The caller supplies axis-centred physical poles, not arbitrary off-axis fan closures.
   * @evidence contracts/common.md#clear-and-simple-design One preparation returns a new layer table with explicit parameter data and unchanged coefficient values.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses mismatched closure, nonincreasing parameter knots or nonfinite derivatives; no synthetic section, tolerance adjustment or finite pole-station derivative is substituted.
   * @evidence contracts/common.md#meaningful-documentation Input parameter and stations use kernel mm; failures return the premise string and do not mutate the input chain.
   * @evidence contracts/performance.md#efficient-algorithms O(LW) natural solves and conversions allocate only retained derivative rows, two cap rows and linear scratch.
   * @evidence contracts/performance.md#reuse-equivalent-work Curvature results feed parameter slopes, regular station derivatives and both virtual cap endpoints once.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Failure releases local tables; success owns new derivative arrays and shares original coefficient/frame fields plus fixed pole records.
   */
  export function prepare(
    chain: IAutoMovieLoftChain,
    parameter: AutoMovieConstructionOutlineParameter,
  ): IAutoMovieLoftChain | string {
    const admitted: AutoMovieConstructionOutlineParameter | undefined | string =
      AutoMovieViewParameter.prepare(parameter);
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
          Number.isFinite(coordinate) &&
          (k === 0 || coordinate > coordinates[k - 1]!),
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
    if (
      ![...curvatures, ...slopes].every((row: number[]): boolean =>
        row.every(Number.isFinite),
      )
    )
      return "coefficient source has a nonfinite parameter derivative";
    const end: (index: number) => IEnd = (index: number): IEnd => ({
      station: stations[index]!,
      value: values[index]!,
      slope: slopes[index]!,
      curvature: curvatures[index]!,
    });
    const ends: IEnds = {
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
      if (![...first, ...second].every(Number.isFinite))
        return `principal layer ${layer.y} has nonfinite station coefficient derivatives`;
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
   * Parameter span at a station, or null for an ordinary station-Hermite boundary.
   *
   * @evidence contracts/common.md#principled-implementation Reads actual principal values with their parameter jets; an owned cap uses its virtual pole row before the first/after the last surviving section.
   * @evidence contracts/common.md#clear-and-simple-design One binary bracket and shared-map decision prepare endpoints for all phase controls.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid present metadata throws; only missing/different maps or a genuinely unowned range return null for the caller's existing path.
   * @evidence contracts/common.md#meaningful-documentation Checks parameter domains and row widths, not arbitrary caller-supplied numeric correctness; immutable prepared data remains the producer premise.
   * @evidence contracts/performance.md#efficient-algorithms O(log L) bracketing and constant map/weight work avoid eager O(W) coefficient combination.
   * @evidence contracts/performance.md#reuse-equivalent-work The returned preparation shares stored endpoint jets across every phase read at the station.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns fixed-size weight rows and borrowed endpoints; no module cache retains the chain.
   */
  export function controls(
    chain: IAutoMovieLoftChain,
    station: number,
  ): IControls | null {
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
    const source: ISource | undefined =
      low || high ? anchor.coefficientSource : a.coefficientSource;
    if (source === undefined) return null;
    let left: AutoMovieStationHermite.IEnd;
    let right: AutoMovieStationHermite.IEnd;
    let from: number;
    let to: number;
    if (low || high) {
      const which: "bottom" | "top" = low ? "bottom" : "top";
      const pole: IEnd | undefined = source.ends[which];
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
    if (![first, last, coordinate].every(Number.isFinite) || !(last > first))
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

  /**
   * Physical-station weights of one prepared coefficient span.
   *
   * @evidence contracts/common.md#principled-implementation Converts parameter weights by dq/ds and d2q/ds2 for both derivative orders; value weights remain finite at the pole.
   * @evidence contracts/common.md#clear-and-simple-design The existing lazy/eager Hermite consumers use the same six-weight array representation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A singular physical derivative request throws instead of producing a finite endpoint Taylor jet.
   * @evidence contracts/common.md#meaningful-documentation Order zero reads the finite value; orders one/two require the prepared finite forward 2-jet.
   * @evidence contracts/performance.md#efficient-algorithms Six fixed scalar combinations take constant work and storage.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the station's prepared parameter basis and map derivatives across all controls.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns weights and retains no span or chain.
   */
  export function weights(controls: IControls, order: 0 | 1 | 2): number[] {
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

/** Principal coefficient values remain direct data, with optional explicit pole-coordinate derivatives. */
type Layer = IAutoMovieLoftChain.ILayer;

/** Station forward jet computed from the stable inverse map, absent at an actual singularity or nonfinite result. */
function forward(
  parameter: AutoMovieConstructionOutlineParameter,
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
  return result.every(Number.isFinite) ? result : null;
}

/** Direct layer endpoint in its retained parameter; no parallel value copy can become stale. */
function endpoint(layer: Layer): AutoMovieStationHermite.IEnd {
  return {
    value: layer.coefficients,
    slope: layer.coefficientSource!.slopes,
    curvature: layer.coefficientSource!.curvatures,
  };
}

/** Present interpolation metadata must carry its declared map and matching derivative widths. */
function validate(layer: Layer): void {
  const source: AutoMovieLoftCoefficientSource.ISource | undefined =
    layer.coefficientSource;
  if (
    source !== undefined &&
    (source.parameter === undefined ||
      !Number.isFinite(AutoMovieViewParameter.at(source.parameter, layer.y)) ||
      source.slopes.length !== layer.coefficients.length ||
      source.curvatures.length !== layer.coefficients.length)
  )
    throw new Error(
      `coefficient source at station ${layer.y} has invalid parameter data`,
    );
}

/** Actual closing endpoint membership, independent of the first/last surviving section. */
function closed(chain: IAutoMovieLoftChain, end: "bottom" | "top"): boolean {
  return chain.pole?.end === end || chain.opposite?.end === end;
}

/** Station of a real parameter pole, absent on its open side. */
function poleStation(
  parameter: AutoMovieConstructionOutlineParameter,
  end: "bottom" | "top",
): number | undefined {
  return parameter.type === "angle"
    ? parameter[end]
    : parameter.end === end
      ? parameter.pole
      : undefined;
}

/** Numeric map equality preserves interpolation under value copying without hidden registration identity. */
function same(
  a: AutoMovieConstructionOutlineParameter,
  b: AutoMovieConstructionOutlineParameter,
): boolean {
  return a.type === "root"
    ? b.type === "root" && a.pole === b.pole && a.end === b.end
    : b.type === "angle" && a.bottom === b.bottom && a.top === b.top;
}

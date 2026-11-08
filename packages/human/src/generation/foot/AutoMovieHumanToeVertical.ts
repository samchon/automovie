import {
  AutoMovieViewOutline,
  AutoMovieViewParameter,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { AutoMovieHumanFootConnection } from "./AutoMovieHumanFootConnection";

/** Source value with first/second physical-station derivatives. */
type Scalar = [number, number, number];

/**
 * A toe's origin and plantar edge as one same-clock linear source combination.
 *
 * @evidence contracts/common.md#principled-implementation Root and hidden contacts read the actual parent full field; H=R+P, upper=R and lower=-R share one angle clock, knot partition and two normalized jets.
 * @evidence contracts/common.md#clear-and-simple-design One original vertical owner supplies axis, two radial curves and the nonnegative absolute plantar source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No independent physical-affine height, point clamp, global dorsal depth or absent-jet zero replacement supplies attachment placement.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes local chord transfer and retained distal depth from a complete shared contact arc, measured joint or cap G2 certificate.
 * @evidence contracts/performance.md#efficient-algorithms A fixed five-knot family uses bounded scalar preparations and constant-time-sized query closures, without loft construction.
 * @evidence contracts/performance.md#reuse-equivalent-work All final curves derive from the same admitted radial/plantar originals and explicit parameter jets.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A toe definition owns four finite outlines, their prepared readers and two parent contacts; no persistent cache or handle exists.
 */
export namespace AutoMovieHumanToeVertical {
  /** Full original vertical curves plus their actual parent contact authority. */
  export interface ISource {
    /** Original world-height axis curve, mm. */
    height: IAutoMovieViewPart.IOutline;
    /** Positive dorsal and negative plantar radial source curves, mm. */
    upper: IAutoMovieViewPart.IOutline;
    /** Negative radial source; height+lower equals plantar under the same clock. */
    lower: IAutoMovieViewPart.IOutline;
    /** Nonnegative absolute plantar source, not a bound on a moving relative edge. */
    plantar: IAutoMovieViewPart.IOutline;
    /** Actual parent local chord at the named skin root. */
    root: AutoMovieHumanFootConnection.IChord;
    /** Actual parent local chord at the hidden closing point. */
    hidden: AutoMovieHumanFootConnection.IChord;
    /** Read the four same-clock values without preparing another source. */
    at: (station: number) => [number, number, number, number];
  }

  /**
   * Author root contact and retained distal depth together; unavailable parent jets are not invented.
   *
   * @evidence contracts/common.md#principled-implementation Transfers regular physical chord jets through the actual angle Jacobian and authors every final knot's value/two normalized jets by the same linear combination.
   * @evidence contracts/common.md#clear-and-simple-design Two admitted scalar originals determine four final curves and a shared reading closure.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Range admission refuses incompatible source inputs; it never clamps coordinates or treats singular pole derivatives as finite physical2.
   * @evidence contracts/common.md#meaningful-documentation Identifies root/hidden authority, nonnegative absolute floor and physical-versus-parameter derivative units.
   * @evidence contracts/performance.md#efficient-algorithms The fixed five-station family needs six small scalar preparations plus O(n) knot reads, no mesh or repeated loft.
   * @evidence contracts/performance.md#reuse-equivalent-work Original radial and plantar preparations supply all final values/jets; final preparations are reused by every downstream station reading.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned toe owner retains only its finite original curves/readers and actual parent contact records.
   */
  export function create(
    stations: readonly number[],
    root: AutoMovieHumanFootConnection.IChord,
    hidden: AutoMovieHumanFootConnection.IChord,
    distal: number,
  ): ISource {
    const total: number = stations.at(-1)!;
    const parameter: NonNullable<IAutoMovieViewPart.IOutline["parameter"]> = {
      type: "angle",
      bottom: 0,
      top: total,
    };
    if (
      root.lower === null ||
      root.upper === null ||
      hidden.lower === null ||
      hidden.upper === null
    )
      throw new Error(
        root.unavailable ??
          hidden.unavailable ??
          "Toe contact physical2 unavailable",
      );
    const rootHalf: Scalar = [
      root.depth / 2,
      (root.upper[1] - root.lower[1]) / 2,
      (root.upper[2] - root.lower[2]) / 2,
    ];
    const half: number = distal / 2;
    const radial: IAutoMovieViewPart.IKnot[] = stations.map(
      (station: number, index: number): IAutoMovieViewPart.IKnot => ({
        site:
          index === 0
            ? "hidden start"
            : index + 1 === stations.length
              ? "apex"
              : index === 3
                ? "end"
                : `joint ${index}`,
        station,
        value:
          index === 0 || index + 1 === stations.length
            ? 0
            : index === 1
              ? rootHalf[0]
              : index === 2
                ? (rootHalf[0] + half) / 2
                : half,
        ...(index === 1 ? { jet: convert(rootHalf, parameter, station) } : {}),
      }),
    );
    const radius: IAutoMovieViewPart.IOutline = {
      knots: radial,
      parameter,
      range: { minimum: 0, maximum: null },
    };
    const r: AutoMovieViewOutline.IOutline = prepare(radius, true);
    const plantarKnots: IAutoMovieViewPart.IKnot[] = stations.map(
      (station: number, index: number): IAutoMovieViewPart.IKnot => {
        const radialAt: AutoMovieViewOutline.IReading = read(r, station);
        const height: Scalar =
          index === 0
            ? [
                hidden.centre,
                (hidden.upper![1] + hidden.lower![1]) / 2,
                (hidden.upper![2] + hidden.lower![2]) / 2,
              ]
            : [half, 0, 0];
        const hJet: NonNullable<IAutoMovieViewPart.IKnot["jet"]> =
          index === 0
            ? {
                first: 0,
                second: ((height[1] * total) / 2) * Math.PI * Math.PI,
              }
            : { first: 0, second: 0 };
        const jet: IAutoMovieViewPart.IKnot["jet"] =
          index === 1
            ? convert(root.lower!, parameter, station)
            : index === 0 || index + 1 === stations.length
              ? {
                  first: hJet.first! - radialAt.parameterJet[0] * Math.PI,
                  second:
                    hJet.second! - radialAt.parameterJet[1] * Math.PI * Math.PI,
                }
              : index === 3
                ? { first: 0, second: 0 }
                : undefined;
        return {
          site: radial[index]!.site,
          station,
          value:
            index === 0
              ? hidden.centre
              : index === 1
                ? root.bottom
                : index === 2
                  ? root.bottom / 2
                  : index + 1 === stations.length
                    ? half
                    : 0,
          ...(jet === undefined ? {} : { jet }),
        };
      },
    );
    const p: AutoMovieViewOutline.IOutline = prepare(
      { knots: plantarKnots, parameter, range: { minimum: 0, maximum: null } },
      false,
    );
    const heightKnots: IAutoMovieViewPart.IKnot[] = [];
    const upperKnots: IAutoMovieViewPart.IKnot[] = [];
    const lowerKnots: IAutoMovieViewPart.IKnot[] = [];
    const finalP: IAutoMovieViewPart.IKnot[] = [];
    for (const station of stations) {
      const rv: AutoMovieViewOutline.IReading = read(r, station);
      const pv: AutoMovieViewOutline.IReading = read(p, station);
      const site: string = radial.find(
        (knot: IAutoMovieViewPart.IKnot): boolean => knot.station === station,
      )!.site!;
      const knot: (
        value: number,
        first: number,
        second: number,
      ) => IAutoMovieViewPart.IKnot = (
        value: number,
        first: number,
        second: number,
      ): IAutoMovieViewPart.IKnot => ({
        site,
        station,
        value,
        jet: { first: first * Math.PI, second: second * Math.PI * Math.PI },
      });
      heightKnots.push(
        knot(
          rv.value + pv.value,
          rv.parameterJet[0] + pv.parameterJet[0],
          rv.parameterJet[1] + pv.parameterJet[1],
        ),
      );
      upperKnots.push(knot(rv.value, rv.parameterJet[0], rv.parameterJet[1]));
      lowerKnots.push(
        knot(-rv.value, -rv.parameterJet[0], -rv.parameterJet[1]),
      );
      finalP.push(knot(pv.value, pv.parameterJet[0], pv.parameterJet[1]));
    }
    const height: IAutoMovieViewPart.IOutline = {
      knots: heightKnots,
      parameter,
    };
    const upper: IAutoMovieViewPart.IOutline = { knots: upperKnots, parameter };
    const lower: IAutoMovieViewPart.IOutline = { knots: lowerKnots, parameter };
    const plantar: IAutoMovieViewPart.IOutline = { knots: finalP, parameter };
    const values: AutoMovieViewOutline.IOutline[] = [
      prepare(height, false),
      prepare(upper, true),
      prepare(lower, true),
      prepare(plantar, false),
    ];
    return {
      height,
      upper,
      lower,
      plantar,
      root,
      hidden,
      at: (station: number): [number, number, number, number] =>
        values.map(
          (value: AutoMovieViewOutline.IOutline): number =>
            read(value, station).value,
        ) as [number, number, number, number],
    };
  }
}

/** Convert actual physical jets through the selected angle clock into normalized source jets. */
function convert(
  jet: Scalar,
  parameter: NonNullable<IAutoMovieViewPart.IOutline["parameter"]>,
  station: number,
): NonNullable<IAutoMovieViewPart.IKnot["jet"]> {
  const change: [number, number] | null = AutoMovieViewParameter.jet(
    parameter,
    station,
  );
  if (change === null)
    throw new Error("A regular toe contact needs a finite parameter change");
  const first: number = jet[1] / change[0];
  return {
    first: first * Math.PI,
    second:
      ((jet[2] - first * change[1]) / (change[0] * change[0])) *
      Math.PI *
      Math.PI,
  };
}

/** Admit one declared source, preserving its actual failure. */
function prepare(
  outline: IAutoMovieViewPart.IOutline,
  radial: boolean,
): AutoMovieViewOutline.IOutline {
  const parameter: Extract<
    NonNullable<IAutoMovieViewPart.IOutline["parameter"]>,
    { type: "angle" }
  > = outline.parameter as Extract<
    NonNullable<IAutoMovieViewPart.IOutline["parameter"]>,
    { type: "angle" }
  >;
  const source: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure =
    AutoMovieViewOutline.create(
      outline,
      radial ? { bottom: parameter.bottom, top: parameter.top } : {},
    );
  if ("detail" in source) throw new Error(source.detail);
  return source;
}

/** Read original parameter jets; physical pole derivatives remain absent. */
function read(
  source: AutoMovieViewOutline.IOutline,
  station: number,
): AutoMovieViewOutline.IReading {
  const value: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(
    source,
    station,
  );
  if (typeof value === "string") throw new Error(value);
  return value;
}

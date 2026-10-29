import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanBodyGirth } from "./AutoMovieHumanBodyGirth";
import { AutoMovieHumanBodyLandmarks } from "./AutoMovieHumanBodyLandmarks";
import { AutoMovieHumanTrunkCourses } from "./AutoMovieHumanTrunkCourses";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Measurements of retained curves and explicit source-course bindings.
 * Fixed search windows and the shape basis remain separate unfinished
 * authority; moving these functions does not make them universal.
 */
export namespace AutoMovieHumanBodyWarpMeasures {
  /** Specimen measures, found once per calibration object. */
  export interface ISpecimen {
    /** Material-course addresses bound once on this unchanged source calibration. */
    stations: AutoMovieHumanBodyGirth.IStations;
    /** Whether trunk sites came from explicit authoring guides rather than legacy acquisition. */
    guided: boolean;
    /** Source geometric landmarks; these are not clinical joint pivots. */
    marks: AutoMovieHumanBodyLandmarks.ILandmarks;
    /** Paired anterior-apex span on the declared source chest course, mm. */
    bust: number;

    /** Upper-arm and forearm axis lengths per arm chain, mm. */
    arms: Map<string, [number, number]>;
  }

  /**
   * Axis lengths of an arm's upper arm (top ring to elbow) and forearm
   * (elbow to wrist), mm.
   */
  export function segments(
    chain: IAutoMovieHumanLoftChain,
    s: Record<"bicep" | "elbow" | "forearm" | "wrist", number>,
  ): [number, number] {
    const a: [number, number, number] = AutoMovieHumanLoftChain.axis(
      chain,
      top(chain),
    );
    const e: [number, number, number] = AutoMovieHumanLoftChain.axis(
      chain,
      s.elbow,
    );
    const w: [number, number, number] = AutoMovieHumanLoftChain.axis(
      chain,
      s.wrist,
    );
    return [
      Math.hypot(a[0] - e[0], a[1] - e[1], a[2] - e[2]),
      Math.hypot(e[0] - w[0], e[1] - w[1], e[2] - w[2]),
    ];
  }

  /** Body controls the law reads, besides height. */
  export const MEASURES: string[] = [
    "chest",
    "underbust",
    "waist",
    "highHip",
    "hip",
    "neck",
    "neckBase",
    "thigh",
    "knee",
    "calf",
    "bicep",
    "elbow",
    "forearm",
    "wrist",
    "handCircumference",
    "inseam",
    "upperArmLength",
    "lowerArmLength",
    "neckLength",
    "acrossShoulder",
    "bustSpan",
  ];

  /** Uniform phases of measured sections. */
  export const PHASES: number[] = Array.from(
    { length: 128 },
    (_: unknown, i: number): number => (2 * Math.PI * i) / 128,
  );

  /** Specimen measures by calibration object. */
  const SPECIMENS: WeakMap<IAutoMovieHumanBodyCalibration, ISpecimen> =
    new WeakMap();

  /** Specimen measures, computed on first use. */
  export function cached(
    specimen: IAutoMovieHumanBodyCalibration,
    chains: Map<string, IAutoMovieHumanLoftChain>,
    crotch: number,
  ): ISpecimen {
    let found: ISpecimen | undefined = SPECIMENS.get(specimen);
    if (found === undefined) {
      const stations: AutoMovieHumanBodyGirth.IStations =
        AutoMovieHumanBodyGirth.stations(chains, crotch);
      const guide: AutoMovieHumanTrunkCourses.IGuide | undefined =
        AutoMovieHumanTrunkCourses.bind(specimen);
      if (guide !== undefined)
        stations.trunk = {
          chest: guide.chest.station,
          underbust: guide.underbust.station,
          waist: guide.waist.station,
          highHip: guide.highHip.station,
          hip: guide.hip.station,
        };
      found = {
        stations,
        guided: guide !== undefined,
        marks: AutoMovieHumanBodyLandmarks.measure(specimen),
        bust: span(chains.get("trunk")!, stations.trunk.chest),
        arms: new Map(
          [...stations.arms].map(
            ([name, s]: [
              string,
              Record<"bicep" | "elbow" | "forearm" | "wrist", number>,
            ]): [string, [number, number]] => [
              name,
              segments(chains.get(name)!, s),
            ],
          ),
        ),
      };
      SPECIMENS.set(specimen, found);
    }
    return found;
  }

  /**
   * Lateral distance between the two forward-most points of a trunk
   * section, one on each side of its centre: the bust span at the chest.
   */
  export function span(chain: IAutoMovieHumanLoftChain, s: number): number {
    const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
      chain,
      s,
      PHASES,
    );
    const c: [number, number, number] = AutoMovieHumanLoftChain.axis(chain, s);
    const apex: (side: 1 | -1) => number = (side: 1 | -1): number => {
      let best: [number, number, number] = c;
      for (const p of ring)
        if (side * (p[2] - c[2]) > 0 && p[0] > best[0]) best = p;
      return best[2];
    };
    return apex(1) - apex(-1);
  }

  /** Reference address for every existing measured() consumer. */
  export function reference(
    cache: ISpecimen,
    source: Map<string, IAutoMovieHumanLoftChain>,
    name: string,
    chain: string,
  ): number {
    const c: IAutoMovieHumanLoftChain = source.get(chain)!;
    if (name === "neckBase") return top(c) - 1;
    if (name === "neck" || name === "handCircumference")
      return (c.layers[0]!.y + top(c)) / 2;
    const courses: Record<string, number> | undefined =
      chain === "trunk"
        ? cache.stations.trunk
        : (cache.stations.legs.get(chain) ?? cache.stations.arms.get(chain));
    const station: number | undefined = courses?.[name];
    if (station === undefined)
      throw new Error("Missing internal reference course: " + chain + "/" + name);
    return station;
  }

  /**
   * Positive section scaling under authored girth/span constraints.
   * This operates at a declared inserted course. It is not a claim about
   * the position of a new extremum elsewhere in the returned loft.
   * Incompatible requests keep a finite existing map and remain recorded.
   */
  export function anisotropic(
    chain: IAutoMovieHumanLoftChain,
    station: number,
    girth: number,
    lateral: number,
    pins: { girth: boolean; lateral: boolean },
    diagnostics: IAutoMovieHumanBodyCalibration.IDeformationDiagnostic[],
  ): [number, number] {
    const circumference: number = AutoMovieHumanBodyGirth.at(chain, station);
    const sourceSpan: number = span(chain, station);
    const target: number = circumference * girth;
    const finite: boolean =
      [girth, lateral, circumference, target, sourceSpan].every(
        (v: number): boolean => Number.isFinite(v) && v > 0,
      );
    const minimum: number = finite
      ? AutoMovieHumanBodyGirth.at(chain, station, [0, lateral])
      : Infinity;
    let result: [number, number] | undefined;
    if (finite && Number.isFinite(minimum) && target > minimum) {
      let hi: number = Math.max(1, girth, lateral);
      let value: number = AutoMovieHumanBodyGirth.at(chain, station, [hi, lateral]);
      while (Number.isFinite(value) && value < target && hi <= Number.MAX_VALUE / 2) {
        hi *= 2;
        value = AutoMovieHumanBodyGirth.at(chain, station, [hi, lateral]);
      }
      if (Number.isFinite(value) && value >= target) {
        const solved: { scale: number; achieved: number } | undefined =
          solvePositive(
            (scale: number): number =>
              AutoMovieHumanBodyGirth.at(chain, station, [scale, lateral]),
            target, [0, hi],
          );
        if (solved !== undefined) result = [solved.scale, lateral];
      }
    }
    if (result !== undefined) return result;

    // A pin is an explicit authoring priority. Without a unique pin the
    // request supplies no ranking, so keep the current finite course.
    const validGirth: boolean = Number.isFinite(girth) && girth > 0;
    const validLateral: boolean = Number.isFinite(lateral) && lateral > 0;
    result =
      pins.girth && !pins.lateral && validGirth
        ? [girth, girth]
        : pins.lateral && !pins.girth && validLateral
          ? [lateral, lateral]
          : [1, 1];
    let achieved: number = AutoMovieHumanBodyGirth.at(chain, station, result);
    const controls: number[] = AutoMovieHumanLoftChain.coefficients(chain, station);
    const representable: boolean = controls.every(
      (v: number, i: number): boolean =>
        Number.isFinite(v * result![i < chain.order ? 0 : 1]!),
    );
    if (!(representable && Number.isFinite(achieved) &&
      Number.isFinite(sourceSpan * result[1]))) {
      result = [1, 1];
      achieved = circumference;
    }
    diagnostics.push({
      name: "chest",
      status: finite ? "incompatible" : "invalid",
      ...(Number.isFinite(target) ? { requested: target } : {}),
      ...(Number.isFinite(achieved) ? { achieved } : {}),
      detail:
        "No representable positive depth satisfies both requests; only a unique pinned " +
        "control has priority, otherwise the current course is retained.",
    });
    diagnostics.push({
      name: "bustSpan",
      status: finite ? "incompatible" : "invalid",
      ...(Number.isFinite(sourceSpan * lateral)
        ? { requested: sourceSpan * lateral }
        : {}),
      ...(Number.isFinite(sourceSpan * result[1])
        ? { achieved: sourceSpan * result[1] } : {}),
      detail: "This unresolved span is not silently clamped or called achieved.",
    });
    return result;
  }

  /**
   * Bracketed positive scalar constraint on the caller's actual output.
   * The callback must evaluate the same final geometry and return a finite,
   * continuous monotone quantity over the supplied geometric bracket.
   * Undefined records an unresolved constraint at its caller, never a
   * whole-figure exception or an invented scale clamp.
   */
  export function solvePositive(
    evaluate: (scale: number) => number | undefined,
    target: number,
    bracket: readonly [number, number],
  ): { scale: number; achieved: number } | undefined {
    let lo: number = bracket[0];
    let hi: number = bracket[1];
    if (
      !Number.isFinite(target) || !(target > 0) ||
      !Number.isFinite(lo) || !Number.isFinite(hi) || !(lo >= 0 && hi > lo)
    ) return undefined;
    let a: number | undefined = evaluate(lo);
    let b: number | undefined = evaluate(hi);
    if (
      a === undefined || b === undefined ||
      !Number.isFinite(a) || !Number.isFinite(b) ||
      !(a <= target && target <= b) || !(a < b)
    ) return undefined;
    for (let i: number = 0; i < 53; i++) {
      const mid: number = lo + (hi - lo) / 2;
      if (mid === lo || mid === hi) break;
      const value: number | undefined = evaluate(mid);
      if (
        value === undefined || !Number.isFinite(value) ||
        value < a || value > b
      ) return undefined;
      if (value === target)
        return mid > 0 ? { scale: mid, achieved: value } : undefined;
      if (value < target) { lo = mid; a = value; }
      else { hi = mid; b = value; }
    }
    const scale: number = lo + (hi - lo) / 2;
    const achieved: number | undefined = evaluate(scale);
    return scale > 0 && achieved !== undefined && Number.isFinite(achieved)
      ? { scale, achieved } : undefined;
  }

  /** Top station in the source chart, not a joint height. */
  export function top(chain: IAutoMovieHumanLoftChain): number {
    return chain.layers[chain.layers.length - 1]!.y;
  }

  /** Existing chains by identity; no alias or person selector is introduced. */
  export function named(
    body: IAutoMovieHumanBodyCalibration,
  ): Map<string, IAutoMovieHumanLoftChain> {
    return new Map(
      body.chains.map(
        (c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] =>
          [c.name, c],
      ),
    );
  }
}

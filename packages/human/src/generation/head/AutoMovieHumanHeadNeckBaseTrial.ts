import {
  AutoMovieNativeCoordinate,
  AutoMovieViewOutline,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
  measureAutoMovieCurveLength64,
} from "@automovie/engine";

import type { AutoMovieHumanHeadNeckCurves } from "./AutoMovieHumanHeadNeckCurves";
import { AutoMovieHumanHeadNeckScalars } from "./AutoMovieHumanHeadNeckScalars";

/** A complete radius-dependent original neck trial, before any emitted curve or loft. */
export namespace AutoMovieHumanHeadNeckBaseTrial {
  /** One actual source and its requested numerical observation; no prepared callback survives. */
  export interface IOutput {
    /** Actual root-parameter radius declaration, calibration mm. */
    readonly radius: IAutoMovieViewPart.IOutline;

    /** Actual physical-Y axis declaration, calibration mm. */
    readonly centre: IAutoMovieViewPart.IOutline;

    /** Actual finite-clock height declaration with this trial's side phase. */
    readonly height: IAutoMovieViewPart.IOutline;

    /** Positive-Z original polar phase of the authored AP-plane intersection. */
    readonly sidePhase: number;

    /** Engine GL8 K/2K reading of these exact numeric declarations. */
    readonly measured: ReturnType<typeof measureAutoMovieCurveLength64>;

    /** Actual front, left, C7 and right points, calibration mm. */
    readonly points: [number, number, number][];

    /** Their closed chord polygon, a necessary lower bound only. */
    readonly polygon: number;
  }

  /** Native polar data of the immutable normal template, independent of every world radius/height trial. */
  export interface IPolarReading {
    /** Original radial value and its first/second polar derivatives, calibration mm. */
    readonly jet: readonly [number, number, number];

    /** Cosine of the exact queried native polar parameter. */
    readonly cos: number;

    /** Sine of the exact queried native polar parameter. */
    readonly sin: number;
  }

  /** One native template reader; only fixed-partition query parameters may be retained. */
  export interface IPolar {
    /** Actual quarter/G2 source-piece boundaries in the immutable native radian clock; inspection/refinement samples are separate. */
    readonly boundaries: readonly number[];

    /** False evaluates without retaining a trial-dependent quadrature parameter. */
    at(theta: number, fixedPartition: boolean): IPolarReading;
  }

  /**
   * Reuse only identical binary64 theta readings of this immutable template.
   * Fixed native-piece intervals use the engine's unchanged K/2K nodes;
   * variable height/site/preimage intervals are evaluated without retention.
   * No world radius, station, height, side phase or frame enters this map.
   * Its size is bounded by the fixed source-piece intervals' GL8 K=4/8 nodes,
   * and it is released with this one base solve.
   */
  export function prepareNative(
    template: AutoMovieViewSection.ISection,
    work?: AutoMovieHumanHeadNeckCurves.IWork,
  ): IPolar {
    const readings: Map<number, IPolarReading> = new Map();
    const boundaries: Set<number> = new Set([0, 2 * Math.PI]);
    for (const [q, arc] of template.conics.quarters.entries()) {
      const first: number = (q * Math.PI) / 2;
      const last: number = ((q + 1) * Math.PI) / 2;
      boundaries.add(first);
      boundaries.add(last);
      if (arc.start !== null) boundaries.add(first + arc.start.angle);
      if (arc.end !== null) boundaries.add(last - arc.end.angle);
    }
    return {
      boundaries: [...boundaries].sort((a: number, b: number): number => a - b),
      at(theta: number, fixedPartition: boolean): IPolarReading {
        const previous: IPolarReading | undefined = fixedPartition
          ? readings.get(theta)
          : undefined;
        if (previous !== undefined) {
          if (work !== undefined) work.baseNativeReused++;
          return previous;
        }
        const value: IPolarReading = {
          jet: AutoMovieViewSection.radius(template, theta),
          cos: Math.cos(theta),
          sin: Math.sin(theta),
        };
        if (work !== undefined) work.baseNativeEvaluations++;
        if (fixedPartition) readings.set(theta, value);
        return value;
      },
    };
  }

  /**
   * ISO 8559-1 3.1.7 identifies an anterior trapezius border, not a fixed
   * polar angle. IEEE's 2021 Landmarking for Product Development report,
   * Table 5 and section 4.21, uses an AP-depth quarter as a manual starting
   * location together with greatest width and the neck/shoulder inflection.
   * Here the posterior quarter-depth plane is a declared caliper proxy;
   * its posterior orientation is an authoring choice, not the report's
   * specified direction or a measured clinical landmark. Actual greatest
   * width, ridge anatomy and whole course still require observation.
   * The plane intersects this same native family at the public side height.
   * No f1 tape residual, reference coordinate or finished curve chooses it.
   *
   * @evidence contracts/common.md#principled-implementation Intersects a declared AP plane with the same original native section, authors that trial's height spans, and measures their full physical derivative through the existing engine GL8 owner.
   * @evidence contracts/common.md#clear-and-simple-design One trial returns its radius, shared centre, height, actual named points and integral; no emitted geometry or second neck source supplies them.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retains native inverse/admission, actual scalar jets and original parameters without a reference fit, finite difference, forced phase, altered target or failed-source fallback.
   * @evidence contracts/common.md#meaningful-documentation Separates the report's starting-location guidance, the chosen posterior orientation and unverified clinical width/inflection correspondence; numerical readings are not tape-contact certificates.
   * @evidence contracts/performance.md#efficient-algorithms One bounded native inverse and at most60 preimage steps per crossed scalar knot precede fixed engine K/2K quadrature on actual native-piece, height-span and radius-preimage boundaries.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the caller's admitted template and prepared invariant centre, preparing radius and height once for this trial; only exact-theta native data on unchanged fixed intervals can be reused, while varying phase/height/world data never crosses radius trials.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Preparations and callbacks end with the synchronous measurement; only numeric declarations, four points and small integral metadata return.
   */
  export function create(
    input: AutoMovieHumanHeadNeckCurves.IInputs,
    family: AutoMovieHumanHeadNeckScalars.IOutput,
    template: AutoMovieViewSection.ISection,
    extents: readonly [number, number, number, number],
    base: number,
    work?: AutoMovieHumanHeadNeckCurves.IWork,
    sharedPolar?: IPolar,
  ): IOutput {
    const radius: IAutoMovieViewPart.IOutline = family.radius(base);
    const centre: IAutoMovieViewPart.IOutline = family.centre;
    const radial: AutoMovieViewOutline.IOutline = prepareScalar(radius);
    const axis: AutoMovieViewOutline.IOutline = family.preparedCentre;
    const r: number = input.neck.radius;
    const frontY: number = input.base.suprasternaleHeight;
    const backY: number = input.base.cervicaleHeight;
    const sideY: number = input.base.sideNeckPointHeight;
    const frontX: number =
      read(axis, frontY).value + (read(radial, frontY).value * extents[0]) / r;
    const backX: number =
      read(axis, backY).value - (read(radial, backY).value * extents[2]) / r;
    const sideX: number = backX + (frontX - backX) / 4;
    const q: number = read(radial, sideY).value / r;
    const located: AutoMovieNativeCoordinate.IResult =
      AutoMovieNativeCoordinate.locate(
        {
          extents: [
            q * extents[0],
            q * extents[1],
            q * extents[2],
            q * extents[3],
          ],
          shoulders: [
            AutoMovieViewSection.ELLIPSE,
            AutoMovieViewSection.ELLIPSE,
            AutoMovieViewSection.ELLIPSE,
            AutoMovieViewSection.ELLIPSE,
          ],
        },
        0,
        1,
        sideX - read(axis, sideY).value,
      );
    const height: IAutoMovieViewPart.IOutline =
      AutoMovieHumanHeadNeckScalars.height(input, located.phase);
    const preparedHeight: AutoMovieViewOutline.IOutline = prepareScalar(height);
    const native: IPolar = sharedPolar ?? prepareNative(template, work);

    // Only actual rational-piece joins belong to the source partition.
    // The template's observation knots refine inspection/native quadrature;
    // they neither define this polar course nor replace its K4/K8 check.
    const fixed: Set<number> = new Set(
      native.boundaries.map(
        (angle: number): number => family.clock * (angle / (2 * Math.PI)),
      ),
    );
    const cuts: number[] = height.knots.map(
      (knot: IAutoMovieViewPart.IKnot): number => knot.station,
    );
    cuts.push(...fixed);

    // Each trial has different height spans. Split at the actual radius-knot
    // numerical preimages, not a previous radius's quadrature population.
    for (let i: number = 0; i + 1 < height.knots.length; i++) {
      const a: IAutoMovieViewPart.IKnot = height.knots[i]!;
      const b: IAutoMovieViewPart.IKnot = height.knots[i + 1]!;
      for (const knot of radius.knots) {
        const y: number = knot.station;
        if (!(y > Math.min(a.value, b.value) && y < Math.max(a.value, b.value)))
          continue;
        let lo: number = a.station;
        let hi: number = b.station;
        for (let k: number = 0; k < 60; k++) {
          const middle: number = (lo + hi) / 2;
          if (middle === lo || middle === hi) break;
          if (read(preparedHeight, middle).value < y === a.value < b.value)
            lo = middle;
          else hi = middle;
        }
        cuts.push((lo + hi) / 2);
      }
    }
    const partition: number[] = [...new Set(cuts)].sort(
      (a: number, b: number): number => a - b,
    );
    const turn: number = (2 * Math.PI) / family.clock;
    if (work !== undefined) work.baseMeasurements++;
    const measured: ReturnType<typeof measureAutoMovieCurveLength64> =
      measureAutoMovieCurveLength64(
        partition
          .slice(1)
          .map(
            (
              end: number,
              i: number,
            ): Parameters<typeof measureAutoMovieCurveLength64>[0][number] => ({
              domain: [partition[i]!, end],
              derivative(s: number): [number, number, number] {
                if (work !== undefined) {
                  work.baseFixedQueries++;
                  work.baseRadiusQueries++;
                }
                const y: AutoMovieViewOutline.IReading = read(
                  preparedHeight,
                  s,
                );
                const radiusAt: AutoMovieViewOutline.IReading = read(
                  radial,
                  y.value,
                );
                const origin: AutoMovieViewOutline.IReading = read(
                  axis,
                  y.value,
                );
                const theta: number = (2 * Math.PI * s) / family.clock;
                const polar: IPolarReading = native.at(
                  theta,
                  fixed.has(partition[i]!) && fixed.has(end),
                );
                const jet: IPolarReading["jet"] = polar.jet;
                const u: number = jet[0] * polar.cos;
                const v: number = jet[0] * polar.sin;
                const du: number = jet[1] * polar.cos - jet[0] * polar.sin;
                const dv: number = jet[1] * polar.sin + jet[0] * polar.cos;
                const dy: number = y.stationJet![0];
                const q: number = radiusAt.value / r;
                const dq: number = (radiusAt.stationJet![0] * dy) / r;
                return [
                  origin.stationJet![0] * dy + dq * u + q * du * turn,
                  dy,
                  dq * v + q * dv * turn,
                ];
              },
            }),
          ),
        4,
      );
    const points: [number, number, number][] = height.knots
      .slice(0, 4)
      .map((knot: IAutoMovieViewPart.IKnot): [number, number, number] => {
        const theta: number = (2 * Math.PI * knot.station) / family.clock;
        const rho: number =
          (read(radial, knot.value).value / r) *
          AutoMovieViewSection.radius(template, theta)[0];
        return [
          read(axis, knot.value).value + rho * Math.cos(theta),
          knot.value,
          rho * Math.sin(theta),
        ];
      });
    const polygon: number = points.reduce(
      (sum: number, point: [number, number, number], i: number): number =>
        sum +
        Math.hypot(
          ...point.map(
            (value: number, k: number): number =>
              value - points[(i + 1) % points.length]![k]!,
          ),
        ),
      0,
    );
    return {
      radius,
      centre,
      height,
      sidePhase: located.phase,
      measured,
      points,
      polygon,
    };
  }
}

/** Prepare an actual numeric declaration; original admission failures remain failures. */
function prepareScalar(
  outline: IAutoMovieViewPart.IOutline,
): AutoMovieViewOutline.IOutline {
  const prepared: ReturnType<typeof AutoMovieViewOutline.create> =
    AutoMovieViewOutline.create(outline);
  if ("detail" in prepared)
    throw new Error("Neck original source: " + prepared.detail);
  return prepared;
}

/** Read the actual regular physical/clock jet, including a valid zero derivative. */
function read(
  outline: AutoMovieViewOutline.IOutline,
  station: number,
): AutoMovieViewOutline.IReading {
  const result: ReturnType<typeof AutoMovieViewOutline.at> =
    AutoMovieViewOutline.at(outline, station);
  if (typeof result === "string") throw new Error(result);
  if (result.stationJet === null)
    throw new Error("Neck original course has no regular derivative");
  return result;
}

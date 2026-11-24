import {
  AutoMovieNativeCoordinate,
  AutoMovieViewOutline,
  AutoMovieViewSection,
  measureAutoMovieCurveLength64,
} from "@automovie/engine";
import type {
  IAutoMovieHumanHeadNeckBaseTrial,
  IAutoMovieHumanHeadNeckCurves,
  IAutoMovieHumanHeadNeckScalars,
  IAutoMovieNativeCoordinate,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
  IAutoMovieViewSection,
} from "@automovie/interface";

import { AutoMovieHumanHeadNeckScalars } from "./AutoMovieHumanHeadNeckScalars";

/** A complete radius-dependent original neck trial, before any emitted curve or loft. */
export namespace AutoMovieHumanHeadNeckBaseTrial {
  /**
   * Prepare the exact GL8 K=4/8 nodes of the immutable native pieces in the
   * shared tape clock. A varying height/site/preimage split uses direct reads.
   * One base solve owns this finite preparation.
   */
  export function prepareNative(
    template: IAutoMovieViewSection.ISection,
    clock: number,
    work?: IAutoMovieHumanHeadNeckCurves.IWork,
  ): IAutoMovieHumanHeadNeckBaseTrial.IPolar {
    const boundaries: Set<number> = new Set([0, 2 * Math.PI]);
    for (const [q, arc] of template.conics.quarters.entries()) {
      const first: number = (q * Math.PI) / 2;
      const last: number = ((q + 1) * Math.PI) / 2;
      boundaries.add(first);
      boundaries.add(last);
      if (arc.start !== null) boundaries.add(first + arc.start.angle);
      if (arc.end !== null) boundaries.add(last - arc.end.angle);
    }
    const stations: number[] = [
      ...new Set(
        Array.from(
          boundaries,
          (angle: number): number => clock * (angle / (2 * Math.PI)),
        ),
      ),
    ].sort((a: number, b: number): number => a - b);
    type Read = (station: number) => IAutoMovieHumanHeadNeckBaseTrial.IPolarReading;
    const read: Read = (
      station: number,
    ): IAutoMovieHumanHeadNeckBaseTrial.IPolarReading => {
      const theta: number = (2 * Math.PI * station) / clock;
      if (work !== undefined) work.baseNativeEvaluations++;
      return {
        jet: AutoMovieViewSection.radius(template, theta),
        cos: Math.cos(theta),
        sin: Math.sin(theta),
      };
    };
    const pieces: Read[] = stations.slice(1).map((last: number, i: number): Read => {
      const nodes: number[] = measureAutoMovieCurveLength64
        .parameters([stations[i]!, last], 4)
        .sort((a: number, b: number): number => a - b);
      const values: IAutoMovieHumanHeadNeckBaseTrial.IPolarReading[] = nodes.map(read);
      return (station: number): IAutoMovieHumanHeadNeckBaseTrial.IPolarReading => {
        let low: number = 0;
        let high: number = nodes.length - 1;
        while (low < high) {
          const middle: number = (low + high) >>> 1;
          if (nodes[middle]! < station) low = middle + 1;
          else high = middle;
        }
        if (nodes[low] !== station)
          throw new Error("Neck native piece requires a declared quadrature node");
        if (work !== undefined) work.baseNativeReused++;
        return values[low]!;
      };
    });
    return {
      stations,
      piece(first: number, last: number): Read {
        const index: number = stations.indexOf(first);
        return index >= 0 && last === stations[index + 1] ? pieces[index]! : read;
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
   * The current person's native tape evaluation chooses it.
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
    input: IAutoMovieHumanHeadNeckCurves.IInputs,
    family: IAutoMovieHumanHeadNeckScalars.IOutput,
    template: IAutoMovieViewSection.ISection,
    extents: IAutoMovieHumanHeadNeckBaseTrial.CreateExtents,
    base: number,
    work?: IAutoMovieHumanHeadNeckCurves.IWork,
    sharedPolar?: IAutoMovieHumanHeadNeckBaseTrial.IPolar,
  ): IAutoMovieHumanHeadNeckBaseTrial.IOutput {
    const radius: IAutoMovieViewPart.IOutline = family.radius(base);
    const centre: IAutoMovieViewPart.IOutline = family.centre;
    const radial: IAutoMovieViewOutline.IOutline = prepareScalar(radius);
    const axis: IAutoMovieViewOutline.IOutline = family.preparedCentre;
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
    const located: IAutoMovieNativeCoordinate.IResult =
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
    const preparedHeight: IAutoMovieViewOutline.IOutline =
      prepareScalar(height);
    const native: IAutoMovieHumanHeadNeckBaseTrial.IPolar =
      sharedPolar ?? prepareNative(template, family.clock, work);

    // Only actual rational-piece joins belong to the source partition.
    // The template's observation knots refine inspection/native quadrature;
    // they neither define this polar course nor replace its K4/K8 check.
    const cuts: number[] = height.knots.map(
      (knot: IAutoMovieViewPart.IKnot): number => knot.station,
    );
    cuts.push(...native.stations);

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
            ): Parameters<typeof measureAutoMovieCurveLength64>[0][number] => {
              const start: number = partition[i]!;
              const polarAt: ReturnType<IAutoMovieHumanHeadNeckBaseTrial.IPolar["piece"]> =
                native.piece(start, end);
              return {
                domain: [start, end],
                derivative(s: number): [number, number, number] {
                if (work !== undefined) {
                  work.baseFixedQueries++;
                  work.baseRadiusQueries++;
                }
                const y: IAutoMovieViewOutline.IReading = read(
                  preparedHeight,
                  s,
                );
                const radiusAt: IAutoMovieViewOutline.IReading = read(
                  radial,
                  y.value,
                );
                const origin: IAutoMovieViewOutline.IReading = read(
                  axis,
                  y.value,
                );
                const polar: IAutoMovieHumanHeadNeckBaseTrial.IPolarReading =
                  polarAt(s);
                const jet: IAutoMovieHumanHeadNeckBaseTrial.IPolarReading["jet"] =
                  polar.jet;
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
              };
            },
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
): IAutoMovieViewOutline.IOutline {
  const prepared: ReturnType<typeof AutoMovieViewOutline.create> =
    AutoMovieViewOutline.create(outline);
  if ("detail" in prepared)
    throw new Error("Neck original source: " + prepared.detail);
  return prepared;
}

/** Read the actual regular physical/clock jet, including a valid zero derivative. */
function read(
  outline: IAutoMovieViewOutline.IOutline,
  station: number,
): IAutoMovieViewOutline.IReading {
  const result: ReturnType<typeof AutoMovieViewOutline.at> =
    AutoMovieViewOutline.at(outline, station);
  if (typeof result === "string") throw new Error(result);
  if (result.stationJet === null)
    throw new Error("Neck original course has no regular derivative");
  return result;
}

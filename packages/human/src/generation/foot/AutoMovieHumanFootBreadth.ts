import {
  type AutoMovieLoftContract,
  type AutoMovieLoftFrame,
  AutoMovieViewOutline,
  type AutoMovieViewParallelAxis,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type {
  AutoMovieConstructionAxis,
  IAutoMovieConstructionKnot,
  IAutoMovieConstructionOutline,
} from "@automovie/interface";

import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import type { AutoMovieHumanSiteControls } from "../limb/AutoMovieHumanSiteControls";
import { AutoMovieHumanFootPart } from "./AutoMovieHumanFootPart";
import { AutoMovieHumanToePart } from "./AutoMovieHumanToePart";

/** A calibration-mm point or a dimensionless direction. */
type Vec3 = [number, number, number];

/**
 * Across support of the actual foot-plus-toe source in its metatarsal region.
 * Fixed up/across planes and explicitly affine horizontal projections reduce each side
 * guide's projection to a constant plus slope*s + scale*edge(s). The engine
 * owns critical candidates, including the both-pole angle's sine term.
 * These binary64 observations are not an interval certificate or a claim
 * about a final loft, join, tape or skeletal foot.
 *
 * @evidence contracts/common.md#principled-implementation Reads the exact production source declarations and the shared scalar support owner in the public foot-axis measuring frame.
 * @evidence contracts/common.md#clear-and-simple-design One regional support reading supplies the coupled across scale without changing source length, height or parameter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampled maximum, fitted residual, inferred affine approximation, point clamp or final mesh supplies the normalization.
 * @evidence contracts/common.md#meaningful-documentation States fixed-plane and explicit affine premises, numerical root scope and absence of final-surface certification.
 * @evidence contracts/performance.md#efficient-algorithms Prepares two scalar sides per fixed-size part; critical work belongs to the engine's bounded source-span solver rather than dense figure sampling.
 * @evidence contracts/performance.md#reuse-equivalent-work Each actual axis and side source is prepared once per measurement and reused for its candidate readings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only call-owned source preparations and two extreme readings survive; no global cache or realized geometry is retained.
 */
export namespace AutoMovieHumanFootBreadth {

  /**
   * The actual source point owning one observed across support, calibration mm.
   *
   * @evidence contracts/common.md#principled-implementation Retains the source name, material station and world point beside its anatomical projection.
   * @evidence contracts/common.md#clear-and-simple-design A single reading identifies the support owner without retaining an entire curve.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The point is read from the source axis and scalar owner, not a sampled loft.
   * @evidence contracts/common.md#meaningful-documentation Members distinguish world point, material station and foot-axis projections.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A reading record declares no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The measure operation owns source preparation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The synchronous caller owns this finite record.
   */
  export interface IReading {

    /** Actual anatomical source name. */

    part: string;

    /** Signed chart side. */

    quarter: 1 | 3;

    /** Material station, calibration mm. */

    station: number;

    /** Original world source point, calibration mm. */

    point: Vec3;

    /** Heel-relative foot-along projection, calibration mm. */

    along: number;

    /** Heel-relative anatomical lateral projection, calibration mm. */

    across: number;
  }

  /**
   * Independent across extrema of the declared anatomical group region.
   *
   * @evidence contracts/common.md#principled-implementation The minimum and maximum may belong to different parts or sections, matching across support-plane breadth.
   * @evidence contracts/common.md#clear-and-simple-design Two owner readings and their difference expose the dimension used by the caller.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not call one ball cut or the bare host the whole group's breadth.
   * @evidence contracts/common.md#meaningful-documentation States the regional union and numerical original-source scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The result type performs no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The measure operation owns reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns both finite readings.
   */
  export interface ISupport {

    /** Lowest anatomical across projection in the region. */

    minimum: IReading;

    /** Highest anatomical across projection in the region. */

    maximum: IReading;

    /** Maximum minus minimum, in the source's calibration-mm across units. */

    breadth: number;
  }

  /**
   * Read the host and all toes over the same closed foot-along region.
   *
   * @evidence contracts/common.md#principled-implementation Measures original production outlines with the engine's affine-plus-scalar critical candidates and reads each candidate through the actual frame and scalar owner.
   * @evidence contracts/common.md#clear-and-simple-design Returns two source owners or the first failed measuring premise; no section or loft is needed.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Requires authored two-endpoint horizontal affine projections, level measuring directions, fixed transverse planes and a positive finite span; arbitrary valid Y contributes zero to those projections and is not falsely assigned a zero derivative.
   * @evidence contracts/common.md#meaningful-documentation Defines the regional union, source failure behavior and binary64 critical-candidate limitation.
   * @evidence contracts/performance.md#efficient-algorithms Visits the fixed host-plus-five-toe inventory once, preparing each axis and two source sides once before shared critical queries.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the supplied final host preparation and each pure toe definition, reusing actual axes and complete side originals for all support candidates.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns only two extreme points or a failure string, without persistent state or skin data.
   */
  export function measure(
    foot: AutoMovieHumanFootPart.IInput,
    toes: readonly AutoMovieHumanToePart.IInput[],
    definition?: AutoMovieHumanSiteViewPart.IDefinition | AutoMovieHumanSiteControls.IOutput,
  ): ISupport | string {
    if (
      foot.metatarsal === undefined ||
      !foot.metatarsal.span.every(Number.isFinite) ||
      !(foot.metatarsal.span[1] > foot.metatarsal.span[0])
    )
      return "Metatarsal group breadth needs a finite increasing foot-along region";
    const declarations: ((AutoMovieHumanSiteViewPart.IDefinition | AutoMovieHumanSiteControls.IOutput) & {
      origin?: AutoMovieViewParallelAxis.IOrigin;
    })[] = [definition ?? AutoMovieHumanFootPart.define(foot)];
    for (const toe of toes) {
      declarations.push(AutoMovieHumanToePart.define(toe));
    }
    const sign: number = foot.side === "left" ? 1 : -1;
    const across: Vec3 = [-sign * foot.along[2], 0, sign * foot.along[0]];
    let minimum: IReading | undefined;
    let maximum: IReading | undefined;
    for (const declaration of declarations) {
      const common: AutoMovieHumanSiteControls.IControls | null =
        "controls" in declaration ? declaration.controls : null;
      const part: Pick<IAutoMovieViewPart, "name" | "axis" | "stations" | "side" | "pole"> | null =
        "controls" in declaration ? common === null ? null : {
          name: common.input.name, axis: common.axis, stations: common.scalars.stations,
          side: common.scalars.side, pole: common.scalars.pole,
        } : declaration.part;
      const chart: AutoMovieConstructionAxis | undefined = "controls" in declaration
        ? common?.input.axis : declaration.view?.axis;
      if (part === null || chart === undefined)
        return (
          declaration.diagnostics
            .map((d: AutoMovieLoftContract.IDiagnostic): string => d.detail)
            .join("; ") || "Group breadth has no prepared source"
        );
      const axis: IAutoMovieViewPart["axis"] = part.axis;
      const velocity: { along: number; across: number } | string = affine(
        chart,
        foot.along,
        across,
        declaration.origin,
      );
      if (typeof velocity === "string") return `${part.name}: ${velocity}`;
      if (part.pole !== "both")
        return `${part.name}: group breadth requires the closed two-pole source`;
      const first: number = part.stations[0]!;
      const last: number = part.stations.at(-1)!;
      const start: AutoMovieLoftFrame.IFrame = axis.at(first);
      if (start.u[0] !== 0 || start.u[1] !== 1 || start.u[2] !== 0)
        return `${part.name}: breadth requires the fixed world-up chart`;
      if (
        start.v[0] !== foot.along[2] ||
        start.v[1] !== 0 ||
        start.v[2] !== -foot.along[0]
      )
        return `${part.name}: breadth requires the defining foot's fixed across chart`;
      const alongSlope: number = velocity.along;
      if (!(alongSlope > 0) || !Number.isFinite(alongSlope))
        return `${part.name}: affine origin does not advance along the foot`;
      const firstAlong: number = dot(
        start.origin.map(
          (value: number, c: number): number => value - foot.heel[c]!,
        ) as Vec3,
        foot.along,
      );
      const domain: [number, number] = [
        Math.max(
          first,
          first + (foot.metatarsal.span[0] - firstAlong) / alongSlope,
        ),
        Math.min(
          last,
          first + (foot.metatarsal.span[1] - firstAlong) / alongSlope,
        ),
      ];
      if (domain[0] > domain[1]) continue;
      for (const quarter of [1, 3] as const) {
        const outline:
          | AutoMovieViewOutline.IOutline
          | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
          quarter === 1 ? part.side.positive : part.side.negative,
          { bottom: first, top: last },
        );
        if ("detail" in outline) return `${part.name}: ${outline.detail}`;
        const candidates: number[] | string =
          domain[0] === domain[1]
            ? [domain[0]]
            : AutoMovieViewOutline.supportStations(
                outline,
                velocity.across,
                dot(start.v, across),
                domain,
              );
        if (typeof candidates === "string")
          return `${part.name}: ${candidates}`;
        for (const station of candidates) {
          const edge: number | string = AutoMovieViewOutline.value(
            outline,
            station,
          );
          if (typeof edge === "string") return `${part.name}: ${edge}`;
          const frame: AutoMovieLoftFrame.IFrame = axis.at(station);
          const point: Vec3 = frame.origin.map(
            (value: number, c: number): number => value + frame.v[c]! * edge,
          ) as Vec3;
          const offset: Vec3 = point.map(
            (value: number, c: number): number => value - foot.heel[c]!,
          ) as Vec3;
          const reading: IReading = {
            part: part.name,
            quarter,
            station,
            point,
            along: dot(offset, foot.along),
            across: dot(offset, across),
          };
          if (![...point, reading.along, reading.across].every(Number.isFinite))
            return `${part.name}: nonfinite source support`;
          if (minimum === undefined || reading.across < minimum.across)
            minimum = reading;
          if (maximum === undefined || reading.across > maximum.across)
            maximum = reading;
        }
      }
    }
    if (
      minimum === undefined ||
      maximum === undefined ||
      !(maximum.across > minimum.across)
    )
      return "Metatarsal group has no positive finite source breadth";
    return { minimum, maximum, breadth: maximum.across - minimum.across };
  }

  /** Read only the two horizontal affine projections; the independent height source contributes exactly zero to both directions. */
  function affine(
    axis: AutoMovieConstructionAxis,
    along: Vec3,
    across: Vec3,
    origin?: AutoMovieViewParallelAxis.IOrigin,
  ): { along: number; across: number } | string {
    if (along[1] !== 0 || across[1] !== 0)
      return "Planar support requires horizontal measuring directions";
    if (axis.type === "straight") {
      const velocity: Vec3 = [
        axis.v.y * axis.u.z - axis.v.z * axis.u.y,
        axis.v.z * axis.u.x - axis.v.x * axis.u.z,
        axis.v.x * axis.u.y - axis.v.y * axis.u.x,
      ];
      return { along: dot(velocity, along), across: dot(velocity, across) };
    }
    if (axis.type !== "parallel")
      return "Across support requires a straight or explicitly affine parallel source";
    const x: IAutoMovieConstructionOutline = origin?.x ?? axis.origin.x;
    const stations: number[] = x.knots.map(
      (k: IAutoMovieConstructionKnot): number => k.station,
    );
    const values: number[] = [];
    for (const key of ["x", "z"] as const) {
      const source: IAutoMovieConstructionOutline =
        origin?.[key] ?? axis.origin[key];
      if (
        source.parameter !== undefined ||
        source.range !== undefined ||
        source.knots.length !== 2 ||
        source.knots.some(
          (k: IAutoMovieConstructionKnot, i: number): boolean =>
            k.jet !== undefined || k.station !== stations[i],
        )
      )
        return "Parallel horizontal origin must declare two common physical-station endpoint knots without parameter, jets or range";

      // The actual mm owner takes precedence over serialization: a unit

      // round trip is not an exact replacement for its closed source clock.
      const converted:
        | IAutoMovieViewPart.IOutline
        | IAutoMovieConstructionOutline =
        origin === undefined
          ? AutoMovieViewOutline.scale(source, 1000, 1000)
          : source;
      values.push(
        (converted.knots[1]!.value - converted.knots[0]!.value) /
          (converted.knots[1]!.station - converted.knots[0]!.station),
      );
    }
    return values.every(Number.isFinite)
      ? {
          along: values[0]! * along[0] + values[1]! * along[2],
          across: values[0]! * across[0] + values[1]! * across[2],
        }
      : "Affine source projections must be finite";
  }

  /** The measuring direction is dimensionless; this projection preserves the source's length unit. */
  function dot(a: Vec3, b: Vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
}

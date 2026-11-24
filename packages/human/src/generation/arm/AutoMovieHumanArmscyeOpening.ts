import {
  AutoMovieIllinois,
  AutoMovieLoftViewFullSource,
  AutoMovieViewParameter,
  AutoMovieSolidVector as V,
  bracketedMinimum,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionPort,
  IAutoMovieHumanTrunkViews,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSharedCurve,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanTrunkRows } from "../AutoMovieHumanTrunkRows";
import { AutoMovieHumanJoinLoop } from "../conic/AutoMovieHumanJoinLoop";
import { AutoMovieHumanArmscyeDefinition } from "./AutoMovieHumanArmscyeDefinition";

/** A shoulder's actual world-field reader, in millimetres. */
type Source = IAutoMovieLoftViewFullSource.IReader;

/** World position and derivatives use calibration millimetres. */
type Point = AutoMovieVector3Tuple;

/** The anatomic sides of the torso. */
type Side = "left" | "right";

/** The original trunk's registered lateral shoulder landmarks. */
export namespace AutoMovieHumanArmscyeOpening {
  /** Named shoulder levels and the left side-neck datum, in mm. */
  export type IDatum = Pick<IProduction, "lower" | "upper" | "neck">;

  /** Landmarks for both shoulders of one production torso. */
  export type IProduction = NonNullable<IAutoMovieHumanTrunkViews["shoulder"]>;

  /** Which native material domains to inspect for one arm. */
  export interface IOptions {
    /** Permit extrapolation of the first original section back along its axis. */
    medialTorso: boolean;
    /** Retain the first original arm ring that clears the trunk. */
    firstClearRing: boolean;
    /** The person's side-neck landmark to locate the upper conic extent. */
    sideNeck?: Point;
  }

  /** Coordinates of the measured acromial crest in the torso's frame, mm. */
  export interface ICrest {
    /** Above the floor. */
    height: number;
    /** From the median plane, unsigned. */
    lateral: number;
  }

  /** Prepared original trunk field shared by its two shoulder requests. */
  export interface IPrepared {
    /** The unchanged native source derivatives of the supplied trunk original. */
    wall: Source;
    /** Measure one shoulder using the caller's unchanged arm original. */
    arm(arm: IAutoMovieViewPart, side: Side, options: IOptions): IOpening;
  }

  /** A measured conic on the parent with the admissible child outlet. */
  export interface IOpening {
    /** Unchanged original child field. */
    shaft: Source;
    /** Uppermost trunk height of the conic. */
    apex: number;
    /** Named deltoid section station on the original arm. */
    mark: number;
    /** Half the original deltoid's anteroposterior extent, mm. */
    reach: number;
    /** Greatest conic station in the child chart, when the outlet is derived. */
    after: number | null;
    /** First retained station on the original arm. */
    outlet: number;
    /** Midpoint of the conic in the parent chart. */
    centre: [number, number];
    /** Recover the world point's polar address in the original arm. */
    address(point: Point): { station: number; phase: number; radius: number };
    /** Exact chart value and two clock derivatives of the physical conic. */
    physical: IAutoMovieSolidSharedCurve.Loop;
    /** Child phase clock with the highest original point at zero. */
    targetClock: ((clock: number) => number) | null;
    /** Declare one selected conic and the measured original outlet. */
    portAt(
      top: number,
      rows: number,
      crest?: ICrest,
    ): AutoMovieHumanArmscyeDefinition.IInput;
    /** Declare the source-matched production port and its acromial meridian. */
    definition(crest: ICrest): IAutoMovieConstructionPort;
  }

  /**
   * Author both lateral torso outlines at the existing axillary and acromial
   * knots. The default body law estimates equal underlying torso breadth at
   * these levels. The axilla input already subtracts the arm radius from the
   * bony width. Use the side-neck chord's slope as an ESTIMATE where only its
   * endpoints are measured. A diagnostic can vary the retained share of the
   * original acromial breadth.
   *
   * @see https://mreed.umtri.umich.edu/Anthro/Hotzman_2011_ANSURIII_Measurements_a548497.pdf
   * @see https://pmc.ncbi.nlm.nih.gov/articles/PMC2666142/
   * @see https://pmc.ncbi.nlm.nih.gov/articles/PMC12975017/
   */
  export function torso(
    part: IAutoMovieViewPart,
    datum: IDatum,
    supportShare: number = 0,
  ): IAutoMovieViewPart {
    const { lower, upper, neck } = datum;
    const change = (
      outline: IAutoMovieViewPart.IOutline,
      side: 1 | -1,
    ): IAutoMovieViewPart.IOutline => {
      const at = (s: number): number =>
        AutoMovieViewParameter.at(outline.parameter, s);
      const acromion: IAutoMovieViewPart.IKnot | undefined = outline.knots.find(
        (knot) => knot.station === upper,
      );
      const axilla: IAutoMovieViewPart.IKnot | undefined = outline.knots.find(
        (knot) => knot.station === lower,
      );
      if (acromion === undefined || axilla === undefined)
        throw new Error(
          "The torso outline does not declare both armscye heights",
        );
      const span: number =
        at(outline.knots.at(-1)!.station) - at(outline.knots[0]!.station);
      const neckRadius: number =
        neck[2] * side - part.axis.at(neck[1]).origin[2];
      const author = (
        knot: IAutoMovieViewPart.IKnot,
        slope: number,
      ): IAutoMovieViewPart.IKnot => {
        const inverse: ReturnType<typeof AutoMovieViewParameter.inverseJet> =
          AutoMovieViewParameter.inverseJet(outline.parameter, knot.station);
        if (inverse === null)
          throw new Error("An armscye knot leaves its regular outline chart");
        return {
          ...knot,
          jet: {
            first: slope * inverse[0] * span,
            second: slope * inverse[1] * span * span,
          },
        };
      };
      const breadth: number =
        supportShare === 1
          ? acromion.value
          : axilla.value + supportShare * (acromion.value - axilla.value);
      const shoulderLine: IAutoMovieViewPart.IKnot = author(
        { ...acromion, value: breadth },
        (neckRadius - breadth) / (neck[1] - upper),
      );
      const underarmLine: IAutoMovieViewPart.IKnot = author(
        axilla,
        (breadth - axilla.value) / (upper - lower),
      );
      return {
        ...outline,
        knots: outline.knots.map((knot) =>
          knot === acromion
            ? shoulderLine
            : knot === axilla
              ? underarmLine
              : knot,
        ),
      };
    };
    return {
      ...part,
      side: {
        positive: change(part.side.positive, 1),
        negative: change(part.side.negative, -1),
      },
    };
  }

  /** Prepare the trunk reader and bounds once for the requested shoulders. */
  export function prepare(
    host: IAutoMovieViewPart,
    lower: number,
    upper: number,
  ): IPrepared {
    const wall: Source = AutoMovieLoftViewFullSource.create(host);
    if (!(lower > wall.domain[0] && upper < wall.domain[1] && upper > lower))
      throw new Error(
        `The axilla/acromion span ${lower} to ${upper} mm leaves the retained trunk`,
      );
    return {
      wall,
      arm: (
        part: IAutoMovieViewPart,
        side: Side,
        options: IOptions,
      ): IOpening =>
        measure({ host, wall, arm: part, lower, upper, side, options }),
    };
  }

  /** Prepare the production torso for its actual original arm sources. */
  export function production(
    host: IAutoMovieViewPart,
    datum: IProduction,
  ): (arm: IAutoMovieViewPart, side: Side) => IAutoMovieConstructionPort {
    const source: IPrepared = prepare(host, datum.lower, datum.upper);
    const options: IOptions = {
      medialTorso: true,
      firstClearRing: true,
      sideNeck: datum.neck,
    };
    const crest: ICrest = { height: datum.upper, lateral: datum.lateral };
    return (arm: IAutoMovieViewPart, side: Side): IAutoMovieConstructionPort =>
      source.arm(arm, side, options).definition(crest);
  }

  /** Find the conic and the original stock outlet on one anatomical side. */
  function measure(input: {
    host: IAutoMovieViewPart;
    wall: Source;
    arm: IAutoMovieViewPart;
    lower: number;
    upper: number;
    side: Side;
    options: IOptions;
  }): IOpening {
    const { host, wall, arm, lower, upper, side, options } = input;
    const { firstClearRing, medialTorso, sideNeck } = options;
    const shaft: Source = AutoMovieLoftViewFullSource.create(arm);
    const mark: number | undefined = arm.front.positive.knots.find(
      ({ site }) => site === "deltoid",
    )?.station;
    if (
      mark === undefined ||
      !(mark > shaft.domain[0] && mark < shaft.domain[1])
    )
      throw new Error(
        `${arm.name} has deltoid at ${mark} and original domain ${shaft.domain.join(" to ")} mm`,
      );
    const markOrigin: Point = arm.axis.at(mark).origin;
    const quarter: readonly [number, number] =
      side === "left" ? [0, Math.PI] : [Math.PI, 2 * Math.PI];
    const phaseAt = (
      station: number,
      x: number,
      read: (phase: number) => Point = wall.pointAt(station),
    ): number => {
      const phase: number | null = AutoMovieIllinois.root(
        (angle: number): number => read(angle)[0] - x,
        ...quarter,
        1e-9,
        100,
      );
      if (phase === null || Math.abs(read(phase)[0] - x) > 1e-7)
        throw new Error(
          `Deltoid AP coordinate ${x} mm has no bounded lateral trunk address at ${station} mm`,
        );
      return phase;
    };
    const front: number = shaft.point(mark, 0)[0];
    const back: number = shaft.point(mark, Math.PI)[0];
    const depthRadius: number = (front - back) / 2;
    const reach: number = Math.abs(depthRadius);
    let apex: number = upper;
    const lateral: 1 | -1 = side === "left" ? 1 : -1;
    if (sideNeck !== undefined) {
      const original: Point = wall.point(
        upper,
        side === "left" ? Math.PI / 2 : (3 * Math.PI) / 2,
      );
      const neck: Point = [sideNeck[0], sideNeck[1], lateral * sideNeck[2]];
      const course: Point = V.sub(neck, original);
      const length: number = V.norm(course);
      if (!(length > reach))
        throw new Error("The upper seam has no one-fold reach before the neck");
      apex += (reach * course[1]) / length;
    }
    const middle: number = (lower + apex) / 2;
    const height: number = (apex - lower) / 2;
    const root: ReturnType<NonNullable<typeof arm.axis.jet>> | undefined =
      medialTorso ? arm.axis.jet?.(shaft.domain[0]) : null;
    const address: IOpening["address"] = (point: Point) => {
      if (root !== undefined && root !== null) {
        const { value, first } = root;
        const from: Point = V.sub(point, value.origin);
        const normal: Point = V.cross(value.v, value.u);
        const step: number = V.dot(from, normal) / V.dot(first.origin, normal);
        if (step < 0 && (sideNeck !== undefined || step >= -reach)) {
          const q: Point = V.sub(from, V.scale(first.origin, step));
          return {
            station: shaft.domain[0] + step,
            phase: Math.atan2(V.dot(q, value.v), V.dot(q, value.u)),
            radius: V.norm(q),
          };
        }
      }
      const [station, phase] = AutoMovieHumanJoinLoop.address(
        arm,
        shaft.domain,
        point,
        mark,
      );
      const radius: number = V.norm(V.sub(point, arm.axis.at(station).origin));
      return { station, phase, radius };
    };

    // The original arm axis supplies AP lean. Implicit differentiation of its
    // conic on the parent yields the native angular derivatives.
    const origin: Point = arm.axis.at(shaft.domain[0]).origin;
    const axis: Point = V.sub(markOrigin, origin);
    const inclination: number = axis[0] / axis[1];
    const depthCentre: number = (front + back) / 2;
    const centreX = (s: number): number =>
      depthCentre + (s - markOrigin[1]) * inclination;
    const conic = (clock: number) => {
      const cos: number = Math.cos(clock);
      const sin: number = Math.sin(clock);
      const s: number = middle + height * cos;
      return { cos, sin, s, phase: phaseAt(s, centreX(s) + depthRadius * sin) };
    };
    const physical: IAutoMovieSolidSharedCurve.Loop = (clock: number) => {
      const { cos, sin, s, phase } = conic(clock);
      const ds: number = -height * sin;
      const dds: number = -height * cos;
      const dpX: number = inclination * ds + depthRadius * cos;
      const ddpX: number = inclination * dds - depthRadius * sin;
      const { u, v, uu, uv, vv } = wall.jet(s, phase);
      const dp: number = (dpX - u[0] * ds) / v[0];
      const ddp: number =
        (ddpX -
          u[0] * dds -
          uu[0] * ds ** 2 -
          2 * uv[0] * ds * dp -
          vv[0] * dp ** 2) /
        v[0];
      return { point: [s, phase], first: [ds, dp], second: [dds, ddp] };
    };
    const phases: number[] = Array.from(
      { length: arm.samples },
      (_, i): number => (2 * Math.PI * i) / arm.samples,
    );
    const guide: Point[] =
      firstClearRing || sideNeck !== undefined
        ? phases.map((clock: number): Point => {
            const { s, phase } = conic(clock);
            return wall.point(s, phase);
          })
        : [];
    const after: number | null = firstClearRing
      ? Math.max(...guide.map((point: Point): number => address(point).station))
      : null;

    // Clock the superior meridian by its world height and use the original
    // tangent to distinguish anterior from posterior.
    const superiorClock = (station: number): ((clock: number) => number) => {
      const point: (phase: number) => Point = shaft.pointAt(station);
      const step: number = (2 * Math.PI) / arm.samples;
      const highest: number = phases.reduce(
        (best: number, p: number): number =>
          point(p)[1] > point(best)[1] ? p : best,
        0,
      );
      const top: number = bracketedMinimum(
        (p: number): number => -point(p)[1],
        highest - step,
        highest + step,
        0.001 / reach,
      ).at;
      const sense: number = Math.sign(shaft.jet(station, top).v[0]);
      if (sense === 0)
        throw new Error(
          "The upper arm outline has no directed anterior tangent",
        );
      return (clock: number): number => top + sense * clock;
    };
    const forwardOriginal = (station: number): boolean => {
      const phase: (clock: number) => number = superiorClock(station);
      return guide.every((point: Point, i: number): boolean => {
        const stock = shaft.jet(station, phase(phases[i]!));
        return V.dot(stock.u, V.sub(stock.p, point)) > 0;
      });
    };
    const outlet: number =
      after === null
        ? mark
        : clearOutlet({
            wall,
            shaft,
            arm,
            phases,
            limit: mark + reach,
            side,
            phaseAt,
            after,
            accept: sideNeck === undefined ? undefined : forwardOriginal,
          });
    const targetClock: IOpening["targetClock"] =
      sideNeck === undefined ? null : superiorClock(outlet);
    const portAt: IOpening["portAt"] = (top, rows, crest) => {
      const station: number = (lower + top) / 2;
      const x: number = centreX(station);
      const section: (phase: number) => Point = wall.pointAt(station);
      return {
        host,
        arm,
        wall,
        outlet,
        start: shaft.domain[0],
        side,
        centre: [station, phaseAt(station, x, section)],
        centreX,
        radius: depthRadius,
        height: (top - lower) / 2,
        phaseExtent:
          Math.abs(
            phaseAt(station, x - depthRadius, section) -
              phaseAt(station, x + depthRadius, section),
          ) / 2,
        rows,
        ...(crest === undefined
          ? {}
          : {
              meridian: {
                clock: 0,
                section: { axis: 2, value: (lateral * crest.lateral) / 1000 },
                through: { axis: 1, value: crest.height / 1000 },
              },
            }),
      };
    };
    return {
      shaft,
      apex,
      mark,
      reach,
      after,
      outlet,
      centre: [middle, phaseAt(middle, centreX(middle))],
      address,
      physical,
      targetClock,
      portAt,
      definition(crest: ICrest): IAutoMovieConstructionPort {
        if (targetClock === null)
          throw new Error("The production shoulder needs the side-neck datum");
        const stock: (phase: number) => Point = shaft.pointAt(outlet);
        const span: number = Math.max(
          ...guide.map((point: Point, i: number): number =>
            V.norm(V.sub(point, stock(targetClock(phases[i]!)))),
          ),
        );
        const rows: number = Math.ceil(span / AutoMovieHumanTrunkRows.MAX_GAP);
        return AutoMovieHumanArmscyeDefinition.create(
          portAt(apex, rows, crest),
        );
      },
    };
  }

  /** Find the first full original ring beyond the required physical gap. */
  function clearOutlet(input: {
    wall: Source;
    shaft: Source;
    arm: IAutoMovieViewPart;
    phases: readonly number[];
    after: number;
    limit: number;
    side: Side;
    accept?: (station: number) => boolean;
    phaseAt(station: number, x: number, read: (phase: number) => Point): number;
  }): number {
    const { wall, shaft, arm, phases, after, limit, side, phaseAt, accept } =
      input;
    const sense: 1 | -1 = side === "left" ? 1 : -1;
    const clear: number | undefined = arm.stations.find(
      (station: number): boolean => {
        if (!(station > after && station < Math.min(limit, shaft.domain[1])))
          return false;
        const ring: (phase: number) => Point = shaft.pointAt(station);
        const separated: boolean = phases.every((phase: number): boolean => {
          const [x, y, z] = ring(phase);
          if (y < wall.domain[0] || y > wall.domain[1]) return false;
          const section: (phase: number) => Point = wall.pointAt(y);
          if (x < section(Math.PI)[0] || x > section(0)[0]) return true;
          return sense * (z - section(phaseAt(y, x, section))[2]) > 0.01;
        });
        return separated && (accept?.(station) ?? true);
      },
    );
    if (clear === undefined)
      throw new Error(
        "No original arm section clears the retained torso inside one fold reach",
      );
    return clear;
  }
}

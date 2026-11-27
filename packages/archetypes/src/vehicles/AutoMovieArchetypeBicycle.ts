import { AutoMovieAir, AutoMovieGravity, Vector3 } from "@automovie/engine";
import type { IAutoMovieProjectile, IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRide,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { rideBicycle } from "./internal/rideBicycle";

/** A provisional band in metres from a secondary source. */
const m = (
  minimum: number,
  maximum: number,
  source: string,
): IAutoMovieArchetypeBand =>
  AutoMovieArchetypeBand.of("m", minimum, maximum, source, true);

/** Frame geometry no source gave. */
const GEOMETRY: string =
  "typical road frame geometry; maker geometry charts could not be opened";

/** The canonical producer and authoring contract. */
export namespace AutoMovieArchetypeBicycle {
  /**
   * A bicycle: two wheels, a frame, a saddle, handlebars, and a crank with its
   * two pedals.
   *
   * The bicycle stands upright with its bottom bracket over the origin and its
   * front toward `+Z`. The `crank` turns both arms: at travel 0 the left arm
   * (`+X`) points straight up, at top dead centre, and a positive travel pedals
   * forward. Each pedal rides the crank and stays level. The rider sits on the
   * `saddle`, whose height along the seat tube from the bottom bracket is the
   * `saddleHeight` dimension, and holds the two grips.
   *
   * `AutoMovieArchetypeBicycle.ride` moves it along a course.
   *
   * @param params Any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The bicycle.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(
    params: AutoMovieArchetypeBicycle.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeBicycle.Affordance,
    AutoMovieArchetypeBicycle.Dimension
  > {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeBicycle.Dimension> =
      new AutoMovieArchetypeDrawSession<AutoMovieArchetypeBicycle.Dimension>(
        "bicycle",
        AutoMovieArchetypeBicycle.UNITS,
        seed,
        params,
      );
    const d: Record<AutoMovieArchetypeBicycle.Dimension, number> =
      draw.dimensions(AutoMovieArchetypeBicycle.BANDS);
    const builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeBicycle.Affordance,
      AutoMovieArchetypeBicycle.Dimension
    > = new AutoMovieArchetypeBuilder({
      material: "composite",
      id: params.id,
      name: "bicycle",
      draw,
    });
    const v: typeof Vector3.create = Vector3.create;
    const radius: number = d.wheelDiameter / 2;
    const tube: number = 0.016;
    const steel: string = "#b8412f";

    // The frame's points: bottom bracket, the two axles, the saddle's top and the head of the fork.
    const bracket: IAutoMovieVector3 = v(0, d.bottomBracket, 0);
    const stay: number = AutoMovieArchetypeBicycle.CHAINSTAY;
    const rear: IAutoMovieVector3 = v(
      0,
      radius,
      -Math.sqrt(stay * stay - (radius - d.bottomBracket) ** 2),
    );
    const fore: IAutoMovieVector3 = v(0, radius, rear.z + d.wheelbase);
    const angle: number = d.seatAngle * AutoMovieArchetypeUnits.DEGREE;
    const saddle: IAutoMovieVector3 = v(
      0,
      d.bottomBracket + d.saddleHeight * Math.sin(angle),
      -d.saddleHeight * Math.cos(angle),
    );
    const bars: IAutoMovieVector3 = v(0, saddle.y, saddle.z + d.reach);
    const head: IAutoMovieVector3 = v(0, saddle.y - 0.08, bars.z - 0.06);

    for (const [end, at] of [
      ["rear", rear],
      ["front", fore],
    ] as const) {
      const wheel: string = `wheel-${end}`;
      const marker: string = `wheel-${end}-marker`;
      builder.rod(wheel, radius, v(-0.012, at.y, at.z), v(0.012, at.y, at.z), {
        color: "#22262b",
        density: 0.2,
        surface: "rubber",
      });
      builder.box(
        marker,
        v(0.028, radius * 0.76, 0.008),
        v(0, at.y + radius * 0.45, at.z),
        {
          color: "#8a8d91",
        },
      );
      builder.affordance({
        id: `${end}Spin`,
        kind: "knob",
        frame: AutoMovieArchetypeFrame.facing(at, v(1, 0, 0), v(0, 1, 0)),
        extent: null,
        travel: 360,
        parts: [wheel, marker],
      });
    }
    for (const [name, from, to] of [
      ["seat-tube", bracket, v(0, saddle.y - 0.03, saddle.z)],
      ["down-tube", bracket, head],
      ["top-tube", v(0, saddle.y - 0.1, saddle.z + 0.02), head],
      ["chain-stay", bracket, rear],
      ["seat-stay", v(0, saddle.y - 0.1, saddle.z + 0.02), rear],
      ["fork", head, fore],
      ["stem", head, bars],
    ] as const)
      builder.rod(name, tube, from, to, { color: steel });
    builder.box(
      "saddle",
      v(d.saddleWidth, 0.03, AutoMovieArchetypeBicycle.SADDLE),
      v(0, saddle.y - 0.015, saddle.z),
      { color: "#22262b" },
    );
    builder.affordance({
      id: "saddle",
      kind: "seat",
      frame: AutoMovieArchetypeFrame.upright(
        v(0, saddle.y, saddle.z + AutoMovieArchetypeBicycle.SADDLE / 2),
      ),
      extent: null,
      depth: AutoMovieArchetypeBicycle.SADDLE,
      width: d.saddleWidth,
      astride: true,
    });

    // The handlebar and a grip at each end, taken from above.
    const grip: number = d.gripDiameter / 2;
    builder.rod(
      "handlebar",
      grip,
      v(-d.handlebarWidth / 2, bars.y, bars.z),
      v(d.handlebarWidth / 2, bars.y, bars.z),
      { color: "#55595f" },
    );
    for (const [id, sign] of [
      ["leftGrip", 1],
      ["rightGrip", -1],
    ] as const)
      builder.affordance({
        id,
        kind: "handle",
        symmetry: "round",
        frame: AutoMovieArchetypeFrame.upright(
          v(sign * (d.handlebarWidth / 2 - 0.06), bars.y, bars.z),
        ),
        extent: null,
        grip: "power",
        aperture: d.gripDiameter,
        length: 0.12,
      });

    // The crank: both arms on one axle, the left one up at rest, and a level pedal at the end of each.
    const half: number = d.stance / 2;
    builder.rod(
      "crank-left",
      0.01,
      v(half, bracket.y, 0),
      v(half, bracket.y + d.crank, 0),
      { color: "#8a8d91" },
    );
    builder.rod(
      "crank-right",
      0.01,
      v(-half, bracket.y, 0),
      v(-half, bracket.y - d.crank, 0),
      { color: "#8a8d91" },
    );
    builder.affordance({
      id: "crank",
      kind: "crank",
      frame: AutoMovieArchetypeFrame.facing(
        v(half, bracket.y, 0),
        v(1, 0, 0),
        v(0, 1, 0),
      ),
      extent: null,
      radius: d.crank,
      parts: ["crank-left", "crank-right"],
    });
    for (const [id, sign] of [
      ["leftPedal", 1],
      ["rightPedal", -1],
    ] as const) {
      const at: IAutoMovieVector3 = v(
        sign * (half + AutoMovieArchetypeBicycle.PEDAL.width / 2),
        bracket.y + sign * d.crank,
        0,
      );
      builder.box(
        `pedal-${sign === 1 ? "left" : "right"}`,
        v(
          AutoMovieArchetypeBicycle.PEDAL.width,
          0.02,
          AutoMovieArchetypeBicycle.PEDAL.depth,
        ),
        v(at.x, at.y - 0.01, at.z),
        { color: "#22262b" },
      );
      builder.affordance({
        id,
        kind: "pedal",
        frame: AutoMovieArchetypeFrame.upright(at),
        extent: null,
        width: AutoMovieArchetypeBicycle.PEDAL.width,
        depth: AutoMovieArchetypeBicycle.PEDAL.depth,
        parts: [`pedal-${sign === 1 ? "left" : "right"}`],
        rides: "crank",
      });
    }
    return builder.build(d.mass, { rests: "rubber", ground: "asphalt" });
  }

  /**
   * The rear axle from the bottom bracket, metres: a typical road chain stay,
   * not read at a source.
   */
  export const CHAINSTAY: number = 0.42;

  /** A saddle's length, metres: typical, not read at a source. */
  export const SADDLE: number = 0.27;

  /** A pedal's platform, metres: typical, not read at a source. */
  export const PEDAL: Readonly<{ width: number; depth: number }> = {
    width: 0.09,
    depth: 0.08,
  };

  /**
   * The affordance ids:
   *
   * - `saddle`: the seat, facing forward.
   * - `leftGrip`, `rightGrip`: the handlebar's grips on `+X` and `-X`, taken from
   *   above.
   * - `crank`: the crank's axle, out of the left side; its travel turns both
   *   arms, positive pedalling forward from the left arm's top dead centre.
   * - `leftPedal`, `rightPedal`: the pedals, riding the crank and staying level.
   * - `frontSpin`, `rearSpin`: wheel travel about their axles, positive rolling
   *   forward.
   */
  export type Affordance =
    | "saddle"
    | "leftGrip"
    | "rightGrip"
    | "crank"
    | "frontSpin"
    | "rearSpin"
    | "leftPedal"
    | "rightPedal";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `wheelDiameter`: a wheel with its tyre.
   * - `wheelbase`: axle to axle.
   * - `bottomBracket`: the crank axle above the ground.
   * - `crank`: a crank arm's length, axle to pedal spindle.
   * - `stance`: the distance between the two crank arms' outer faces across the
   *   bicycle.
   * - `saddleHeight`: the saddle's top from the bottom bracket's centre along the
   *   seat tube.
   * - `seatAngle`: the seat tube from the horizontal, degrees.
   * - `saddleWidth`: the saddle's width.
   * - `reach`: the handlebar ahead of the saddle's middle.
   * - `handlebarWidth`: end to end.
   * - `gripDiameter`: the bar where the hands hold it.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "wheelDiameter"
    | "wheelbase"
    | "bottomBracket"
    | "crank"
    | "stance"
    | "saddleHeight"
    | "seatAngle"
    | "saddleWidth"
    | "reach"
    | "handlebarWidth"
    | "gripDiameter"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    wheelDiameter: "m",
    wheelbase: "m",
    bottomBracket: "m",
    crank: "m",
    stance: "m",
    saddleHeight: "m",
    seatAngle: "degrees",
    saddleWidth: "m",
    reach: "m",
    handlebarWidth: "m",
    gripDiameter: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `bicycle` when absent. */
    id?: string;
  }

  /**
   * The band of each free dimension; every one is provisional, read at
   * secondary sources or not at all.
   */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    wheelDiameter: m(
      0.672,
      0.702,
      "ISO 5775 622 mm bead seat plus twice a 25 to 40 mm tyre (Wikipedia, ISO 5775, https://en.wikipedia.org/wiki/ISO_5775)",
    ),
    wheelbase: m(0.97, 1.05, GEOMETRY),
    bottomBracket: m(0.26, 0.29, GEOMETRY),
    crank: m(
      0.165,
      0.18,
      "crank lengths of 165 to 180 mm (Wikipedia, Crankset, https://en.wikipedia.org/wiki/Crankset)",
    ),
    stance: m(0.15, 0.17, "pedal stance width; no value was found at a source"),
    saddleHeight: m(
      0.62,
      0.8,
      "0.883 of an inseam of about 0.70 to 0.90 m, LeMond's rule as given by Bini, Hume and Croft 2011, Sports Med 41:463 (https://paulogentil.com/pdf/Effects%20of%20Bicycle%20Saddle%20Height%20on%20Knee%20Injury%20Risk%20and%20Cycling%20Performance.pdf); the inseam range is an estimate",
    ),
    seatAngle: AutoMovieArchetypeBand.of("degrees", 72, 74, GEOMETRY, true),
    saddleWidth: m(0.13, 0.16, "saddle width, not read at a source"),
    reach: m(0.48, 0.56, GEOMETRY),
    handlebarWidth: m(
      0.34,
      0.5,
      "drop handlebar widths of 34 to 50 cm (Wikipedia, Bicycle handlebar, https://en.wikipedia.org/wiki/Bicycle_handlebar)",
    ),
    gripDiameter: m(
      0.0222,
      0.0238,
      "22.2 mm flat bar and 23.8 mm drop bar grip areas (Wikipedia, Bicycle handlebar, https://en.wikipedia.org/wiki/Bicycle_handlebar)",
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      8,
      14,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
  /**
   * A bicycle ridden along a course: its root on the path, leaned into each turn,
   * its wheels rolling by distance and its crank following powered travel.
   *
   * One turn of the crank carries the bicycle the wheel's circumference times the
   * gear ratio (the development), so the crank's travel in degrees is 360 times
   * the distance over the development: the crank's angle integrates the path's
   * speed by the gear. The ride adds the instants `leftTopDeadCentre` and
   * `rightTopDeadCentre`, each time a crank arm passes straight up.
   *
   * @param bicycle The bicycle.
   * @param course The course its root follows, or its plan, such as a timed
   *   course's.
   * @param gear Teeth in use and optional freewheel intervals in course metres,
   *   such as a road coast or the stretches a bicycle is wheeled by hand. The
   *   default teeth are 34 and 17, a ratio of 2 from the compact road chainsets
   *   and 11 to 28 tooth cassettes Wikipedia's Bicycle gearing article lists
   *   (https://en.wikipedia.org/wiki/Bicycle_gearing). Omit coasting for
   *   fixed-drive behavior. UCI article 1.3.025 separates competition road and
   *   track drive equipment,
   *   https://www.uci.org/regulations/3MyLDDrwJCJJ0BGGOFzOat .
   * @returns The ride.
   * @throws {AutoMovieArchetypeRefusal} When a tooth count is not a positive
   *   whole number, a leg is reversed (a bicycle freewheels backward, so its
   *   crank would run back by the distance, which no rider does), a bend at the
   *   fastest the course lets it be taken needs more than `AutoMovieArchetypeBicycle.LEAN`
   *   degrees of lean (as `AutoMovieArchetypeCourse.admitLean` refuses), or the
   *   course is malformed.
   */
  export function ride(
    bicycle: AutoMovieArchetype<Affordance, Dimension>,
    course: AutoMovieArchetypeCourse.ICourse | AutoMovieArchetypeCourse.IPlan,
    gear: AutoMovieArchetypeBicycle.IGear = {
      chainring: 34,
      sprocket: 17,
    },
  ): AutoMovieArchetypeRide.IRide<Affordance, Dimension> {
    return rideBicycle(
      bicycle,
      course,
      AutoMovieArchetypeBicycle.LEAN,
      gear,
    );
  }

  /**
   * The greatest lean, degrees: provisional. No figure for a bicycle was read
   * at a source; the road motorcycle's limit of
   * `AutoMovieArchetypeMotorcycle.LEAN` is taken
   * as the bound a narrower tyre does not exceed.
   */
  export const LEAN: number = 50;

  /** A stretch of the course from one distance to another, metres. */
  export type IRideInterval = readonly [number, number];

  /** One freewheel interval, or several in course order without overlap. */
  export type IRideCoast = IRideInterval | readonly IRideInterval[];

  /** The drive: the teeth in use and where the crank freewheels. */
  export interface IGear {
    /** Chainring teeth, a positive whole number. */
    chainring: number;

    /** Sprocket teeth, a positive whole number. */
    sprocket: number;

    /**
     * Course stretches over which the wheels roll and the crank holds its
     * phase: a road coast, or a bicycle wheeled by hand. Absent, the drive is
     * fixed.
     */
    coast?: IRideCoast;
  }

  /** A labelled instant of the ride, film seconds from the course's clock. */
  export interface IRideInstant {
    /** Seconds. */
    seconds: number;

    /** What happens then. */
    label: string;
  }

  /**
   * Carry a bicycle through one level hop over a straight approach. The ground
   * course gives horizontal motion and wheel phase. The bicycle and every named
   * contact gain the same vertical ballistic displacement. At touchdown the
   * grounded course continues with its original pose and forward speed.
   *
   * Pass the returned ride to this function again to add a flight outside its
   * other hop intervals.
   *
   * @param ride The bicycle's course ride, with any previously composed hops.
   * @param interval Takeoff and touchdown film seconds on one level, forward
   *   straight leg travelled at constant positive speed.
   * @returns The same ride clock and drive with takeoff and touchdown instants.
   * @throws {AutoMovieArchetypeRefusal} When the interval lies outside the ride
   *   or overlaps one of its hops, the approach changes speed or direction, or
   *   the bicycle is off the level course at either boundary.
   */
  export function hop(
    ride: ReturnType<typeof AutoMovieArchetypeBicycle.ride>,
    interval: IRideInterval,
  ): ReturnType<typeof AutoMovieArchetypeBicycle.ride> {
    const [takeoff, touchdown]: typeof interval = interval;
    if (takeoff < 0 || touchdown <= takeoff || touchdown > ride.duration)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "bicycle",
        axis: "hop.interval",
        value: interval,
        feasible: null,
        reason:
          "takeoff and touchdown must be increasing seconds within the ride",
        fix: "give two ordered instants on the bicycle's ride",
      });

    // The ride publishes each earlier flight as a takeoff and the touchdown
    // after it, so a copy of the ride carries its flights with its instants.
    let airborne: number | undefined;
    let overlap: IRideInterval | undefined;
    for (const event of ride.instants) {
      if (event.label === "takeoff") airborne = event.seconds;
      else if (event.label === "touchdown" && airborne !== undefined) {
        if (takeoff < event.seconds && airborne < touchdown)
          overlap ??= [airborne, event.seconds];
        airborne = undefined;
      }
    }
    if (overlap !== undefined)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "bicycle",
        axis: "hop.interval",
        value: interval,
        feasible: null,
        reason: `the bicycle is already airborne from ${overlap[0]} to ${overlap[1]} s`,
        fix: "choose a takeoff and touchdown outside its other flights",
      });

    const plan: AutoMovieArchetypeCourse.IPlan = ride.plan;
    const entry: AutoMovieArchetypeCourse.IState = plan.at(takeoff);
    const exit: AutoMovieArchetypeCourse.IState = plan.at(touchdown);
    const seconds: number = touchdown - takeoff;
    const legIndex: number = plan.legSpans.findIndex(
      (span: AutoMovieArchetypeCourse.ILegSpan): boolean =>
        entry.distance >= span.from && exit.distance <= span.from + span.span,
    );
    const leg: AutoMovieArchetypeCourse.Leg | undefined =
      plan.course.kind === "timed" ? undefined : plan.course.legs[legIndex];
    if (
      leg?.kind !== "straight" ||
      leg.reverse === true ||
      (leg.rise ?? 0) !== 0 ||
      entry.speed <= 0 ||
      Math.abs(exit.speed - entry.speed) > 1e-8 ||
      Math.abs(exit.distance - entry.distance - entry.speed * seconds) > 1e-8
    )
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "bicycle",
        axis: "hop.approach",
        value: interval,
        feasible: null,
        reason:
          "a level hop needs a straight approach at constant forward speed",
        fix: "stage the complete hop within one level straight leg at cruising speed",
      });

    // The flight starts and ends on the course: the displayed bicycle sits
    // at the planned height and stands upright at both boundaries.
    const grounded = (film: number, floor: number): boolean => {
      const placement: IAutoMovieTransform = ride.at(film).placement;
      return (
        Math.abs(placement.translation.y - floor) <= 1e-8 &&
        Math.abs(AutoMovieArchetypeFrame.axis(placement, "y").y - 1) <= 1e-8
      );
    };
    if (
      !grounded(takeoff, entry.placement.translation.y) ||
      !grounded(touchdown, exit.placement.translation.y)
    )
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "bicycle",
        axis: "hop.approach",
        value: interval,
        feasible: null,
        reason: "both hop boundaries must show a grounded and level bicycle",
        fix: "put the bicycle on the course at takeoff and touchdown",
      });

    const gravity: number = AutoMovieGravity.STANDARD;
    const flight: IAutoMovieProjectile = {
      origin: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: (gravity * seconds) / 2, z: 0 },
      gravity: { x: 0, y: -gravity, z: 0 },
    };

    /** Add the shared flight height while leaving the supported pose intact. */
    const lift = (
      placement: IAutoMovieTransform,
      film: number,
    ): IAutoMovieTransform => {
      if (film <= takeoff || film >= touchdown) return placement;
      const height: number = AutoMovieAir.projectileAt(flight, film - takeoff).position.y;
      return {
        ...placement,
        translation: {
          ...placement.translation,
          y: placement.translation.y + height,
        },
      };
    };

    return {
      ...ride,
      instants: [
        ...ride.instants,
        { seconds: takeoff, label: "takeoff" },
        { seconds: touchdown, label: "touchdown" },
      ].sort(
        (
          left: (typeof ride.instants)[number],
          right: (typeof ride.instants)[number],
        ): number => left.seconds - right.seconds,
      ),
      at: (film: number): ReturnType<typeof ride.at> => {
        const sample: ReturnType<typeof ride.at> = ride.at(film);
        const placement: IAutoMovieTransform = lift(sample.placement, film);
        return placement === sample.placement
          ? sample
          : { ...sample, placement };
      },
      frame: (
        id: AutoMovieArchetypeBicycle.Affordance,
        film: number,
      ): IAutoMovieTransform => lift(ride.frame(id, film), film),
    };
  }
}

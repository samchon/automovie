import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { type AutoMovieArchetype, AutoMovieArchetypeBand, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame, AutoMovieArchetypeRefusal, type IAutoMovieArchetypeBand } from "../core";
import { createEscalatorConstants } from "./createEscalatorConstants";

const { KONE, ESTIMATE, PITCH, RAIL_OFFSET, PLATE, LANDING } = createEscalatorConstants;

/**
 * An escalator between two floors: a lower landing at `y = 0` before the lower
 * comb, horizontal steps, a lower transition curve, the inclined run, an upper
 * transition curve, horizontal steps and the upper comb with its landing at `y
 * = rise`.
 *
 * The lower comb line lies across `x` at `z = 0` and the step band rises toward
 * `+Z`. The model draws the fixed structure: landing plates, the step band's
 * coarse top surface and the two handrails. The steps that move are a separate
 * rigid model, `createEscalator.tread`, placed along the step band by
 * `createEscalator.station` on the ride's clock (`rideEscalator`).
 *
 * The rated speed and inclination are KONE's offered values. EN 115-1 allows 35
 * degrees only up to a 6 m rise at 0.5 m/s, and a speed above 0.5 m/s only up
 * to 30 degrees. The speed and rise set the number of horizontal steps and the
 * transition radii by EN 115-1 as KONE states it.
 *
 * @param params Fixed dimensions, the inclination and the rated speed.
 * @param seed The seed for any unfixed dimension.
 * @returns The escalator with its landings and handrail contacts.
 * @throws {AutoMovieArchetypeRefusal} For a dimension outside its band, an
 *   inclination or speed EN 115-1 does not admit at the rise, or a rise too low
 *   for both transition curves.
 */
export function createEscalator(
  params: createEscalator.IParams = {},
  seed?: number,
): AutoMovieArchetype<createEscalator.Affordance, createEscalator.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createEscalator.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "escalator",
      createEscalator.UNITS,
      seed,
      params,
    );
  const { rise, width, handrail, mass }: Record<createEscalator.Drawn, number> =
    draw.dimensions(createEscalator.BANDS);
  const incline: createEscalator.Incline = params.incline ?? 30;
  const speed: createEscalator.Speed = params.speed ?? 0.5;
  if (incline === 35 && (rise > 6 || speed > 0.5))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "escalator",
      axis: "incline",
      value: incline,
      feasible: { kind: "alternatives", values: ["27.3", "30"] },
      reason: "EN 115-1 allows 35 degrees only up to a 6 m rise at 0.5 m/s",
      fix: "choose 30 degrees, or a rise of at most 6 m at 0.5 m/s",
    });

  // EN 115-1 as KONE 5.7 and 5.9 state it: two horizontal steps and 1.0 m
  // radii at 0.5 m/s up to a 6 m rise, three steps and a 1.5 m upper radius
  // up to 0.65 m/s or above a 6 m rise, four steps and 2.6 m and 2.0 m radii
  // above 0.65 m/s.
  const dimensions: Record<createEscalator.Dimension, number> = {
    rise,
    width,
    handrail,
    mass,
    incline: draw.derive("incline", incline),
    speed: draw.derive("speed", speed),
    level: draw.derive(
      "level",
      speed > 0.65 ? 4 : speed > 0.5 || rise > 6 ? 3 : 2,
    ),
    upperRadius: draw.derive(
      "upperRadius",
      speed > 0.65 ? 2.6 : speed > 0.5 ? 1.5 : 1,
    ),
    lowerRadius: draw.derive("lowerRadius", speed > 0.65 ? 2 : 1),
  };
  const builder: AutoMovieArchetypeBuilder<
    createEscalator.Affordance,
    createEscalator.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "escalator",
    material: "steel",
    draw,
  });
  const profile: createEscalator.IProfile = createEscalator.profile({
    dimensions,
  });
  const top: IAutoMovieVector3 = createEscalator.station(
    profile,
    profile.length,
  );
  const lowerRun: IAutoMovieVector3 = createEscalator.station(
    profile,
    profile.flat,
  );
  const upperRun: IAutoMovieVector3 = createEscalator.station(
    profile,
    profile.length - profile.flat,
  );

  // Fixed landings before each comb and the step band's coarse top surface.
  builder.box(
    "lowerLanding",
    Vector3.create(width + 2 * RAIL_OFFSET, PLATE, LANDING),
    Vector3.create(0, -PLATE / 2, -LANDING / 2),
    { color: "#8a8f96" },
  );
  builder.box(
    "upperLanding",
    Vector3.create(width + 2 * RAIL_OFFSET, PLATE, LANDING),
    Vector3.create(0, rise - PLATE / 2, top.z + LANDING / 2),
    { color: "#8a8f96" },
  );
  const ends: readonly IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 0 },
    lowerRun,
    upperRun,
    top,
  ];
  const names: readonly string[] = ["lower", "incline", "upper"];
  for (const [index, name] of names.entries()) {
    const from: IAutoMovieVector3 = ends[index]!;
    const to: IAutoMovieVector3 = ends[index + 1]!;
    const id: string = `${name}Steps`;
    const span: IAutoMovieVector3 = Vector3.subtract(to, from);
    const slope: number = Math.atan2(span.y, span.z) / Quaternion.DEG2RAD;
    builder.box(
      id,
      Vector3.create(width, PLATE, Vector3.length(span)),
      Vector3.add(Vector3.scale(Vector3.add(from, to), 0.5), {
        x: 0,
        y: -PLATE / 2,
        z: 0,
      }),
      {
        color: "#4b5058",
        rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -slope),
      },
    );
    for (const side of [-1, 1] as const)
      builder.rod(
        `${side < 0 ? "right" : "left"}${name}Rail`,
        0.04,
        { ...from, x: side * (width / 2 + RAIL_OFFSET), y: from.y + handrail },
        { ...to, x: side * (width / 2 + RAIL_OFFSET), y: to.y + handrail },
        { color: "#111111" },
      );
  }

  builder.affordance({
    id: "lowerLanding",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, -LANDING / 2)),
    extent: null,
    width,
    depth: LANDING,
  });
  builder.affordance({
    id: "upperLanding",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(
      Vector3.create(0, rise, top.z + LANDING / 2),
    ),
    extent: null,
    width,
    depth: LANDING,
  });
  for (const side of [-1, 1] as const)
    builder.affordance({
      id: side < 0 ? "rightHandrail" : "leftHandrail",
      kind: "handle",
      symmetry: "round",
      grip: "power",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(
          side * (width / 2 + RAIL_OFFSET),
          handrail,
          profile.flat / 2,
        ),
        Vector3.create(0, 1, 0),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
      length: profile.flat,
      aperture: 0.08,
    });
  return builder.build(mass);
}

/** The escalator's dimensions, rated speed, step-band profile and moving tread. */
export namespace createEscalator {
  /** The two fixed landings and the two handrails at their lower horizontal run. */
  export type Affordance =
    | "lowerLanding"
    | "upperLanding"
    | "leftHandrail"
    | "rightHandrail";

  /** The dimensions drawn from bands. */
  export type Drawn = "rise" | "width" | "handrail" | "mass";

  /**
   * All recorded dimensions: the drawn ones and those derived from the rated
   * speed and inclination.
   */
  export type Dimension =
    | Drawn
    | "incline"
    | "speed"
    | "level"
    | "upperRadius"
    | "lowerRadius";

  /** A moving tread's surface and the handrail grip points that move with it. */
  export type TreadAffordance = "tread" | "leftRail" | "rightRail";

  /** A moving tread's width and depth in metres and mass in kilograms. */
  export type TreadDimension = "width" | "depth" | "mass";

  /** KONE's offered inclinations, degrees (KONE 5.5). */
  export type Incline = 27.3 | 30 | 35;

  /** KONE's offered rated speeds, m/s (KONE 5.4). */
  export type Speed = 0.5 | 0.65 | 0.75;

  /** The dimensions an author fixes, the inclination and the rated speed. */
  export interface IParams extends Partial<Record<Drawn, number>> {
    /** The scene's model identifier, `escalator` when omitted. */
    id?: string;

    /** Inclination in degrees; 30 when absent. */
    incline?: Incline;

    /** Rated step band speed in m/s; 0.5 when absent. */
    speed?: Speed;
  }

  /** Units recorded in the model's draw provenance. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    rise: "m",
    width: "m",
    handrail: "m",
    mass: "kg",
    incline: "degrees",
    speed: "m/s",
    level: "",
    upperRadius: "m",
    lowerRadius: "m",
  };

  /** The drawn dimensions' bands. */
  export const BANDS: Readonly<Record<Drawn, IAutoMovieArchetypeBand>> = {
    rise: AutoMovieArchetypeBand.metres(
      2,
      12,
      `${KONE}, Table 5.2 retail, office and airport rises`,
    ),
    width: AutoMovieArchetypeBand.metres(
      0.58,
      1.1,
      `${KONE}, 5.3 EN 115-1 step widths`,
    ),
    handrail: AutoMovieArchetypeBand.metres(
      0.9,
      1.1,
      `${KONE}, 5.12 balustrade heights`,
    ),
    mass: AutoMovieArchetypeBand.of("kg", 4000, 12000, ESTIMATE, true),
  };

  /**
   * The step band in the escalator's frame: metres along the band from the
   * lower comb to each transition and to the upper comb.
   */
  export interface IProfile {
    /** Step pitch along the band, metres. */
    pitch: number;

    /** Inclination, radians. */
    angle: number;

    /** Horizontal run at each landing, metres. */
    flat: number;

    /** Lower transition radius, metres. */
    lower: number;

    /** Upper transition radius, metres. */
    upper: number;

    /** Straight inclined run, metres. */
    straight: number;

    /** Band length from comb to comb, metres. */
    length: number;

    /** Rise between the landings, metres. */
    rise: number;

    /** Rated step band speed, m/s. */
    speed: number;

    /** Handrail height above the step nose line, metres. */
    handrail: number;

    /**
     * Lateral distance of each handrail centre from the band's centreline,
     * metres.
     */
    rail: number;
  }

  /**
   * Derive the step band from an escalator's recorded dimensions.
   *
   * @param escalator The escalator, or its recorded dimensions.
   * @returns The band's lengths in metres.
   * @throws {AutoMovieArchetypeRefusal} When the rise is too low for both
   *   transitions.
   */
  export function profile(
    escalator: Pick<AutoMovieArchetype<Affordance, Dimension>, "dimensions">,
  ): IProfile {
    const d: Readonly<Partial<Record<Dimension, number>>> =
      escalator.dimensions;
    const angle: number = d.incline! * Quaternion.DEG2RAD;
    const curves: number =
      (d.lowerRadius! + d.upperRadius!) * (1 - Math.cos(angle));
    const straight: number = (d.rise! - curves) / Math.sin(angle);
    if (!(straight > 0))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "escalator",
        axis: "rise",
        value: d.rise!,
        feasible: { kind: "range", minimum: curves, maximum: null, unit: "m" },
        reason:
          "the rise does not leave a straight run between the transition curves",
        fix: "give a rise above the two transitions' combined height",
      });
    const flat: number = d.level! * PITCH;
    return {
      pitch: PITCH,
      angle,
      flat,
      lower: d.lowerRadius!,
      upper: d.upperRadius!,
      straight,
      length: 2 * flat + (d.lowerRadius! + d.upperRadius!) * angle + straight,
      rise: d.rise!,
      speed: d.speed!,
      handrail: d.handrail!,
      rail: d.width! / 2 + RAIL_OFFSET,
    };
  }

  /**
   * The tread centre at a station along the band, in the escalator's frame. A
   * tread stays level. A step that passes either comb turns down under the
   * landing toward its return run: the model takes it straight down below the
   * comb, so no tread surface lies on a landing.
   *
   * @param band The step band.
   * @param s Metres along the band from the lower comb.
   * @returns The tread's top centre, metres.
   */
  export function station(band: IProfile, s: number): IAutoMovieVector3 {
    const { flat, lower, upper, straight, angle }: IProfile = band;
    const s1: number = flat;
    const s2: number = s1 + lower * angle;
    const s3: number = s2 + straight;
    const s4: number = s3 + upper * angle;
    if (s < 0) return { x: 0, y: s, z: 0 };
    if (s <= s1) return { x: 0, y: 0, z: s };
    if (s <= s2) {
      const phi: number = (s - s1) / lower;
      return {
        x: 0,
        y: lower * (1 - Math.cos(phi)),
        z: s1 + lower * Math.sin(phi),
      };
    }
    const z2: number = s1 + lower * Math.sin(angle);
    const y2: number = lower * (1 - Math.cos(angle));
    if (s <= s3)
      return {
        x: 0,
        y: y2 + (s - s2) * Math.sin(angle),
        z: z2 + (s - s2) * Math.cos(angle),
      };
    const z3: number = z2 + straight * Math.cos(angle);
    const y3: number = y2 + straight * Math.sin(angle);
    if (s <= s4) {
      const phi: number = (s - s3) / upper;
      return {
        x: 0,
        y: y3 + upper * (Math.cos(angle - phi) - Math.cos(angle)),
        z: z3 + upper * (Math.sin(angle) - Math.sin(angle - phi)),
      };
    }
    const end: number = s4 + flat;
    const top: number = z3 + upper * Math.sin(angle);
    if (s <= end) return { x: 0, y: band.rise, z: top + (s - s4) };
    return { x: 0, y: band.rise - (s - end), z: top + flat };
  }

  /**
   * One moving step as its own rigid model: a tread one pitch deep whose
   * `tread` surface lies at its local origin, the point `station` places, with
   * the handrail grip point above it on each side. The handrail moves with the
   * steps, so the grip keeps this offset; along the transition curves the real
   * handrail runs at its own radius, which this coarse offset does not follow.
   *
   * @param escalator The escalator whose width and pitch the tread takes.
   * @returns The tread model.
   */
  export function tread(
    escalator: Pick<AutoMovieArchetype<Affordance, Dimension>, "dimensions">,
  ): AutoMovieArchetype<TreadAffordance, TreadDimension> {
    const width: number = escalator.dimensions.width!;
    const handrail: number = escalator.dimensions.handrail!;
    const draw: AutoMovieArchetypeDrawSession<TreadDimension> =
      new AutoMovieArchetypeDrawSession(
        "escalatorTread",
        { width: "m", depth: "m", mass: "kg" },
        undefined,
        {},
      );
    draw.derive("width", width);
    draw.derive("depth", PITCH);
    draw.derive("mass", 15);
    const builder: AutoMovieArchetypeBuilder<TreadAffordance, TreadDimension> =
      new AutoMovieArchetypeBuilder({
        name: "escalator tread",
        material: "aluminium",
        draw,
      });
    builder.box(
      "tread",
      Vector3.create(width, PLATE, PITCH),
      Vector3.create(0, -PLATE / 2, 0),
      { color: "#3a3f46" },
    );
    builder.affordance({
      id: "tread",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, 0)),
      extent: null,
      width,
      depth: PITCH,
    });

    // The handrails run at the step band's speed (EN 115-1), so the grip
    // point above a tread keeps its offset from it.
    for (const side of [-1, 1] as const)
      builder.affordance({
        id: side < 0 ? "rightRail" : "leftRail",
        kind: "handle",
        symmetry: "round",
        grip: "power",
        frame: AutoMovieArchetypeFrame.facing(
          Vector3.create(side * (width / 2 + RAIL_OFFSET), handrail, 0),
          Vector3.create(0, 1, 0),
          Vector3.create(0, 0, 1),
        ),
        extent: null,
        length: PITCH,
        aperture: 0.08,
      });
    return builder.build(15);
  }
}

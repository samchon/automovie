import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/*
 * Construction sizes no source read gives, provisional.
 */
const ESTIMATE: string =
  "Coarse playground construction estimate; no source read gives it";

/*
 * Grab bar height above the platform and its distance inboard of the rim,
 * metres (provisional construction estimate).
 */
const BAR: number = 0.7;

/*
 * The grab bar's distance inboard of the rim, metres (provisional construction
 * estimate).
 */
const INBOARD: number = 0.1;

/** Constructs the roundabout archetype from its recipe. */
export namespace AutoMovieArchetypeRoundabout {
/**
 * A playground roundabout's base: the spindle the disc turns on, whose axis is
 * `+y` through the origin, with the ground at `y = 0`.
 *
 * The rotating disc with its grab bars is a separate rigid model,
 * `AutoMovieArchetypeRoundabout.disc`, whose origin is on the spindle at ground level, so a
 * rotation of its frame about `+y` turns it (`AutoMovieArchetypeRoundaboutRide.ride`).
 *
 * @param params Fixed dimensions.
 * @param seed The seed for any unfixed dimension.
 * @returns The roundabout's base.
 * @throws {AutoMovieArchetypeRefusal} For a dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeRoundabout.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeRoundabout.Affordance, AutoMovieArchetypeRoundabout.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeRoundabout.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "roundabout",
      AutoMovieArchetypeRoundabout.UNITS,
      seed,
      params,
    );
  const { radius, height, mass }: Record<AutoMovieArchetypeRoundabout.Dimension, number> =
    draw.dimensions(AutoMovieArchetypeRoundabout.BANDS);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeRoundabout.Affordance,
    AutoMovieArchetypeRoundabout.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "roundabout",
    material: "steel",
    draw,
  });
  builder.rod(
    "spindle",
    0.06,
    Vector3.create(0, 0, 0),
    Vector3.create(0, height - 0.03, 0),
    { color: "#555555" },
  );
  builder.affordance({
    id: "ground",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, 0)),
    extent: null,
    width: 2 * radius + 2,
    depth: 2 * radius + 2,
  });
  return builder.build(mass);
}

  /* The roundabout's dimensions and its rotating disc. */
  /** The ground around the roundabout. */
  export type Affordance = "ground";

  /** Disc radius and platform height in metres, and base mass in kilograms. */
  export type Dimension = "radius" | "height" | "mass";

  /** The platform and the four grab bars, numbered around the disc. */
  export type DiscAffordance = "platform" | "bar0" | "bar1" | "bar2" | "bar3";

  /** The disc's radius and height in metres and mass in kilograms. */
  export type DiscDimension = "radius" | "height" | "mass";

  /** The dimensions the author fixes inside their bands. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The scene's model identifier, `roundabout` when omitted. */
    id?: string;
  }

  /** Units recorded in the model's draw provenance. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    radius: "m",
    height: "m",
    mass: "kg",
  };

  /** The dimensions' bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    radius: AutoMovieArchetypeBand.metres(0.8, 1.5, ESTIMATE, true),
    height: AutoMovieArchetypeBand.metres(0.1, 0.2, ESTIMATE, true),
    mass: AutoMovieArchetypeBand.of("kg", 30, 80, ESTIMATE, true),
  };

  /**
   * The disc with its four grab bars as one rigid model whose origin is on the
   * spindle at ground level: the platform's top at the roundabout's height, bar
   * `k` at the angle `k` quarter turns from `+z` toward `+x`, just inboard of
   * the rim.
   *
   * @param roundabout The roundabout whose disc this is.
   * @returns The disc model.
   */
  export function disc(
    roundabout: Pick<AutoMovieArchetype<Affordance, Dimension>, "dimensions">,
  ): AutoMovieArchetype<DiscAffordance, DiscDimension> {
    const radius: number = roundabout.dimensions.radius!;
    const height: number = roundabout.dimensions.height!;
    const draw: AutoMovieArchetypeDrawSession<DiscDimension> =
      new AutoMovieArchetypeDrawSession(
        "roundaboutDisc",
        { radius: "m", height: "m", mass: "kg" },
        undefined,
        {},
      );
    draw.derive("radius", radius);
    draw.derive("height", height);
    // 60 kg a square metre of steel deck: a provisional construction estimate.
    const mass: number = draw.derive("mass", 60 * Math.PI * radius * radius);
    const builder: AutoMovieArchetypeBuilder<DiscAffordance, DiscDimension> =
      new AutoMovieArchetypeBuilder({
        name: "roundabout disc",
        material: "steel",
        draw,
      });
    builder.rod(
      "platform",
      radius,
      Vector3.create(0, height - 0.03, 0),
      Vector3.create(0, height, 0),
      { color: "#3a86ff" },
    );
    builder.affordance({
      id: "platform",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, height, 0)),
      extent: null,
      width: 2 * radius,
      depth: 2 * radius,
    });
    const ids: readonly DiscAffordance[] = ["bar0", "bar1", "bar2", "bar3"];
    for (const [k, id] of ids.entries()) {
      const angle: number = (k * Math.PI) / 2;
      const out: number = radius - INBOARD;
      const at = Vector3.create(
        out * Math.sin(angle),
        height + BAR,
        out * Math.cos(angle),
      );
      builder.rod(`${id}Post`, 0.02, { ...at, y: height }, at, {
        color: "#333333",
      });
      builder.affordance({
        id,
        kind: "handle",
        symmetry: "round",
        grip: "power",
        frame: AutoMovieArchetypeFrame.facing(
          at,
          Vector3.create(Math.sin(angle), 0, Math.cos(angle)),
          Vector3.create(0, 1, 0),
        ),
        extent: null,
        length: 0.2,
        aperture: 0.03,
      });
    }
    return builder.build(mass);
  }
}

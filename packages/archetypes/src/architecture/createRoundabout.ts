import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Construction sizes no source read gives, provisional. */
const ESTIMATE: string =
  "Coarse playground construction estimate; no source read gives it";

/** Grab bar height above the platform and its distance inboard of the rim, metres (provisional construction estimate). */
const BAR: number = 0.7;

/** The grab bar's distance inboard of the rim, metres (provisional construction estimate). */
const INBOARD: number = 0.1;

/**
 * A playground roundabout's base: the spindle the disc turns on, whose
 * axis is `+y` through the origin, with the ground at `y = 0`.
 *
 * The rotating disc with its grab bars is a separate rigid model,
 * `createRoundabout.disc`, whose origin is on the spindle at ground level,
 * so a rotation of its frame about `+y` turns it (`rideRoundabout`).
 *
 * @param params Fixed dimensions.
 * @param seed The seed for any unfixed dimension.
 * @returns The roundabout's base.
 * @throws {ArchetypeRefusal} For a dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, the spindle and the separate disc.
 * @evidence contracts/development/implementation.md#principled-implementation A spindle under the disc's platform height and a ground contact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then the spindle.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every size is a provisional construction estimate, marked on its band.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing after returning the model.
 */
export function createRoundabout(
  params: createRoundabout.IParams = {},
  seed?: number | string,
): Archetype<createRoundabout.Affordance, createRoundabout.Dimension> {
  const draw: ArchetypeDrawSession<createRoundabout.Dimension> =
    new ArchetypeDrawSession(
      "roundabout",
      createRoundabout.UNITS,
      seed,
      params,
    );
  const { radius, height, mass }: Record<createRoundabout.Dimension, number> =
    draw.dimensions(createRoundabout.BANDS);
  const builder: ArchetypeBuilder<
    createRoundabout.Affordance,
    createRoundabout.Dimension
  > = new ArchetypeBuilder({
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
    frame: ArchetypeFrame.upright(Vector3.create(0, 0, 0)),
    extent: null,
    width: 2 * radius + 2,
    depth: 2 * radius + 2,
  });
  return builder.build(mass);
}

/**
 * The roundabout's dimensions and its rotating disc.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives each dimension's unit and source and the disc model's frame and contacts.
 * @evidence contracts/development/design.md#principled-representation Lengths in metres and mass in kilograms, each with its band.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer, `rideRoundabout` and the playground test read these members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The disc is rigid and turns only about the spindle.
 */
export namespace createRoundabout {
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
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    radius: "m",
    height: "m",
    mass: "kg",
  };

  /** The dimensions' bands. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    radius: ArchetypeBand.metres(0.8, 1.5, ESTIMATE, true),
    height: ArchetypeBand.metres(0.1, 0.2, ESTIMATE, true),
    mass: ArchetypeBand.of("kg", 30, 80, ESTIMATE, true),
  };

  /**
   * The disc with its four grab bars as one rigid model whose origin is on
   * the spindle at ground level: the platform's top at the roundabout's
   * height, bar `k` at the angle `k` quarter turns from `+z` toward `+x`,
   * just inboard of the rim.
   *
   * @param roundabout The roundabout whose disc this is.
   * @returns The disc model.
   */
  export function disc(
    roundabout: Pick<Archetype<Affordance, Dimension>, "dimensions">,
  ): Archetype<DiscAffordance, DiscDimension> {
    const radius: number = roundabout.dimensions.radius!;
    const height: number = roundabout.dimensions.height!;
    const draw: ArchetypeDrawSession<DiscDimension> = new ArchetypeDrawSession(
      "roundaboutDisc",
      { radius: "m", height: "m", mass: "kg" },
      undefined,
      {},
    );
    draw.derive("radius", radius);
    draw.derive("height", height);
    // 60 kg a square metre of steel deck: a provisional construction estimate.
    const mass: number = draw.derive("mass", 60 * Math.PI * radius * radius);
    const builder: ArchetypeBuilder<DiscAffordance, DiscDimension> =
      new ArchetypeBuilder({
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
      frame: ArchetypeFrame.upright(Vector3.create(0, height, 0)),
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
        frame: ArchetypeFrame.facing(
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

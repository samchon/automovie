import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/** The provisional size range of a coarse ledge in an authored film set. */
const PROFILE: string = "Coarse wall-mounted climbing ledge for a film set";

/**
 * A wall-mounted climbing ledge with a lip grip and a separate flat toe patch.
 *
 * The mounting face lies at Z = 0, the base is at Y = 0, and the occupied
 * rectangle projects along +Z toward the performer. Width runs along X. The
 * grip lies along the upper lip and the toe patch is the whole top face.
 *
 * @param params The optional scene identifier and fixed dimensions.
 * @param seed The seed for any unspecified size or mass.
 * @returns A rigid hold with named grip and toe frames.
 * @throws {AutoMovieArchetypeRefusal} When a prescribed dimension is outside
 *   its band.
 */
export function createClimbingHold(
  params: createClimbingHold.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createClimbingHold.Affordance,
  createClimbingHold.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<createClimbingHold.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "climbingHold",
      createClimbingHold.UNITS,
      seed,
      params,
    );
  const {
    width,
    rise,
    depth,
    mass,
  }: Record<createClimbingHold.Dimension, number> = draw.dimensions(
    createClimbingHold.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createClimbingHold.Affordance,
    createClimbingHold.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "climbing hold",
    material: "composite",
    draw,
  });
  builder.box(
    "ledge",
    Vector3.create(width, rise, depth),
    Vector3.create(0, rise / 2, depth / 2),
    { color: "#1a8a86" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, rise, depth),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    length: width,
    grip: "hook",
  });
  builder.affordance({
    id: "toe",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, rise, depth / 2)),
    extent: null,
    width,
    depth,
  });
  return builder.build(mass);
}

/** The ledge's dimensions, scene placement inputs and named actor contacts. */
export namespace createClimbingHold {
  /** The exposed lip and the top bearing patch. */
  export type Affordance = "grip" | "toe";

  /**
   * Width along X, rise along Y and projected depth along Z in metres, plus
   * mass in kilograms.
   */
  export type Dimension = "width" | "rise" | "depth" | "mass";

  /** The dimensions the author fixes inside the corresponding bands. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The scene's model identifier, `climbingHold` when omitted. */
    id?: string;
  }

  /** Units recorded in the model's draw provenance. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    rise: "m",
    depth: "m",
    mass: "kg",
  };

  /** Authored size limits for the coarse set geometry. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    width: AutoMovieArchetypeBand.metres(0.05, 0.28, PROFILE, true),
    rise: AutoMovieArchetypeBand.metres(0.02, 0.08, PROFILE, true),
    depth: AutoMovieArchetypeBand.metres(0.04, 0.24, PROFILE, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.1, 2, PROFILE, true),
  };
}

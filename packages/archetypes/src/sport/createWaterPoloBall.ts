import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

const RULES: string =
  "World Aquatics June 2025, Part Six Appendix 4 §20.4.3: https://resources.fina.org/fina/document/2025/07/01/ed3110a4-2291-411d-8526-6f641bd9237a/Competition-Regulations_June-2025_Clean-updated-01.07.2025-.pdf";

/**
 * A single water polo ball within the senior men's regulation size band. The
 * sphere's origin is its physical centre. That point is available to the
 * single-hand ball-custody and shot-resolution owners. The prop models the
 * ball's shape and mass for staging.
 *
 * @param params Scene identity and optional regulation dimensions.
 * @param seed Draws free dimensions within their bands.
 * @returns A spherical ball with the shared throw and catch affordances.
 */
export function createWaterPoloBall(
  params: createWaterPoloBall.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createWaterPoloBall.Affordance,
  createWaterPoloBall.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<createWaterPoloBall.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "waterPoloBall",
      createWaterPoloBall.UNITS,
      seed,
      params,
    );
  const d: Record<createWaterPoloBall.Dimension, number> = draw.dimensions(
    createWaterPoloBall.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createWaterPoloBall.Affordance,
    createWaterPoloBall.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "water polo ball",
    material: "rubber",
    draw,
  });
  const radius: number = d.circumference / (2 * Math.PI);
  const center = Vector3.create(0, 0, 0);
  builder.ball("ball", radius, center, { color: "#edc93b" });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.upright(center),
    extent: null,
    grip: "power",
    aperture: 2 * radius,
  });
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, radius, 0)),
    extent: null,
  });
  return builder.build(d.mass);
}

/** Physical circumference and mass and the spherical grip sites. */
export namespace createWaterPoloBall {
  /** The ball center and highest point. */
  export type Affordance = "grip" | "top";
  /** Ball circumference and weight. */
  export type Dimension = "circumference" | "mass";
  /** Scene identity and optional fixes within the size and mass bands. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }
  /** Units of the cited regulation dimensions. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    circumference: "m",
    mass: "kg",
  };
  /** Regulation circumference for the senior men's game and regulation mass. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    circumference: AutoMovieArchetypeBand.metres(0.68, 0.71, RULES),
    mass: AutoMovieArchetypeBand.of("kg", 0.4, 0.45, RULES),
  };
}

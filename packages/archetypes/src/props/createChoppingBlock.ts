import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/** No maker's page was read. */
const STAGED: string =
  "a chopping block: its dimensions and mass are provisional estimates of a sawn round";

/**
 * A chopping block: a sawn round standing on its end, on which logs are split.
 * Its origin is the centre of its foot on the ground, `+Y` up; `top` is the
 * chopping surface facing up.
 *
 * @param params Scene identity and dimensions within their bands.
 * @param seed Draws free dimensions within their bands.
 * @returns The block with its surface.
 */
export function createChoppingBlock(
  params: createChoppingBlock.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createChoppingBlock.Affordance,
  createChoppingBlock.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<createChoppingBlock.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "choppingBlock",
      createChoppingBlock.UNITS,
      seed,
      params,
    );
  const d: Record<createChoppingBlock.Dimension, number> = draw.dimensions(
    createChoppingBlock.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createChoppingBlock.Affordance,
    createChoppingBlock.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "a chopping block",
    material: "wood",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  builder.rod("round", d.radius, v(0, 0, 0), v(0, d.height, 0), {
    color: "#8a6a45",
  });
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.height, 0)),
    extent: null,
    width: 2 * d.radius,
    depth: 2 * d.radius,
  });
  return builder.build(d.mass);
}

/** Dimensions and the surface of {@link createChoppingBlock}. */
export namespace createChoppingBlock {
  /** The chopping surface. */
  export type Affordance = "top";

  /** The round's radius and height, and its mass. */
  export type Dimension = "radius" | "height" | "mass";

  /** Scene identity and fixed dimensions. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }

  /** Units of each dimension. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    radius: "m",
    height: "m",
    mass: "kg",
  };

  /** Staged bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    radius: AutoMovieArchetypeBand.metres(0.2, 0.28, STAGED, true),
    height: AutoMovieArchetypeBand.metres(0.4, 0.5, STAGED, true),
    mass: AutoMovieArchetypeBand.of("kg", 35, 70, STAGED, true),
  };
}

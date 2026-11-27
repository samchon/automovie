import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import * as AutoMovieArchetypeDiveMaskData from "./internal/AutoMovieArchetypeDiveMaskData";

/** Constructs the dive mask archetype from its recipe. */
export namespace AutoMovieArchetypeDiveMask {
/**
 * A diving mask over the eyes and nose. Its origin is the lens' centre, `+Z`
 * out of the face and `+Y` up. `wear` is the skirt's inside, `+Y` toward the
 * face, which seats on the face over the eyes and nose; `nose` is the nose
 * pocket a hand pinches to equalize.
 *
 * @param params Scene identity and dimensions within their bands.
 * @param seed Draws free dimensions within their bands.
 * @returns The item with its contacts.
 */
export function create(
  params: AutoMovieArchetypeDiveMask.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeDiveMask.Affordance, AutoMovieArchetypeDiveMask.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeDiveMask.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "diveMask",
      AutoMovieArchetypeDiveMask.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeDiveMask.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeDiveMask.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeDiveMask.Affordance,
    AutoMovieArchetypeDiveMask.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "a diving mask",
    material: "rubber",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  builder.box("lens", v(d.width, d.height, 0.03), v(0, 0, 0), {
    color: "#9fd3e8",
  });
  builder.box("strap", v(d.width + 0.04, 0.02, 0.01), v(0, 0, -0.06), {
    color: "#1f2a36",
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0, -0.02),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "nose",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, -d.height / 2, 0.01)),
    extent: null,
  });
  return builder.build(d.mass);
}

  /* Dimensions and the socket of {@link createDiveMask}. */
  /** The skirt's seat on the face, and the nose pocket. */
  export type Affordance = "wear" | "nose";

  /** The lens' width and height, and the mask's mass. */
  export type Dimension = "width" | "height" | "mass";

  /** Scene identity and fixed dimensions. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }

  /** Units of each dimension. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    mass: "kg",
  };

  /** Staged bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    width: AutoMovieArchetypeBand.metres(0.14, 0.17, AutoMovieArchetypeDiveMaskData.STAGED, true),
    height: AutoMovieArchetypeBand.metres(0.07, 0.09, AutoMovieArchetypeDiveMaskData.STAGED, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.15, 0.25, AutoMovieArchetypeDiveMaskData.STAGED, true),
  };
}

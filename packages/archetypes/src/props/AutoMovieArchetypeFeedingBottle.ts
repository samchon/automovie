import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** No maker's page was read. */
const STAGED: string =
  "a feeding bottle: its dimensions and mass are provisional estimates, no maker's page was read";

/** Constructs the feeding bottle archetype from its recipe. */
export namespace AutoMovieArchetypeFeedingBottle {
/**
 * A feeding bottle with a teat. Its origin is the base's centre, `+Y` up the
 * bottle to the teat. `grip` is the barrel a hand holds; `teat` the teat's tip,
 * facing `+Y`, which goes to an infant's mouth.
 *
 * @param params Scene identity and dimensions within their bands.
 * @param seed Draws free dimensions within their bands.
 * @returns The bottle with its contacts.
 */
export function create(
  params: AutoMovieArchetypeFeedingBottle.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeFeedingBottle.Affordance,
  AutoMovieArchetypeFeedingBottle.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeFeedingBottle.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "feedingBottle",
      AutoMovieArchetypeFeedingBottle.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeFeedingBottle.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeFeedingBottle.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeFeedingBottle.Affordance,
    AutoMovieArchetypeFeedingBottle.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "a feeding bottle",
    material: "plastic",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const barrel: number = d.height - 0.03;
  builder.rod("barrel", 0.03, v(0, 0, 0), v(0, barrel, 0), {
    color: "#f4f1ea",
    share: 0.9,
  });
  builder.rod("teat", 0.008, v(0, barrel, 0), v(0, d.height, 0), {
    color: "#e2b07a",
    share: 0.1,
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, barrel / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 0.06,
    length: barrel,
  });
  builder.affordance({
    id: "teat",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.height, 0)),
    extent: null,
  });
  return builder.build(d.mass);
}

  /* Dimensions and contacts of {@link createFeedingBottle}. */
  /** The barrel held, and the teat's tip. */
  export type Affordance = "grip" | "teat";

  /** The height to the teat's tip, and the mass. */
  export type Dimension = "height" | "mass";

  /** Scene identity and fixed dimensions. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }

  /** Units of each dimension. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    mass: "kg",
  };

  /** Staged bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    height: AutoMovieArchetypeBand.metres(0.16, 0.2, STAGED, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.15, 0.3, STAGED, true),
  };
}

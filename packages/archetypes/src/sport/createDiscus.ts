import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  type AutoMovieArchetypeBandUnit,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/** The World Athletics rule as read. */
const RULE: string =
  "World Athletics Competition and Technical Rules, 2020 edition (https://athletics.lv/file/download/61151), Technical Rule 34.2, the discus";

/**
 * A competition discus, the men's or the women's.
 *
 * It lies flat on the floor, its centre over the origin. `grip` is the disc as
 * the throwing hand holds it, laid flat on its top with the fingertips over the
 * rim, its thickness the aperture; `rim` is the edge the fingertips hook,
 * toward `+Z`.
 *
 * @param params The category and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The discus.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createDiscus(
  params: createDiscus.IParams,
  seed?: number,
): AutoMovieArchetype<createDiscus.Affordance, createDiscus.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createDiscus.Dimension> =
    new AutoMovieArchetypeDrawSession<createDiscus.Dimension>(
      "discus",
      createDiscus.UNITS,
      seed,
      params,
    );
  const kind: createDiscus.Kind = ArchetypeDraw.choice(
    "discus",
    "kind",
    params.kind,
    createDiscus.KINDS,
  );
  const d: Record<createDiscus.Dimension, number> = draw.dimensions(
    createDiscus.BANDS[kind],
  );
  const builder: AutoMovieArchetypeBuilder<
    createDiscus.Affordance,
    createDiscus.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `${kind}'s discus`,
    draw,
  });
  builder.rod(
    "disc",
    d.diameter / 2,
    Vector3.create(0, 0, 0),
    Vector3.create(0, d.thickness, 0),
    { color: "#8a8d91" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.upright(
      Vector3.create(0, d.thickness / 2, 0),
    ),
    extent: null,
    grip: "hook",
    aperture: d.thickness,
  });
  builder.affordance({
    id: "rim",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, d.thickness, d.diameter / 2),
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    length: d.diameter / 4,
  });
  return builder.build(d.mass);
}

/** Companion types and bands of {@link createDiscus}. */
export namespace createDiscus {
  /** The categories. */
  export type Kind = "men" | "women";

  /** Every category, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["men", "women"];

  /**
   * The affordance ids:
   *
   * - `grip`: the disc held flat from above, its thickness the aperture.
   * - `rim`: the top of the rim toward `+Z`, where the fingertips hook.
   */
  export type Affordance = "grip" | "rim";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `diameter`: across the rim.
   * - `thickness`: at the centre.
   * - `mass`: kilograms.
   */
  export type Dimension = "diameter" | "thickness" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    thickness: "m",
    mass: "kg",
  };

  /**
   * The parameters: the category, and any free dimension fixed to a value
   * inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which category. */
    kind: Kind;

    /** The model's id, unique in a scene; `discus` when absent. */
    id?: string;
  }

  /** A band of the rule. */
  const band = (
    unit: AutoMovieArchetypeBandUnit,
    minimum: number,
    maximum: number,
    what: string,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.of(unit, minimum, maximum, `${RULE}: ${what}`);

  /** The band of each free dimension, by category. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    men: {
      diameter: band("m", 0.219, 0.221, "the men's 219 to 221 mm across"),
      thickness: band(
        "m",
        0.044,
        0.046,
        "the men's 44 to 46 mm thick at the centre",
      ),
      mass: band(
        "kg",
        2,
        2,
        "the men's at least 2 kg for admission, the minimum the model takes",
      ),
    },
    women: {
      diameter: band("m", 0.18, 0.182, "the women's 180 to 182 mm across"),
      thickness: band(
        "m",
        0.037,
        0.039,
        "the women's 37 to 39 mm thick at the centre",
      ),
      mass: band(
        "kg",
        1,
        1,
        "the women's at least 1 kg for admission, the minimum the model takes",
      ),
    },
  };
}

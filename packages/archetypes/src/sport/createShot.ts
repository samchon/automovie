import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

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
  "World Athletics Competition and Technical Rules, 2020 edition (https://athletics.lv/file/download/61151), Technical Rule 33.5, the shot";

/**
 * A competition shot, the men's or the women's.
 *
 * It rests on the floor, its lowest point at the origin and its centre a radius
 * above it. `grip` is the shot as the putting hand holds it, at its centre, its
 * diameter the aperture: the put pushes it from the neck.
 *
 * @param params The category and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The shot.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createShot(
  params: createShot.IParams,
  seed?: number,
): AutoMovieArchetype<createShot.Affordance, createShot.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createShot.Dimension> =
    new AutoMovieArchetypeDrawSession<createShot.Dimension>(
      "shot",
      createShot.UNITS,
      seed,
      params,
    );
  const kind: createShot.Kind = ArchetypeDraw.choice(
    "shot",
    "kind",
    params.kind,
    createShot.KINDS,
  );
  const d: Record<createShot.Dimension, number> = draw.dimensions(
    createShot.BANDS[kind],
  );
  const builder: AutoMovieArchetypeBuilder<
    createShot.Affordance,
    createShot.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "iron",
    id: params.id,
    name: `${kind}'s shot`,
    draw,
  });
  const centre: IAutoMovieVector3 = Vector3.create(0, d.diameter / 2, 0);
  builder.ball("shot", d.diameter / 2, centre, { color: "#4a4d52" });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      centre,
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.diameter,
  });
  return builder.build(d.mass);
}

/** Companion types and bands of {@link createShot}. */
export namespace createShot {
  /** The categories. */
  export type Kind = "men" | "women";

  /** Every category, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["men", "women"];

  /** The affordance ids: `grip`, the shot as a hand holds it, at its centre. */
  export type Affordance = "grip";

  /**
   * The free dimensions:
   *
   * - `diameter`: metres.
   * - `mass`: kilograms.
   */
  export type Dimension = "diameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    mass: "kg",
  };

  /**
   * The parameters: the category, and any free dimension fixed to a value
   * inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which category. */
    kind: Kind;

    /** The model's id, unique in a scene; `shot` when absent. */
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
      diameter: band("m", 0.11, 0.13, "the men's 110 to 130 mm across"),
      mass: band(
        "kg",
        7.26,
        7.26,
        "the men's at least 7.26 kg for admission, the minimum the model takes",
      ),
    },
    women: {
      diameter: band("m", 0.095, 0.11, "the women's 95 to 110 mm across"),
      mass: band(
        "kg",
        4,
        4,
        "the women's at least 4 kg for admission, the minimum the model takes",
      ),
    },
  };
}

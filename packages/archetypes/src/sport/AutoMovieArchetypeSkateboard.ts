import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/*
 * The decks read.
 */
const POWELL: string =
  'Powell Peralta decks, "7-Ply Maple": Kilian Martin Wolf 4, 7.75 x 31.75 in, 14 in wheelbase (https://powell-peralta.com/powell-peralta-kilian-martin-wolf-4-skateboard-deck-7-75-x-31-75); Chin Mask, 8.5 x 33.5 in, 15 in wheelbase (https://powell-peralta.com/powell-peralta-chin-mask-skateboard-deck-black-8-5-x-33-5)';

/*
 * The veneer read.
 */
const VENEER: string =
  'Roarockit Skateboard Co., Understand the Materials: maple veneer "Normally this is 1/16" thick" (https://roa-rockit.squarespace.com/skateboard-building/2015/3/14/understand-the-materials)';

/*
 * The truck read.
 */
const TRUCK: string =
  'Independent Trucks, Stage 11 Standard: "55MM HEIGHT." (https://independenttrucks.com/trucks)';

/*
 * The wheel read.
 */
const WHEEL: string =
  'Spitfire Formula Four Classic wheels, "52 mm" in the product title (https://www.skatedeluxe.com/en/p/spitfire-formula-four-classic-wheels-white-green-52-mm-99a-4-pack_p123290?cic=GB)';

/*
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `wheel`, a wheel's width; `baseplate`, a truck's
 * block along the deck.
 */
const ESTIMATES: Readonly<{ wheel: number; baseplate: number }> = {
  wheel: 0.032,
  baseplate: 0.08,
};

/** Constructs the skateboard archetype from its recipe. */
export namespace AutoMovieArchetypeSkateboard {
/**
 * A skateboard standing on its wheels, its nose toward `-Z`.
 *
 * Its deck is one of the maker's two decks read, whole: the model given, or one
 * drawn from the seed, as thick as seven of the supplier's maple veneers, the
 * ply count the maker states. Each truck holds its axle the truck's read height
 * under the deck at the deck's wheelbase, and each axle carries two wheels of
 * the read diameter. `deck` is the deck's top and the stance anchors sit above
 * the axles. Each wheel has its lowest local line marked. `tailStrike` marks
 * the rear underside for comparing the board's pose to the ground.
 *
 * @param params The deck and any dimension the author fixes.
 * @param seed The seed that draws the deck when it is not given and every
 *   dimension left free inside its band; absent, the first deck and the middle
 *   of each band.
 * @returns The skateboard.
 * @throws {AutoMovieArchetypeRefusal} For a deck the maker's pages do not list,
 *   or a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeSkateboard.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSkateboard.Affordance, AutoMovieArchetypeSkateboard.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSkateboard.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeSkateboard.Dimension>(
      "skateboard",
      AutoMovieArchetypeSkateboard.UNITS,
      seed,
      params,
    );
  const model: {
    name: AutoMovieArchetypeSkateboard.Model | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeSkateboard.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeSkateboard.Model>(
    "model",
    params.model,
    AutoMovieArchetypeSkateboard.MODELS,
  );
  const d: Record<AutoMovieArchetypeSkateboard.Dimension, number> = {
    ...draw.dimensions(AutoMovieArchetypeSkateboard.BANDS),
    width: model.figures.width!,
    length: model.figures.length!,
    wheelbase: model.figures.wheelbase!,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSkateboard.Affordance,
    AutoMovieArchetypeSkateboard.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `skateboard ${model.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const E: typeof ESTIMATES = ESTIMATES;
  const width: number = d.width;
  const length: number = d.length;
  const base: number = d.wheelbase / 2;
  const radius: number = d.wheel / 2;
  const under: number = radius + d.truck;
  const top: number = under + d.thickness;
  builder.box(
    "deck",
    v(width, d.thickness, length),
    v(0, under + d.thickness / 2, 0),
    {
      color: "#c8a77a",
    },
  );
  for (const [end, sign] of [
    ["front", -1],
    ["back", 1],
  ] as const) {
    const z: number = sign * base;
    builder.box(
      `truck-${end}`,
      v(width - 2 * E.wheel, d.truck, E.baseplate),
      v(0, radius + d.truck / 2, z),
      { color: "#9aa1a8" },
    );
    for (const [side, x] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      builder.rod(
        `wheel-${end}-${side}`,
        radius,
        v(x * (width / 2 - E.wheel), radius, z),
        v(x * (width / 2), radius, z),
        { color: "#f2efe6" },
      );
      builder.affordance({
        id: `wheel-${end}-${side}`,
        kind: "ledge",
        frame: AutoMovieArchetypeFrame.upright(
          v(x * (width / 2 - E.wheel / 2), 0, z),
        ),
        extent: null,
        length: E.wheel,
      });
    }
    builder.affordance({
      id: end === "front" ? "frontStance" : "rearStance",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, top, z)),
      extent: null,
      width,
      depth: E.baseplate,
    });
  }
  builder.affordance({
    id: "deck",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, top, 0)),
    extent: null,
    width,
    depth: length,
  });
  for (const [id, sign] of [
    ["nose", -1],
    ["tail", 1],
  ] as const)
    builder.affordance({
      id,
      kind: "ledge",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, top, (sign * length) / 2),
        v(0, 1, 0),
        v(sign, 0, 0),
      ),
      extent: null,
      length: width,
    });
  builder.affordance({
    id: "tailStrike",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.upright(v(0, under, length / 2)),
    extent: null,
    length: width,
  });
  // Leave a half-wheel diameter between the ball of the foot and the rear edge.
  builder.affordance({
    id: "tailStance",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, top, length / 2 - radius)),
    extent: null,
    width,
    depth: 2 * radius,
  });
  return builder.build(d.mass);
}

  /**
   * The decks read: Powell Peralta's Kilian Martin Wolf 4, 7.75 by 31.75 in,
   * and Chin Mask, 8.5 by 33.5 in.
   */
  export type Model = "7.75x31.75" | "8.5x33.5";

  /**
   * Each deck's width, length and wheelbase, metres, the default first: Powell
   * Peralta's 7.75 x 31.75 in with a 14 in wheelbase and 8.5 x 33.5 in with a
   * 15 in wheelbase (the pages `POWELL` gives).
   */
  export const MODELS: Readonly<
    Record<Model, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "7.75x31.75": {
      width: 7.75 * AutoMovieArchetypeUnits.INCH,
      length: 31.75 * AutoMovieArchetypeUnits.INCH,
      wheelbase: 14 * AutoMovieArchetypeUnits.INCH,
    },
    "8.5x33.5": {
      width: 8.5 * AutoMovieArchetypeUnits.INCH,
      length: 33.5 * AutoMovieArchetypeUnits.INCH,
      wheelbase: 15 * AutoMovieArchetypeUnits.INCH,
    },
  };

  /**
   * The affordance ids:
   *
   * - `deck`: the deck's top.
   * - `nose`, `tail`: its ends on `-Z` and `+Z`, ledges along `X` with `+Z` out
   *   from the deck.
   * - `frontStance`, `rearStance`: the deck sites over the trucks.
   * - `tailStrike`: the underside rear edge.
   * - `tailStance`: the ball-of-foot target above the rear edge for the pop.
   * - `wheel-front-left`, `wheel-front-right`, `wheel-back-left`,
   *   `wheel-back-right`: the local low lines across the wheels at rest.
   */
  export type Affordance =
    | "deck"
    | "nose"
    | "tail"
    | "frontStance"
    | "rearStance"
    | "tailStrike"
    | "tailStance"
    | `wheel-${"front" | "back"}-${"left" | "right"}`;

  /**
   * The dimensions:
   *
   * - `width`, `length`, `wheelbase`: the deck's, metres, its model's.
   * - `thickness`: the deck, metres.
   * - `truck`: a truck's height from the deck's underside to the axle, metres.
   * - `wheel`: a wheel's diameter, metres.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "width"
    | "length"
    | "wheelbase"
    | "thickness"
    | "truck"
    | "wheel"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    length: "m",
    wheelbase: "m",
    thickness: "m",
    truck: "m",
    wheel: "m",
    mass: "kg",
  };

  /** The free dimensions, each drawn from its band. */
  export type Free = Exclude<Dimension, "width" | "length" | "wheelbase">;

  /**
   * The parameters: the deck, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Free, number>> {
    /** Which deck; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `skateboard` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Free, IAutoMovieArchetypeBand>> = {
    thickness: AutoMovieArchetypeBand.metres(
      (7 / 16) * AutoMovieArchetypeUnits.INCH,
      (7 / 16) * AutoMovieArchetypeUnits.INCH,
      `${POWELL}: seven plies, each 1/16 in by ${VENEER}`,
    ),
    truck: AutoMovieArchetypeBand.metres(
      55 * AutoMovieArchetypeUnits.MILLIMETRE,
      55 * AutoMovieArchetypeUnits.MILLIMETRE,
      TRUCK,
    ),
    wheel: AutoMovieArchetypeBand.metres(
      52 * AutoMovieArchetypeUnits.MILLIMETRE,
      52 * AutoMovieArchetypeUnits.MILLIMETRE,
      WHEEL,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      3,
      4,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}

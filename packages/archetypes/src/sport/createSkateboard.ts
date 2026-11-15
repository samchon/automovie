import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** The decks read. */
const POWELL: string =
  'Powell Peralta decks, "7-Ply Maple": Kilian Martin Wolf 4, 7.75 x 31.75 in, 14 in wheelbase (https://powell-peralta.com/powell-peralta-kilian-martin-wolf-4-skateboard-deck-7-75-x-31-75); Chin Mask, 8.5 x 33.5 in, 15 in wheelbase (https://powell-peralta.com/powell-peralta-chin-mask-skateboard-deck-black-8-5-x-33-5)';

/** The veneer read. */
const VENEER: string =
  'Roarockit Skateboard Co., Understand the Materials: maple veneer "Normally this is 1/16" thick" (https://roa-rockit.squarespace.com/skateboard-building/2015/3/14/understand-the-materials)';

/** The truck read. */
const TRUCK: string =
  'Independent Trucks, Stage 11 Standard: "55MM HEIGHT." (https://independenttrucks.com/trucks)';

/** The wheel read. */
const WHEEL: string =
  'Spitfire Formula Four Classic wheels, "52 mm" in the product title (https://www.skatedeluxe.com/en/p/spitfire-formula-four-classic-wheels-white-green-52-mm-99a-4-pack_p123290?cic=GB)';

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `wheel`, a wheel's width; `baseplate`, a truck's block along the deck. */
const ESTIMATES: Readonly<{ wheel: number; baseplate: number }> = {
  wheel: 0.032,
  baseplate: 0.08,
};

/**
 * A skateboard standing on its wheels, its nose toward `-Z`.
 *
 * Its deck is one of the maker's two decks read, whole: the model given, or one drawn from the seed, as thick as seven of the supplier's maple veneers, the ply count the maker states. Each truck holds its axle the truck's read height under the deck at the deck's wheelbase, and each axle carries two wheels of the read diameter. `deck` is the deck's top, the surface the feet stand on; `nose` and `tail` its ends, ledges a foot presses. Riding it is balance on a rolling support, which no motion law covers yet (#3468 N11), so it is built for static use and carrying.
 *
 * @param params The deck and any dimension the author fixes.
 * @param seed The seed that draws the deck when it is not given and every dimension left free inside its band; absent, the first deck and the middle of each band.
 * @returns The skateboard.
 * @throws {ArchetypeRefusal} For a deck the maker's pages do not list, or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the board stands, how its deck is chosen, its contacts and its static use with the missing law.
 * @evidence contracts/development/implementation.md#principled-implementation One of Powell Peralta's two decks whole, its width, length and wheelbase as the maker's page gives them; its thickness seven 1/16 in veneers, Powell Peralta's ply count times Roarockit's veneer; the deck's underside the Independent truck's 55 mm over the axle, the axle a 52 mm wheel's radius off the ground.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the deck, draw the dimensions, then the deck, the trucks and wheels, and the three contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No deck between the two read is made; the deck is flat, with no concave or kicked nose and tail; the wheels' width and the trucks' blocks are construction estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Nine parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createSkateboard(
  params: createSkateboard.IParams = {},
  seed?: number | string,
): Archetype<createSkateboard.Affordance, createSkateboard.Dimension> {
  const draw: ArchetypeDrawSession<createSkateboard.Dimension> = new ArchetypeDrawSession<createSkateboard.Dimension>("skateboard", createSkateboard.UNITS, seed, params);
  const model: {
    name: createSkateboard.Model | undefined;
    figures: Readonly<Partial<Record<createSkateboard.Dimension, number>>>;
  } = draw.model<createSkateboard.Model>("model", params.model, createSkateboard.MODELS);
  const d: Record<createSkateboard.Dimension, number> = {
    ...draw.dimensions(createSkateboard.BANDS),
    width: model.figures.width!,
    length: model.figures.length!,
    wheelbase: model.figures.wheelbase!,
  };
  const builder: ArchetypeBuilder<
    createSkateboard.Affordance,
    createSkateboard.Dimension
  > = new ArchetypeBuilder({
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
    ] as const)
      builder.rod(
        `wheel-${end}-${side}`,
        radius,
        v(x * (width / 2 - E.wheel), radius, z),
        v(x * (width / 2), radius, z),
        { color: "#f2efe6" },
      );
  }
  builder.affordance({
    id: "deck",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, top, 0)),
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
      frame: ArchetypeFrame.facing(
        v(0, top, (sign * length) / 2),
        v(0, 1, 0),
        v(sign, 0, 0),
      ),
      extent: null,
      length: width,
    });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createSkateboard}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation A closed union of the decks read, each built whole; the thickness a derivation from a read ply count and a read veneer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The deck the feet stand on and the ends a foot presses (#3468 N11).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The mass, which no page read gives, is provisional.
 */
export namespace createSkateboard {
  /** The decks read: Powell Peralta's Kilian Martin Wolf 4, 7.75 by 31.75 in, and Chin Mask, 8.5 by 33.5 in. */
  export type Model = "7.75x31.75" | "8.5x33.5";

  /** Each deck's width, length and wheelbase, metres, the default first: Powell Peralta's 7.75 x 31.75 in with a 14 in wheelbase and 8.5 x 33.5 in with a 15 in wheelbase (the pages `POWELL` gives). */
  export const MODELS: Readonly<
    Record<Model, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "7.75x31.75": {
      width: 7.75 * ArchetypeUnits.INCH,
      length: 31.75 * ArchetypeUnits.INCH,
      wheelbase: 14 * ArchetypeUnits.INCH,
    },
    "8.5x33.5": {
      width: 8.5 * ArchetypeUnits.INCH,
      length: 33.5 * ArchetypeUnits.INCH,
      wheelbase: 15 * ArchetypeUnits.INCH,
    },
  };

  /**
   * The affordance ids:
   *
   * - `deck`: the deck's top.
   * - `nose`, `tail`: its ends on `-Z` and `+Z`, ledges along `X` with `+Z` out from the deck.
   */
  export type Affordance = "deck" | "nose" | "tail";

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
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
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

  /** The parameters: the deck, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Free, number>> {
    /** Which deck; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `skateboard` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Free, IArchetypeBand>> = {
    thickness: ArchetypeBand.metres(
      (7 / 16) * ArchetypeUnits.INCH,
      (7 / 16) * ArchetypeUnits.INCH,
      `${POWELL}: seven plies, each 1/16 in by ${VENEER}`,
    ),
    truck: ArchetypeBand.metres(
      55 * ArchetypeUnits.MILLIMETRE,
      55 * ArchetypeUnits.MILLIMETRE,
      TRUCK,
    ),
    wheel: ArchetypeBand.metres(
      52 * ArchetypeUnits.MILLIMETRE,
      52 * ArchetypeUnits.MILLIMETRE,
      WHEEL,
    ),
    mass: ArchetypeBand.of("kg", 3, 4, ArchetypeBand.TYPICAL_MASS, true),
  };
}

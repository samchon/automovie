import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

/** The boxing rules, read. */
const IBA: string =
  "IBA Technical and Competition Rules, 15 April 2026 (https://www.iba.sport/wp-content/uploads/2026/06/20260415-IBA-Technical-Competition-Rules.pdf)";

/**
 * A boxing glove, lying on its palm with the fist toward `+Z` and the cuff back
 * along `-Z`.
 *
 * `wear` is the socket the hand goes into: the fist's hollow where the palm's
 * middle sits, `+Y` out of the cuff's mouth along `-Z`, the way the hand comes
 * in. `face` is the striking face, the knuckle end of the fist, `+Y` out along
 * `+Z`, the way a punch lands.
 *
 * @param params The glove's weight and any dimension the author fixes.
 * @param seed The seed that draws the weight when it is not given and every
 *   dimension left free inside its band; absent, the first weight and the
 *   middle of each band.
 * @returns The glove.
 * @throws {AutoMovieArchetypeRefusal} For a weight the rules do not set or a
 *   fixed dimension outside its band.
 */
export function createBoxingGlove(
  params: createBoxingGlove.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createBoxingGlove.Affordance,
  createBoxingGlove.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<createBoxingGlove.Dimension> =
    new AutoMovieArchetypeDrawSession<createBoxingGlove.Dimension>(
      "boxingGlove",
      createBoxingGlove.UNITS,
      seed,
      params,
    );
  const weight: {
    name: createBoxingGlove.Weight | undefined;
    figures: Readonly<Partial<Record<createBoxingGlove.Dimension, number>>>;
  } = draw.model<createBoxingGlove.Weight>(
    "weight",
    params.weight,
    createBoxingGlove.WEIGHTS,
  );
  const d: Record<createBoxingGlove.Dimension, number> = {
    ...draw.dimensions(createBoxingGlove.BANDS),
    mass: weight.figures.mass!,
  };
  const builder: AutoMovieArchetypeBuilder<
    createBoxingGlove.Affordance,
    createBoxingGlove.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `boxing glove ${weight.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const cuff: number = createBoxingGlove.CUFF;
  builder.box(
    "fist",
    v(d.width, d.height, d.length),
    v(0, d.height / 2, d.length / 2),
    {
      color: "#b3262d",
    },
  );
  builder.box(
    "cuff",
    v(d.width * cuff, d.height * cuff, d.cuff),
    v(0, (d.height * cuff) / 2, -d.cuff / 2),
    { color: "#b3262d" },
  );
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.height / 2, d.length / 2),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.height / 2, d.length),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width: d.width,
    depth: d.height,
  });
  return builder.build(d.mass);
}

/** Companion types, constants and bands of {@link createBoxingGlove}. */
export namespace createBoxingGlove {
  /**
   * The cuff's width and height as a share of the fist's, about three quarters
   * as IBA Appendix 11's side view draws it: a construction proportion read off
   * the figure, which places no contact.
   */
  export const CUFF: number = 0.75;

  /**
   * The affordance ids:
   *
   * - `wear`: the socket the hand goes into, `+Y` out of the cuff.
   * - `face`: the striking face at the knuckle end.
   */
  export type Affordance = "wear" | "face";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: the fist from the cuff's seam to the knuckle end, along `Z`.
   * - `height`: the fist's, along `Y`.
   * - `width`: the fist's across, along `X`.
   * - `cuff`: the cuff's length behind the fist.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "height" | "width" | "cuff" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    height: "m",
    width: "m",
    cuff: "m",
    mass: "kg",
  };

  /** The glove weights the rules set. */
  export type Weight = "8oz" | "10oz" | "12oz";

  /**
   * Each weight's mass, kilograms, the default first: IBA rule 45.6, "8, 10 and
   * 12 oz gloves (227 to 340 g) by weight category".
   */
  export const WEIGHTS: Readonly<
    Record<Weight, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "8oz": { mass: 8 * AutoMovieArchetypeUnits.OUNCE },
    "10oz": { mass: 10 * AutoMovieArchetypeUnits.OUNCE },
    "12oz": { mass: 12 * AutoMovieArchetypeUnits.OUNCE },
  };

  /**
   * The parameters: the weight, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "mass">, number>
  > {
    /** The glove's weight; drawn from the seed when absent. */
    weight?: Weight;

    /** The model's id, unique in a scene; `boxingGlove` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<
    Record<Exclude<Dimension, "mass">, IAutoMovieArchetypeBand>
  > = {
    length: AutoMovieArchetypeBand.metres(
      0.2,
      0.2,
      `${IBA}, Appendix 11: the glove 20 cm long`,
    ),
    height: AutoMovieArchetypeBand.metres(
      0.14,
      0.16,
      `${IBA}, Appendix 11: 14 to 16 cm`,
    ),
    width: AutoMovieArchetypeBand.metres(
      0.125,
      0.135,
      "Iron Body Fitness 12 oz training glove, 12.5 cm high and 13.5 cm deep, as a search result gives the retailer's listing; not read",
      true,
    ),
    cuff: AutoMovieArchetypeBand.metres(
      0.08,
      0.1,
      `${IBA}, Appendix 11: the cuff 8 to 10 cm`,
    ),
  };
}

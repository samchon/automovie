import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** The boxing rules, read. */
const IBA: string =
  "IBA Technical and Competition Rules, 15 April 2026 (https://www.iba.sport/wp-content/uploads/2026/06/20260415-IBA-Technical-Competition-Rules.pdf)";

/**
 * A boxing glove, lying on its palm with the fist toward `+Z` and the cuff back along `-Z`.
 *
 * `wear` is the socket the hand goes into: the fist's hollow where the palm's middle sits, `+Y` out of the cuff's mouth along `-Z`, the way the hand comes in. `face` is the striking face, the knuckle end of the fist, `+Y` out along `+Z`, the way a punch lands.
 *
 * @param params The glove's weight and any dimension the author fixes.
 * @param seed The seed that draws the weight when it is not given and every dimension left free inside its band; absent, the first weight and the middle of each band.
 * @returns The glove.
 * @throws {ArchetypeRefusal} For a weight the rules do not set or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the glove lies, where the hand goes in and which face strikes.
 * @evidence contracts/development/implementation.md#principled-implementation A fist box of the IBA appendix's length and height at the drawn width, and a cuff box behind it of the appendix's cuff length, narrower by the proportion its figure draws; the mass is one of the rules' three glove weights, whole.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the weight, draw the dimensions, two parts, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No thumb and no lacing, so one model serves either hand; the cuff's narrowing is a construction proportion read off the appendix's figure.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createBoxingGlove(
  params: createBoxingGlove.IParams = {},
  seed?: number | string,
): Archetype<createBoxingGlove.Affordance, createBoxingGlove.Dimension> {
  const weight: {
    name: createBoxingGlove.Weight | undefined;
    figures: Readonly<Partial<Record<createBoxingGlove.Dimension, number>>>;
  } = ArchetypeDraw.model<
    createBoxingGlove.Weight,
    createBoxingGlove.Dimension
  >(
    "boxingGlove",
    "weight",
    params.weight,
    createBoxingGlove.WEIGHTS,
    seed,
    params,
  );
  const d: Record<createBoxingGlove.Dimension, number> = {
    ...ArchetypeDraw.dimensions(
      "boxingGlove",
      createBoxingGlove.BANDS,
      seed,
      params,
    ),
    mass: weight.figures.mass!,
  };
  const builder: ArchetypeBuilder<
    createBoxingGlove.Affordance,
    createBoxingGlove.Dimension
  > = new ArchetypeBuilder({
    archetype: "boxingGlove",
    id: params.id,
    name: `boxing glove ${weight.name}`,
    dimensions: d,
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
    frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.facing(
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

/**
 * Companion types, constants and bands of {@link createBoxingGlove}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation The rules' three weights picked whole, one band per remaining dimension; the length, height, cuff and weight are the IBA's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The socket a hand is dressed into and the face a punch lands with (#3468 F6: `guard`, `punch`).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The glove's width is provisional and its cuff's narrowing is read off a figure; a training glove's heavier padding is the same model at a fixed heavier mass, not a kind.
 */
export namespace createBoxingGlove {
  /** The cuff's width and height as a share of the fist's, about three quarters as IBA Appendix 11's side view draws it: a construction proportion read off the figure, which places no contact. */
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

  /** The glove weights the rules set. */
  export type Weight = "8oz" | "10oz" | "12oz";

  /** Each weight's mass, kilograms, the default first: IBA rule 45.6, "8, 10 and 12 oz gloves (227 to 340 g) by weight category". */
  export const WEIGHTS: Readonly<
    Record<Weight, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "8oz": { mass: 8 * ArchetypeUnits.OUNCE },
    "10oz": { mass: 10 * ArchetypeUnits.OUNCE },
    "12oz": { mass: 12 * ArchetypeUnits.OUNCE },
  };

  /** The parameters: the weight, and any free dimension fixed to a value inside its band. */
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
    Record<Exclude<Dimension, "mass">, IArchetypeBand>
  > = {
    length: ArchetypeBand.metres(
      0.2,
      0.2,
      `${IBA}, Appendix 11: the glove 20 cm long`,
    ),
    height: ArchetypeBand.metres(
      0.14,
      0.16,
      `${IBA}, Appendix 11: 14 to 16 cm`,
    ),
    width: ArchetypeBand.metres(
      0.125,
      0.135,
      "Iron Body Fitness 12 oz training glove, 12.5 cm high and 13.5 cm deep, as a search result gives the retailer's listing; not read",
      true,
    ),
    cuff: ArchetypeBand.metres(
      0.08,
      0.1,
      `${IBA}, Appendix 11: the cuff 8 to 10 cm`,
    ),
  };
}

import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Cigarette lengths and the 3R4F reference cigarette, neither read at a primary source. */
const CIGARETTE: string =
  "regular 70 mm to 100s 100 mm (Wikipedia, Cigarette, https://en.wikipedia.org/wiki/Cigarette); the 3R4F reference cigarette's 24.8 mm circumference and 27 mm filter (Adamson et al. 2012, Chemistry Central Journal 6:98, Table 2, seen only in search results)";

/**
 * A cigarette or a pocket lighter.
 *
 * A cigarette lies along `+Z` from its filter end at the origin to its lit end; it is pinched just beyond the filter, the mouth takes the filter end and a flame meets the lit end. A lighter stands on its base at the origin with its spark wheel on top toward `+Z`; the hand wraps the body, the thumb turns the wheel and presses the gas lever beside it, and the flame stands above the top.
 *
 * @param params The kind, a lighter's model, and any dimension the author fixes.
 * @param seed The seed that picks a lighter's model when none is given and draws every dimension left free inside its band; absent, the first model and the middle of each band.
 * @returns The cigarette or the lighter.
 * @throws {ArchetypeRefusal} For a model the kind does not have, or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each thing lies and where each contact is.
 * @evidence contracts/development/implementation.md#principled-implementation Two rods for a cigarette, a box and a wheel for a lighter, from the drawn sizes or the lighter model's read ones, one model whole; the wheel is a `knob` whose part turns with it, as #3369 asks.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per kind.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No smoke, ash or flame is modelled: the flame is a place, for a law to use.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts for either kind: a cigarette's filter and paper, a lighter's body and wheel.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createSmoking(
  params: createSmoking.IParams,
  seed?: number | string,
): Archetype<createSmoking.Affordance, createSmoking.Dimension> {
  const draw: ArchetypeDrawSession<createSmoking.Dimension> = new ArchetypeDrawSession<createSmoking.Dimension>("smoking", createSmoking.UNITS, seed, params);
  const kind: createSmoking.Kind = ArchetypeDraw.choice(
    "smoking",
    "kind",
    params.kind,
    createSmoking.KINDS,
  );
  const drawn: Partial<Record<createSmoking.Dimension, number>> =
    draw.dimensions(createSmoking.BANDS[kind], createSmoking.BANDS);
  // A lighter is one of BIC's two models whole.
  const model: { name: createSmoking.Model | undefined; figures: createSmoking.Figures } =
    draw.model<createSmoking.Model>("model", params.model, createSmoking.MODELS[kind]);
  const d: Partial<Record<createSmoking.Dimension, number>> = { ...drawn, ...model.figures };
  const builder: ArchetypeBuilder<
    createSmoking.Affordance,
    createSmoking.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: model.name === undefined ? kind : ` ${model.name}`,
    draw,
  });

  if (kind === "cigarette") {
    const radius: number = d.diameter! / 2;
    const filter: number = d.filter!;
    const length: number = d.length!;
    builder.rod(
      "filter",
      radius,
      Vector3.create(0, radius, 0),
      Vector3.create(0, radius, filter),
      { color: "#c98f4e" },
    );
    builder.rod(
      "paper",
      radius,
      Vector3.create(0, radius, filter),
      Vector3.create(0, radius, length),
      { color: "#f1efe8" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, radius, filter + 0.01),
        Vector3.create(0, 1, 0),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
      grip: "precision",
      aperture: 2 * radius,
    });
    builder.affordance({
      id: "mouth",
      kind: "socket",
      direction: "along",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, radius, 0),
        Vector3.create(0, 0, -1),
      ),
      extent: null,
    });
    builder.affordance({
      id: "flame",
      kind: "socket",
      direction: "along",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, radius, length),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  const width: number = d.width!;
  const height: number = d.length!;
  const depth: number = d.diameter!;
  const wheel: number = depth * 0.3;
  builder.box(
    "body",
    Vector3.create(width, height - 2 * wheel, depth),
    Vector3.create(0, (height - 2 * wheel) / 2, 0),
    { color: "#c0392b" },
  );
  builder.rod(
    "wheel",
    wheel,
    Vector3.create(-width * 0.2, height - wheel, depth * 0.1),
    Vector3.create(width * 0.2, height - wheel, depth * 0.1),
    { color: "#8a8d91" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, (height - 2 * wheel) / 2, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: depth,
    length: height - 2 * wheel,
  });
  builder.affordance({
    id: "wheel",
    kind: "knob",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, height - wheel, depth * 0.1),
      Vector3.create(1, 0, 0),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    travel: 90,
    parts: ["wheel"],
  });
  builder.affordance({
    id: "valve",
    kind: "button",
    frame: ArchetypeFrame.upright(
      Vector3.create(0, height - 2 * wheel, -depth * 0.25),
    ),
    extent: null,
    travel: 0.003,
  });
  builder.affordance({
    id: "flame",
    kind: "socket",
    direction: "along",
    frame: ArchetypeFrame.upright(
      Vector3.create(0, height + 0.015, depth * 0.3),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createSmoking}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The sizes a pinch and a thumb read (#3369).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `flame` names the same thing on both kinds, the place fire is, so a lighting act joins the two frames.
 */
export namespace createSmoking {
  /** The kinds. */
  export type Kind = "cigarette" | "lighter";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["cigarette", "lighter"];

  /**
   * The affordance ids:
   *
   * - `grip`: a cigarette's pinch just beyond its filter, or the hand round a lighter's body.
   * - `mouth`: a cigarette's filter end, which the lips take.
   * - `flame`: where fire is: a cigarette's lit end, or the point above a lighter's top where its flame stands.
   * - `wheel`: a lighter's spark wheel, a knob the thumb rolls a quarter turn (the turn is an estimate).
   * - `valve`: a lighter's gas lever, a button under the thumb pressed 3 mm (an estimate).
   */
  export type Affordance = "grip" | "mouth" | "flame" | "wheel" | "valve";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: a cigarette's length, or a lighter's height.
   * - `diameter`: a cigarette's diameter, or a lighter's thickness along `+Z`.
   * - `width`: a lighter's width along `+X`.
   * - `filter`: the length of a cigarette's filter.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "diameter" | "width" | "filter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    diameter: "m",
    width: "m",
    filter: "m",
    mass: "kg",
  };

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which thing. */
    kind: Kind;

    /** A lighter's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `smoking` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The lighters read: BIC's Maxi J26 and Mini J25. */
  export type Model = "J26" | "J25";

  /** Each kind's models whole, the default first: a lighter's height (length), thickness (diameter), width and mass, 8.2 x 1.5 x 2.5 cm and 24.667 g for the J26 and 6.2 x 1.1 x 2.2 cm and 13 g for the J25 (https://bicgraphic.com/gb/bic-j26-lighter-3460002320.html, https://www.bicgraphic.com/fi/bic-j25-lighter-3460002360.html). */
  export const MODELS: Readonly<Partial<Record<Kind, Readonly<Record<Model, Figures>>>>> = {
    lighter: {
      J26: { length: 0.082, diameter: 0.015, width: 0.025, mass: 0.024667 },
      J25: { length: 0.062, diameter: 0.011, width: 0.022, mass: 0.013 },
    },
  };

  /** The band of each free dimension, by kind; a lighter's are its model's. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    cigarette: {
      length: ArchetypeBand.metres(0.07, 0.1, CIGARETTE, true),
      diameter: ArchetypeBand.metres(0.0079, 0.0079, CIGARETTE, true),
      filter: ArchetypeBand.metres(0.02, 0.027, CIGARETTE, true),
      mass: ArchetypeBand.of(
        "kg",
        0.0008,
        0.001,
        ArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    lighter: {},
  };
}

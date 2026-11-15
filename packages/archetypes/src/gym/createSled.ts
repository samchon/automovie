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

/** What no source read gives. */
const UNREAD: string =
  "the Rogue pages read give no distance between the uprights; inside the base's width";

/**
 * A push sled: a weighted base on the floor with two upright poles a pusher leans into.
 *
 * The base runs forward along `+Z` from its back edge at the origin, centred on `X`, and the pusher stands behind it at `-Z`, facing `+Z`. The two poles rise from the base's back corners; `left` and `right` are the upper reach of each, the pusher's left and right hand's handle (`left` at `+X`, the pusher's left as it faces `+Z`), taken from behind (`-Z`) with the pole's axis along `+X` of the frame; `deck` is the base's top, where plates are loaded.
 *
 * @param params The sled model and any dimension the author fixes.
 * @param seed The seed that draws the model when it is not given and every dimension left free inside its band; absent, the first model and the middle of each band.
 * @returns The sled.
 * @throws {ArchetypeRefusal} For a model Rogue does not list or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the sled stands, which way it is pushed and its three contacts.
 * @evidence contracts/development/implementation.md#principled-implementation A base box of one Rogue sled's length and width, and two pole rods from its back corners up to that sled's handle height, the drawn spacing apart; each handle is the pole's top, a hand's breadth below its end.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the sled, draw the spacing, the base, the two poles with their handles, the deck.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The poles stand upright, not raked back; no plate horns or runners; the base's and the poles' thickness are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createSled(
  params: createSled.IParams = {},
  seed?: number | string,
): Archetype<createSled.Affordance, createSled.Dimension> {
  const draw: ArchetypeDrawSession<createSled.Dimension> = new ArchetypeDrawSession<createSled.Dimension>("sled", createSled.UNITS, seed, params);
  const model: {
    name: createSled.Model | undefined;
    figures: Readonly<Partial<Record<createSled.Dimension, number>>>;
  } = draw.model<createSled.Model>("model", params.model, createSled.MODELS);
  const d: Partial<Record<createSled.Dimension, number>> = {
    ...draw.dimensions(createSled.BANDS),
    ...model.figures,
  };
  const width: number = d.width!;
  const length: number = d.length!;
  const height: number = d.height!;
  const builder: ArchetypeBuilder<createSled.Affordance, createSled.Dimension> =
    new ArchetypeBuilder({
      id: params.id,
      name: `push sled ${model.name}`,
      draw,
    });
  const v: typeof Vector3.create = Vector3.create;
  const base: number = createSled.BASE;
  const pole: number = createSled.POLE;
  builder.box("base", v(width, base, length), v(0, base / 2, length / 2), {
    color: "#2c2f33",
    density: 3,
  });
  for (const [id, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const x: number = (sign * d.spacing!) / 2;
    builder.rod(`${id}Pole`, pole / 2, v(x, base, pole), v(x, height, pole), {
      color: "#8a8d91",
    });
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v(x, height - createSled.HAND, pole),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: pole,
      length: createSled.HAND,
    });
  }
  builder.affordance({
    id: "deck",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, base, length / 2)),
    extent: null,
    width,
    depth: length,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createSled}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation Rogue's two sleds picked whole, one band for the spacing; the handle's height and spacing are the two a push reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two handles a push takes, named as `pushSled` reads them by default, and the deck.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The height, the base's size and the mass are one of Rogue's two sleds as read, never mixed; no source gives the uprights' spacing, so its band is provisional; the base's and the poles' thickness and the hand's breadth are named estimates.
 */
export namespace createSled {
  /** The base's thickness, metres: an estimate. */
  export const BASE: number = 0.1;

  /** The poles' diameter, metres: an estimate. */
  export const POLE: number = 0.04;

  /** A hand's breadth on the pole below its top, metres: an estimate. */
  export const HAND: number = 0.12;

  /**
   * The affordance ids:
   *
   * - `left`, `right`: the poles' tops, the pusher's left and right handles, taken from `-Z`.
   * - `deck`: the base's top.
   */
  export type Affordance = "left" | "right" | "deck";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the poles' tops above the floor.
   * - `spacing`: between the poles' axes.
   * - `length`, `width`: the base's.
   * - `mass`: kilograms, unloaded.
   */
  export type Dimension = "height" | "spacing" | "length" | "width" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    height: "m",
    spacing: "m",
    length: "m",
    width: "m",
    mass: "kg",
  };

  /** Rogue's sleds. */
  export type Model = "Slice" | "Echo Dog";

  /** Each sled's figures, metres and kilograms, the default first: Rogue's Slice Sled, "27.5 x 22.75 in", 37.25 in to the handles' tops, 65 lb (https://support.roguefitness.com/hc/en-us/articles/47308098443156-Product-Guide-Rogue-Slice-Sled); its Echo Dog Sled, 36.5 x 25 in, 37.5 in high with its uprights, 87 lb (https://www.roguefitness.com/rogue-echo-dog-sled). */
  export const MODELS: Readonly<
    Record<Model, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    Slice: {
      length: 27.5 * ArchetypeUnits.INCH,
      width: 22.75 * ArchetypeUnits.INCH,
      height: 37.25 * ArchetypeUnits.INCH,
      mass: 65 * ArchetypeUnits.POUND,
    },
    "Echo Dog": {
      length: 36.5 * ArchetypeUnits.INCH,
      width: 25 * ArchetypeUnits.INCH,
      height: 37.5 * ArchetypeUnits.INCH,
      mass: 87 * ArchetypeUnits.POUND,
    },
  };

  /** The parameters: the sled, and the spacing fixed to a value inside its band. */
  export interface IParams extends Partial<Record<"spacing", number>> {
    /** Rogue's sled; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `sled` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<"spacing", IArchetypeBand>> = {
    // Inside the narrowest base less a pole, so both poles stand on it.
    spacing: ArchetypeBand.metres(0.45, 0.53, UNREAD, true),
  };
}

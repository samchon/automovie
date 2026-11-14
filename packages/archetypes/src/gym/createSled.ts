import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** What a maker's sled reads as, not read at a source. */
const MAKER: string = "a common maker's push sled (a prowler), not read at a source";

/**
 * A push sled: a weighted base on the floor with two upright poles a pusher leans into.
 *
 * The base runs forward along `+Z` from its back edge at the origin, centred on `X`, and the pusher stands behind it at `-Z`, facing `+Z`. The two poles rise from the base's back corners; `left` and `right` are the upper reach of each, the pusher's left and right hand's handle, taken from behind (`-Z`) with the pole's axis along `+X` of the frame; `deck` is the base's top, where plates are loaded.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The sled.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the sled stands, which way it is pushed and its three contacts.
 * @evidence contracts/development/implementation.md#principled-implementation A base box of the drawn length and width, and two pole rods from its back corners up to the drawn handle height, the drawn spacing apart; each handle is the pole's top, a hand's breadth below its end.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the base, the two poles with their handles, the deck.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The poles stand upright, not raked back; no plate horns or runners; the base's and the poles' thickness are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createSled(
  params: createSled.IParams = {},
  seed?: number | string,
): Archetype<createSled.Affordance, createSled.Dimension> {
  const d: Record<createSled.Dimension, number> = ArchetypeDraw.dimensions(
    "sled",
    createSled.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<createSled.Affordance, createSled.Dimension> =
    new ArchetypeBuilder({
      archetype: "sled",
      id: params.id,
      name: "push sled",
      dimensions: d,
    });
  const v: typeof Vector3.create = Vector3.create;
  const base: number = createSled.BASE;
  const pole: number = createSled.POLE;
  builder.box("base", v(d.width, base, d.length), v(0, base / 2, d.length / 2), {
    color: "#2c2f33",
    density: 3,
  });
  for (const [id, sign] of [
    ["left", -1],
    ["right", 1],
  ] as const) {
    const x: number = (sign * d.spacing) / 2;
    builder.rod(`${id}Pole`, pole / 2, v(x, base, pole), v(x, d.height, pole), {
      color: "#8a8d91",
    });
    builder.affordance({
      id,
      kind: "handle",
      frame: ArchetypeFrame.facing(
        v(x, d.height - createSled.HAND, pole),
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
    frame: ArchetypeFrame.upright(v(0, base, d.length / 2)),
    extent: null,
    width: d.width,
    depth: d.length,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createSled}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation One band per dimension; the handle's height and spacing are the two a push reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two handles a push takes, named as `pushSled` reads them by default, and the deck.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source was read for a sled, so every band is provisional; the base's and the poles' thickness and the hand's breadth are named estimates.
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

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `sled` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    height: ArchetypeBand.metres(0.95, 1.2, MAKER, true),
    spacing: ArchetypeBand.metres(0.45, 0.6, MAKER, true),
    length: ArchetypeBand.metres(0.9, 1.1, MAKER, true),
    // At least the widest spacing and a pole, so both poles stand on it.
    width: ArchetypeBand.metres(0.65, 0.75, MAKER, true),
    mass: ArchetypeBand.of("kg", 30, 50, MAKER, true),
  };
}

import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** What a maker's stand reads as, not read at a source. */
const MAKER: string =
  "a common floor stand for swords, clubs and bats, not read at a source";

/**
 * A floor weapon rack: a base with a row of slots and a top rail with a notch over each, where swords, clubs and bats stand upright.
 *
 * The base lies on the floor centred over the origin, its row of slots along `X` and its front toward `+Z`; two end posts carry the top rail at the drawn height. `slot1` to `slot4`, counted from `-X`, are each slot's floor on the base's top, facing up, where a weapon's lower end (a sword's point, a bat's barrel, a club's tip) rests; `rail1` to `rail4` the notch above it in the top rail's front, facing `+Z`, against which the weapon leans. A weapon set in a slot keeps its own `grip` for a hand to reach.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The rack.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the rack stands, where each weapon rests and leans and that the weapon keeps its own grip.
 * @evidence contracts/development/implementation.md#principled-implementation A base box of the drawn width, two end post rods up to the drawn rail height and a rail box across their tops; the four slots are spaced evenly along the base.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, base, posts, rail, then a slot and a notch per place.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No slot dividers or notches are cut; the base's, posts' and rail's sizes are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createWeaponRack(
  params: createWeaponRack.IParams = {},
  seed?: number | string,
): Archetype<createWeaponRack.Affordance, createWeaponRack.Dimension> {
  const d: Record<createWeaponRack.Dimension, number> =
    ArchetypeDraw.dimensions(
      "weaponRack",
      createWeaponRack.BANDS,
      seed,
      params,
    );
  const builder: ArchetypeBuilder<
    createWeaponRack.Affordance,
    createWeaponRack.Dimension
  > = new ArchetypeBuilder({
    archetype: "weaponRack",
    id: params.id,
    name: "weapon rack",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const base: number = createWeaponRack.BASE;
  const post: number = createWeaponRack.POST;
  const half: number = d.width / 2;
  builder.box(
    "base",
    v(d.width, base, createWeaponRack.DEPTH),
    v(0, base / 2, 0),
    {
      color: "#5a3e2b",
    },
  );
  for (const [id, x] of [
    ["leftPost", -half + post / 2],
    ["rightPost", half - post / 2],
  ] as const)
    builder.rod(id, post / 2, v(x, base, 0), v(x, d.height, 0), {
      color: "#5a3e2b",
    });
  builder.box("rail", v(d.width, post, post), v(0, d.height - post / 2, 0), {
    color: "#5a3e2b",
  });
  const inner: number = d.width - 2 * post;
  for (const [slot, rail, k] of [
    ["slot1", "rail1", 0],
    ["slot2", "rail2", 1],
    ["slot3", "rail3", 2],
    ["slot4", "rail4", 3],
  ] as const) {
    const x: number = -inner / 2 + (inner * (k + 0.5)) / 4;
    builder.affordance({
      id: slot,
      kind: "surface",
      frame: ArchetypeFrame.upright(v(x, base, 0)),
      extent: null,
      width: inner / 4,
      depth: createWeaponRack.DEPTH,
    });
    builder.affordance({
      id: rail,
      kind: "surface",
      frame: ArchetypeFrame.facing(
        v(x, d.height - post / 2, post / 2),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
    });
  }
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createWeaponRack}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation One band per dimension; the rail's height is the one that decides which weapons lean in it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four places to stand a weapon, each a floor and a notch.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source was read for a rack, so every band is provisional; the parts' sizes are named estimates.
 */
export namespace createWeaponRack {
  /** The base's height, metres: an estimate. */
  export const BASE: number = 0.05;

  /** The base's depth front to back, metres: an estimate. */
  export const DEPTH: number = 0.3;

  /** The posts' and the rail's section, metres: an estimate. */
  export const POST: number = 0.04;

  /**
   * The affordance ids:
   *
   * - `slot1` to `slot4`: each slot's floor on the base's top, facing up, from `-X`.
   * - `rail1` to `rail4`: the notch over each in the rail's front, facing `+Z`.
   */
  export type Affordance =
    | "slot1"
    | "slot2"
    | "slot3"
    | "slot4"
    | "rail1"
    | "rail2"
    | "rail3"
    | "rail4";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: the rack's, post to post outside.
   * - `height`: the rail's top above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "height" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `weaponRack` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    width: ArchetypeBand.metres(0.8, 1.2, MAKER, true),
    height: ArchetypeBand.metres(0.7, 0.9, MAKER, true),
    mass: ArchetypeBand.of("kg", 8, 20, MAKER, true),
  };
}

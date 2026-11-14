import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The wall of the loop or the sleeve round its opening, metres: an estimate. */
const WALL: number = 0.008;

/**
 * A carrier worn on the body (`IHumanProp.worn`) for a club: a belt loop a baton hangs through, or a back sleeve a bat stands in.
 *
 * It stands on its lower end at the origin, its opening straight up along `+Y`: a belt loop is a short square ring under a strap up to the belt, a back sleeve a long square channel with the strap at its middle. `socket` is the opening's top, facing up: the club stands grip up through it, drawn out upward by its grip. `belt` is where the strap meets the wearer, facing the body on `-X`.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The carrier.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the carrier stands, how a club sits in it and its two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Four wall boxes round a square opening of the drawn aperture, as tall as the drawn length, and a strap box from the walls' side toward the wearer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the four walls, the strap, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The opening is square, not round; the strap is rigid; the wall's thickness is a named estimate.
 * @evidence contracts/development/implementation.md#efficient-algorithms Five parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createWeaponLoop(
  params: createWeaponLoop.IParams,
  seed?: number | string,
): Archetype<createWeaponLoop.Affordance, createWeaponLoop.Dimension> {
  const kind: createWeaponLoop.Kind = ArchetypeDraw.choice(
    "weaponLoop",
    "kind",
    params.kind,
    createWeaponLoop.KINDS,
  );
  const d: Record<createWeaponLoop.Dimension, number> =
    ArchetypeDraw.dimensions(
      "weaponLoop",
      createWeaponLoop.BANDS[kind],
      seed,
      params,
    );
  const builder: ArchetypeBuilder<
    createWeaponLoop.Affordance,
    createWeaponLoop.Dimension
  > = new ArchetypeBuilder({
    archetype: "weaponLoop",
    id: params.id,
    name: kind === "belt" ? "belt loop" : "back sleeve",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const half: number = (d.aperture + WALL) / 2;
  const span: number = d.aperture + 2 * WALL;
  for (const [id, size, at] of [
    ["wallFront", v(span, d.length, WALL), v(0, d.length / 2, half)],
    ["wallBack", v(span, d.length, WALL), v(0, d.length / 2, -half)],
    ["wallLeft", v(WALL, d.length, d.aperture), v(half, d.length / 2, 0)],
    ["wallRight", v(WALL, d.length, d.aperture), v(-half, d.length / 2, 0)],
  ] as const)
    builder.box(id, size, at, { color: "#3a2a1e" });
  // The strap toward the wearer: up to the belt over a loop, along the
  // middle of a sleeve.
  const strap: number = createWeaponLoop.STRAP[kind];
  const side: number = -(span / 2 + WALL / 2);
  const middle: number = kind === "belt" ? d.length + strap / 2 : d.length / 2;
  builder.box("strap", v(WALL, strap, 0.04), v(side, middle, 0), {
    color: "#3a2a1e",
  });
  builder.affordance({
    id: "socket",
    kind: "socket",
    frame: ArchetypeFrame.upright(v(0, d.length, 0)),
    extent: null,
  });
  builder.affordance({
    id: "belt",
    kind: "hook",
    frame: ArchetypeFrame.facing(
      v(side - WALL / 2, kind === "belt" ? d.length + strap : middle, 0),
      v(-1, 0, 0),
      v(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createWeaponLoop}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the two carriers and one band per dimension each, the opening sized to the club it holds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The opening a draw leaves and the strap it is worn by.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source was read for a carrier, so every band is provisional, set from `createClub`'s baton and bat; the strap's length is a named estimate.
 */
export namespace createWeaponLoop {
  /** The kinds: a belt loop a baton hangs through, a back sleeve a bat stands in. */
  export type Kind = "belt" | "back";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["belt", "back"];

  /** The strap's length, metres, by kind: estimates. */
  export const STRAP: Readonly<Record<Kind, number>> = {
    belt: 0.08,
    back: 0.2,
  };

  /**
   * The affordance ids:
   *
   * - `socket`: the opening's top, facing up.
   * - `belt`: where the strap meets the wearer, facing the body on `-X`.
   */
  export type Affordance = "socket" | "belt";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `aperture`: the opening across, inside the walls.
   * - `length`: the walls' height, the ring's or the sleeve's.
   * - `mass`: kilograms.
   */
  export type Dimension = "aperture" | "length" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which carrier. */
    kind: Kind;

    /** The model's id, unique in a scene; `weaponLoop` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    belt: {
      aperture: ArchetypeBand.metres(
        0.04,
        0.05,
        "wider than a baton's shaft and narrower than its grip's end, an estimate",
        true,
      ),
      length: ArchetypeBand.metres(
        0.025,
        0.04,
        "a ring's depth, an estimate",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.05,
        0.12,
        ArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    back: {
      aperture: ArchetypeBand.metres(
        0.075,
        0.09,
        "wider than a bat's barrel, at most 2.61 in across, an estimate",
        true,
      ),
      length: ArchetypeBand.metres(
        0.25,
        0.35,
        "a sleeve holding a bat's barrel, an estimate",
        true,
      ),
      mass: ArchetypeBand.of("kg", 0.2, 0.5, ArchetypeBand.TYPICAL_MASS, true),
    },
  };
}

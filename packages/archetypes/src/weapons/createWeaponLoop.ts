import { Vector3 } from "@automovie/engine";

import {
  ArchetypeUnits,
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
 * @param params The kind, a belt loop's ring and any dimension the author fixes.
 * @param seed The seed that picks the ring left free and draws every dimension left free inside its band; absent, the first ring and the middle of each band.
 * @returns The carrier.
 * @throws {ArchetypeRefusal} For a ring not of the kind, a fixed dimension outside its band, or one the ring gives.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the carrier stands, how a club sits in it and its two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Four wall boxes round a square opening of the drawn aperture, as tall as the drawn length, and a strap box from the walls' side toward the wearer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the ring, draw the other dimensions, the four walls, the strap, two contacts.
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
  // A belt loop's ring is one of the three read rings whole; a back sleeve has no read model, its bands.
  const model: { figures: Readonly<Partial<Record<createWeaponLoop.Dimension, number>>> } =
    ArchetypeDraw.model<createWeaponLoop.Model, createWeaponLoop.Dimension>(
      "weaponLoop",
      "model",
      params.model,
      createWeaponLoop.MODELS[kind],
      seed,
      params,
    );
  const d: Partial<Record<createWeaponLoop.Dimension, number>> = {
    ...ArchetypeDraw.dimensions("weaponLoop", createWeaponLoop.BANDS[kind], seed, params, createWeaponLoop.BANDS),
    ...model.figures,
  };
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
  const half: number = (d.aperture! + WALL) / 2;
  const span: number = d.aperture! + 2 * WALL;
  for (const [id, size, at] of [
    ["wallFront", v(span, d.length!, WALL), v(0, d.length! / 2, half)],
    ["wallBack", v(span, d.length!, WALL), v(0, d.length! / 2, -half)],
    ["wallLeft", v(WALL, d.length!, d.aperture!), v(half, d.length! / 2, 0)],
    ["wallRight", v(WALL, d.length!, d.aperture!), v(-half, d.length! / 2, 0)],
  ] as const)
    builder.box(id, size, at, { color: "#3a2a1e" });
  // The strap toward the wearer: up to the belt over a loop, along the
  // middle of a sleeve.
  const strap: number = createWeaponLoop.STRAP[kind];
  const side: number = -(span / 2 + WALL / 2);
  const middle: number = kind === "belt" ? d.length! + strap / 2 : d.length! / 2;
  builder.box("strap", v(WALL, strap, 0.04), v(side, middle, 0), {
    color: "#3a2a1e",
  });
  builder.affordance({
    id: "socket",
    kind: "socket",
    frame: ArchetypeFrame.upright(v(0, d.length!, 0)),
    extent: null,
  });
  builder.affordance({
    id: "belt",
    kind: "hook",
    frame: ArchetypeFrame.facing(
      v(side - WALL / 2, kind === "belt" ? d.length! + strap : middle, 0),
      v(-1, 0, 0),
      v(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createWeaponLoop}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the two carriers and of the read rings, each whole, and one band per dimension a ring leaves, the opening sized to the club it holds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The opening a draw leaves and the strap it is worn by.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A belt ring's opening is one maker's as read, never between two; no source gives a ring's depth or a bat sleeve's size, so those bands are provisional, set from the bat the rule allows; the strap's length is a named estimate.
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

  /** The read baton rings: Safariland's 692S, Rothco's and High Speed Gear's. */
  export type Model = "safariland692s" | "rothco" | "highSpeedGear";

  /** Each kind's rings whole, the default first, by their opening inside: Safariland 692S 35 mm (https://varusteleka.com/en-us/products/safariland-model-692s-baton-ring-unissued), Rothco 1.5 in (https://rothco.com/product/rothco-two-ring-baton-flashlight-holder) and High Speed Gear 1.5 in (https://www.highspeedgear.com/products/duty-baton-ring-holder); a back sleeve has none. */
  export const MODELS: Readonly<Partial<Record<Kind, Readonly<Record<Model, Readonly<Partial<Record<Dimension, number>>>>>>>> = {
    belt: {
      safariland692s: { aperture: 0.035 },
      rothco: { aperture: 1.5 * ArchetypeUnits.INCH },
      highSpeedGear: { aperture: 1.5 * ArchetypeUnits.INCH },
    },
  };

  /** The parameters: the kind, a belt loop's ring, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which carrier. */
    kind: Kind;

    /** Which of the read rings a belt loop is; picked from the seed when absent. A back sleeve has none. */
    model?: Model;

    /** The model's id, unique in a scene; `weaponLoop` when absent. */
    id?: string;
  }

  /** The band of each free dimension a ring leaves, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    belt: {
      length: ArchetypeBand.metres(
        0.025,
        0.04,
        "a ring's depth; the rings' pages read do not give it",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.05,
        0.12,
        "the rings' pages read give no weight",
        true,
      ),
    },
    back: {
      aperture: ArchetypeBand.metres(
        0.075,
        0.09,
        "wider than a bat's barrel, at most 2.61 in across by the Official Baseball Rules 2024, 3.02(a); no bat sleeve's size was found",
        true,
      ),
      length: ArchetypeBand.metres(
        0.25,
        0.35,
        "a sleeve holding a bat's barrel; no bat sleeve's size was found",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.2,
        0.5,
        "no bat sleeve's weight was found",
        true,
      ),
    },
  };
}

import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** A duty-gear maker's description of holster ride heights. */
const RIDE: string =
  "Safariland, Holster Ride Options: mid-ride puts the pistol's butt level with the belt, low and high ride about 1.5 in lower and higher (https://inside.safariland.com/education/holster-ride-options/)";

/**
 * A belt holster for a handgun.
 *
 * The holster hangs with the middle of its belt loop at the origin, the wearer's body on the `-X` side and the front toward `+Z`. Its `socket` is the mouth the pistol is drawn from and returned to, facing up, lowered or raised from the belt line by the `ride` dimension. It marks where the pistol's butt leaves the mouth; a holstered pistol lies muzzle down in the pouch, which the holstering act places, and no frame of `createHandgun` seats coincident on the socket to give that. `belt` is the loop's own frame, for placing the holster on a hip.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The holster.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the holster hangs, what the socket is and how ride moves it.
 * @evidence contracts/development/implementation.md#principled-implementation A pouch box under a belt loop box; the socket's height from the belt line is the maker's ride offset.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, two parts, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No retention strap or cant.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHolster(
  params: createHolster.IParams = {},
  seed?: number | string,
): Archetype<createHolster.Affordance, createHolster.Dimension> {
  const d: Record<createHolster.Dimension, number> = ArchetypeDraw.dimensions(
    "holster",
    createHolster.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createHolster.Affordance,
    createHolster.Dimension
  > = new ArchetypeBuilder({
    archetype: "holster",
    id: params.id,
    name: "belt holster",
    dimensions: d,
  });
  builder.box(
    "loop",
    Vector3.create(0.01, 0.06, 0.06),
    Vector3.create(0, 0, 0),
    {
      color: "#2c2f33",
    },
  );
  builder.box(
    "pouch",
    Vector3.create(0.04, d.depth, 0.07),
    Vector3.create(0.025, d.ride - d.depth / 2, 0),
    { color: "#2c2f33" },
  );
  builder.affordance({
    id: "socket",
    kind: "socket",
    frame: ArchetypeFrame.upright(Vector3.create(0.025, d.ride, 0)),
    extent: null,
  });
  builder.affordance({
    id: "belt",
    kind: "hook",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, 0, 0),
      Vector3.create(-1, 0, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createHolster}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The mouth's place relative to the belt, which a draw reads (#3374).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The holster is its own archetype, so it is placed on a body without the pistol.
 */
export namespace createHolster {
  /**
   * The affordance ids:
   *
   * - `socket`: the holster's mouth, facing up.
   * - `belt`: the belt loop, facing the wearer's body.
   */
  export type Affordance = "socket" | "belt";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `ride`: the mouth above the belt line; negative below it.
   * - `depth`: the pouch from its mouth down.
   * - `mass`: kilograms.
   */
  export type Dimension = "ride" | "depth" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `holster` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    ride: ArchetypeBand.of("m", -0.038, 0.038, RIDE),
    depth: ArchetypeBand.of(
      "m",
      0.12,
      0.16,
      "pouch depth for a 102 to 119 mm barrel, an estimate",
      true,
    ),
    mass: ArchetypeBand.of("kg", 0.15, 0.3, ArchetypeBand.TYPICAL_MASS, true),
  };
}

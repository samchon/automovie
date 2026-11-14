import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/**
 * A scabbard for a sword or a sheath for a knife, worn on the body (`IHumanProp.worn`).
 *
 * It stands on its tip (the chape) at the origin, its mouth straight up along `+Y` at the drawn length, the blade's flats toward `X`. `mouth` is the opening a blade is drawn from and returned to, facing up: a sheathed blade stands point down in it with its shoulder (`createSword`'s origin) on the mouth. `belt` is the hanger just below the mouth, facing the wearer's body on `-X`, for placing it on a hip.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The scabbard.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the scabbard stands, how a sheathed blade sits in it and its two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation One body box of the drawn length, width and thickness, and a throat box at the mouth a little wider, where the hanger sits.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, two parts, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body is straight and does not taper or curve with a sabre's blade; the throat's size is a named estimate.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createScabbard(
  params: createScabbard.IParams,
  seed?: number | string,
): Archetype<createScabbard.Affordance, createScabbard.Dimension> {
  const kind: createScabbard.Kind = ArchetypeDraw.choice(
    "scabbard",
    "kind",
    params.kind,
    createScabbard.KINDS,
  );
  const d: Record<createScabbard.Dimension, number> = ArchetypeDraw.dimensions(
    "scabbard",
    createScabbard.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createScabbard.Affordance,
    createScabbard.Dimension
  > = new ArchetypeBuilder({
    archetype: "scabbard",
    id: params.id,
    name: kind === "sword" ? "scabbard" : "sheath",
    dimensions: d,
  });
  const throat: number = createScabbard.THROAT;
  builder.box(
    "body",
    Vector3.create(d.thickness, d.length - throat, d.width),
    Vector3.create(0, (d.length - throat) / 2, 0),
    { color: "#4a3426" },
  );
  builder.box(
    "throat",
    Vector3.create(d.thickness + 0.006, throat, d.width + 0.006),
    Vector3.create(0, d.length - throat / 2, 0),
    { color: "#8a8d91" },
  );
  builder.affordance({
    id: "mouth",
    kind: "socket",
    frame: ArchetypeFrame.upright(Vector3.create(0, d.length, 0)),
    extent: null,
  });
  builder.affordance({
    id: "belt",
    kind: "hook",
    frame: ArchetypeFrame.facing(
      Vector3.create(-(d.thickness + 0.006) / 2, d.length - throat / 2, 0),
      Vector3.create(-1, 0, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createScabbard}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the sword's scabbard and the knife's sheath, each sized to hold the blades `createSword`'s bands give its kinds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The mouth a draw leaves and the hanger it is worn by.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source was read for a scabbard, so every band is provisional, set from the blades it must hold; the throat's size is a named estimate.
 */
export namespace createScabbard {
  /** The kinds: a sword's scabbard and a knife's or a dagger's sheath. */
  export type Kind = "sword" | "knife";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["sword", "knife"];

  /** The metal throat at the mouth, its length along the scabbard, metres: an estimate. */
  export const THROAT: number = 0.05;

  /**
   * The affordance ids:
   *
   * - `mouth`: the opening at the top, facing up.
   * - `belt`: the hanger below the mouth, facing the wearer on `-X`.
   */
  export type Affordance = "mouth" | "belt";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the tip to the mouth.
   * - `width`: across the blade's edge to back, along `Z`.
   * - `thickness`: across the flats, along `X`.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "width" | "thickness" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which scabbard. */
    kind: Kind;

    /** The model's id, unique in a scene; `scabbard` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    sword: {
      length: ArchetypeBand.metres(
        0.8,
        1.08,
        "a blade of createSword's arming sword to rapier, 0.78 to 1.04 m, and a few centimetres beyond its point",
        true,
      ),
      width: ArchetypeBand.metres(
        0.05,
        0.07,
        "a blade's width and the leather round it, an estimate",
        true,
      ),
      thickness: ArchetypeBand.metres(
        0.015,
        0.025,
        "a blade's thickness and the leather round it, an estimate",
        true,
      ),
      mass: ArchetypeBand.of("kg", 0.3, 0.6, ArchetypeBand.TYPICAL_MASS, true),
    },
    knife: {
      length: ArchetypeBand.metres(
        0.18,
        0.38,
        "a blade of createSword's knife to dagger, 0.178 to 0.36 m, and a little beyond its point",
        true,
      ),
      width: ArchetypeBand.metres(
        0.035,
        0.05,
        "a blade's width and the leather round it, an estimate",
        true,
      ),
      thickness: ArchetypeBand.metres(
        0.012,
        0.02,
        "a blade's thickness and the leather round it, an estimate",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.05,
        0.15,
        ArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
  };
}

import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "../core";
import { TabletopStack } from "./TabletopStack";

/**
 * A six-sided die: "Common dice are small cubes, most often 1.6 cm (0.63 in)
 * across" (English Wikipedia, Dice, read 2026-11-21). The mass is not read,
 * so it is a provisional estimate.
 */
const DIE: Readonly<createDie.IDie> = { side: 0.016, mass: 0.005 };

/**
 * One six-sided die resting on a face.
 *
 * The die is a cube, its origin the centre of the face it rests on, `+Y`
 * up. It is picked up, rolled and placed by the shared tabletop contacts
 * (`TabletopStack`).
 *
 * @param params The optional scene id.
 * @returns The inert die and its contact frames, metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the source size, the frame and the shared contacts.
 * @evidence contracts/development/implementation.md#principled-implementation One cube at the read side and an estimated mass.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Record the dimensions, lay the cube, then the shared contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The mass is a named provisional estimate.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part and three contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the tabletop contacts with the card, chip and note.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs.
 */
export function createDie(
  params: createDie.IParams = {},
): AutoMovieArchetype<createDie.Affordance, createDie.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createDie.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "die",
      { side: "m", mass: "kg" },
      undefined,
    );
  draw.derive("side", DIE.side);
  draw.derive("mass", DIE.mass);
  const builder: AutoMovieArchetypeBuilder<
    createDie.Affordance,
    createDie.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? "die",
    name: "die",
    material: "plastic",
    draw,
  });
  builder.box(
    "cube",
    Vector3.create(DIE.side, DIE.side, DIE.side),
    Vector3.create(0, DIE.side / 2, 0),
    { color: "#f2f0ea" },
  );
  TabletopStack.contacts(builder, DIE.side, DIE.side);
  return builder.build(DIE.mass);
}

/**
 * The inputs, contacts and size of {@link createDie}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the scene id input, the contacts, the dimensions and the die size.
 * @evidence contracts/development/design.md#principled-representation Metres and kilograms; the size states which figure is read.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shared tabletop contacts a roll reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The read side fixes the die, so no dimension is authorable.
 */
export namespace createDie {
  /** The shared pinch, underside and upper sockets. */
  export type Affordance = TabletopStack.Contact;

  /** The side and the mass. */
  export type Dimension = "side" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `die` when absent. */
    id?: string;
  }

  /** The die's size, metres and kilograms. */
  export interface IDie {
    /** The cube's side, read. */
    side: number;

    /** The die's mass, estimated. */
    mass: number;
  }
}

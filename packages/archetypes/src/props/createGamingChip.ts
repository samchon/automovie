import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "../core";
import { TabletopStack } from "./TabletopStack";

/**
 * A casino gaming chip: "The chips used in United States casinos typically
 * weigh about 10 grams" (English Wikipedia, Casino token, read 2026-11-21).
 * No read source gave the diameter or thickness, so the common 39 mm by
 * 3.3 mm are provisional estimates.
 */
const CHIP: Readonly<createGamingChip.IChip> = {
  diameter: 0.039,
  thickness: 0.0033,
  mass: 0.01,
};

/**
 * One gaming chip lying flat.
 *
 * The chip is a disc in the `XZ` plane, its origin the centre of its
 * underside. Chips stack by the shared tabletop contacts (`TabletopStack`):
 * one chip's `base` mounted on the next one's `top`, so a stack moves with
 * the chip at its bottom.
 *
 * @param params The optional scene id.
 * @returns The inert chip and its contact frames, metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the source mass, the provisional size, the frame and how chips stack.
 * @evidence contracts/development/implementation.md#principled-implementation One cylinder at the chip's diameter and thickness at the read mass.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Record the dimensions, lay the disc, then the shared contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Diameter and thickness are named provisional estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part and three contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the tabletop contacts with the card, note and die.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs.
 */
export function createGamingChip(
  params: createGamingChip.IParams = {},
): AutoMovieArchetype<createGamingChip.Affordance, createGamingChip.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createGamingChip.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "gamingChip",
      { diameter: "m", thickness: "m", mass: "kg" },
      undefined,
    );
  draw.derive("diameter", CHIP.diameter);
  draw.derive("thickness", CHIP.thickness);
  draw.derive("mass", CHIP.mass);
  const builder: AutoMovieArchetypeBuilder<
    createGamingChip.Affordance,
    createGamingChip.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? "gamingChip",
    name: "gaming chip",
    material: "plastic",
    draw,
  });
  builder.rod(
    "chip",
    CHIP.diameter / 2,
    Vector3.create(0, 0, 0),
    Vector3.create(0, CHIP.thickness, 0),
    { color: "#2a6db2" },
  );
  TabletopStack.contacts(builder, CHIP.thickness, CHIP.diameter);
  return builder.build(CHIP.mass);
}

/**
 * The inputs, contacts and size of {@link createGamingChip}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the scene id input, the contacts, the dimensions and the chip size.
 * @evidence contracts/development/design.md#principled-representation Metres and kilograms; the size states which figures are read.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shared tabletop contacts a stack and a push read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The chip size is fixed, so no dimension is authorable.
 */
export namespace createGamingChip {
  /** The shared pinch, underside and upper sockets. */
  export type Affordance = TabletopStack.Contact;

  /** The chip's diameter, thickness and mass. */
  export type Dimension = "diameter" | "thickness" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `gamingChip` when absent. */
    id?: string;
  }

  /** The chip's size, metres and kilograms. */
  export interface IChip {
    /** The disc's diameter, estimated. */
    diameter: number;

    /** The disc's thickness, estimated. */
    thickness: number;

    /** The chip's mass, read. */
    mass: number;
  }
}

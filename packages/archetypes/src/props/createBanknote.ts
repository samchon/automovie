import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "../core";
import { TabletopStack } from "./TabletopStack";

/**
 * A United States banknote: "6.14 length × 2.61 width × 0.0043 in thickness
 * = 156 × 66.3 × 0.11 mm" and "Approx. 1 g" (English Wikipedia, United States
 * one-dollar bill, read 2026-11-21).
 */
const NOTE: Readonly<createBanknote.INote> = {
  length: 0.156,
  width: 0.0663,
  thickness: 0.00011,
  mass: 0.001,
};

/**
 * One banknote lying flat.
 *
 * The note lies in the `XZ` plane, its long side along `X`, its origin the
 * centre of its underside. Notes bundle by the shared tabletop contacts
 * (`TabletopStack`): one note's `base` mounted on the next one's `top`, so a
 * counted note is taken from the top of the bundle.
 *
 * @param params The optional scene id.
 * @returns The inert note and its contact frames, metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the source size and mass, the frame and how notes bundle.
 * @evidence contracts/development/implementation.md#principled-implementation One box at the read size and mass.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Record the dimensions, lay the note, then the shared contacts.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Every figure is read.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part and three contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the tabletop contacts with the card, chip and die.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs.
 */
export function createBanknote(
  params: createBanknote.IParams = {},
): AutoMovieArchetype<createBanknote.Affordance, createBanknote.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createBanknote.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "banknote",
      { length: "m", width: "m", thickness: "m", mass: "kg" },
      undefined,
    );
  draw.derive("length", NOTE.length);
  draw.derive("width", NOTE.width);
  draw.derive("thickness", NOTE.thickness);
  draw.derive("mass", NOTE.mass);
  const builder: AutoMovieArchetypeBuilder<
    createBanknote.Affordance,
    createBanknote.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? "banknote",
    name: "banknote",
    material: "paper",
    draw,
  });
  builder.box(
    "note",
    Vector3.create(NOTE.length, NOTE.thickness, NOTE.width),
    Vector3.create(0, NOTE.thickness / 2, 0),
    { color: "#7f9b72" },
  );
  TabletopStack.contacts(builder, NOTE.thickness, NOTE.thickness);
  return builder.build(NOTE.mass);
}

/**
 * The inputs, contacts and size of {@link createBanknote}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the scene id input, the contacts, the dimensions and the note size.
 * @evidence contracts/development/design.md#principled-representation Metres and kilograms from the read note.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shared tabletop contacts a bundle and a count read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The read note fixes the size, so no dimension is authorable.
 */
export namespace createBanknote {
  /** The shared pinch, underside and upper sockets. */
  export type Affordance = TabletopStack.Contact;

  /** The note's length, width, thickness and mass. */
  export type Dimension = "length" | "width" | "thickness" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `banknote` when absent. */
    id?: string;
  }

  /** The note's size, metres and kilograms. */
  export interface INote {
    /** Along the long side, read. */
    length: number;

    /** Across the short side, read. */
    width: number;

    /** The paper's thickness, read. */
    thickness: number;

    /** The note's mass, read. */
    mass: number;
  }
}

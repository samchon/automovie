import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
} from "../core";
import { TabletopStack } from "./TabletopStack";

/**
 * A poker-size playing card: 3½ × 2½ in, Bicycle's poker deck listed as
 * 88 × 63 mm (English Wikipedia, Standard 52-card deck, card-size table,
 * read 2026-11-21). The board's thickness and the card's mass are not read,
 * so they are provisional estimates.
 */
const CARD: Readonly<createPlayingCard.ICard> = {
  width: 2.5 * 0.0254,
  length: 3.5 * 0.0254,
  thickness: 0.0003,
  mass: 0.0018,
};

/**
 * One playing card lying flat, face down.
 *
 * The card lies in the `XZ` plane, its long side along `Z`, its origin the
 * centre of its underside. It stacks and is placed by the shared tabletop
 * contacts (`TabletopStack`): a pinch at its upper face, its `base` and its
 * `top`. A deck is cards stacked by their sockets, and a dealt card is put
 * down on a seat's place.
 *
 * @param params The optional scene id.
 * @returns The inert card and its contact frames, metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the source size, the frame and the shared contacts.
 * @evidence contracts/development/implementation.md#principled-implementation One box at the read poker size and an estimated board thickness.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Record the dimensions, lay the card, then the shared contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Thickness and mass are named provisional estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part and three contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the tabletop contacts with the chip, note and die.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs.
 */
export function createPlayingCard(
  params: createPlayingCard.IParams = {},
): Archetype<createPlayingCard.Affordance, createPlayingCard.Dimension> {
  const draw: ArchetypeDrawSession<createPlayingCard.Dimension> =
    new ArchetypeDrawSession(
      "playingCard",
      { width: "m", length: "m", thickness: "m", mass: "kg" },
      undefined,
    );
  draw.derive("width", CARD.width);
  draw.derive("length", CARD.length);
  draw.derive("thickness", CARD.thickness);
  draw.derive("mass", CARD.mass);
  const builder: ArchetypeBuilder<
    createPlayingCard.Affordance,
    createPlayingCard.Dimension
  > = new ArchetypeBuilder({
    id: params.id ?? "playingCard",
    name: "playing card",
    material: "paper",
    draw,
  });
  builder.box(
    "card",
    Vector3.create(CARD.width, CARD.thickness, CARD.length),
    Vector3.create(0, CARD.thickness / 2, 0),
    { color: "#b22a2a" },
  );
  TabletopStack.contacts(builder, CARD.thickness, CARD.thickness);
  return builder.build(CARD.mass);
}

/**
 * The inputs, contacts and size of {@link createPlayingCard}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the scene id input, the contacts, the dimensions and the card size.
 * @evidence contracts/development/design.md#principled-representation Metres and kilograms; the size states which figures are read.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shared tabletop contacts a deal and a shuffle read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The read size fixes the card, so no dimension is authorable.
 */
export namespace createPlayingCard {
  /** The shared pinch, underside and upper sockets. */
  export type Affordance = TabletopStack.Contact;

  /** The card's width, length, thickness and mass. */
  export type Dimension = "width" | "length" | "thickness" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `playingCard` when absent. */
    id?: string;
  }

  /** The card's size, metres and kilograms. */
  export interface ICard {
    /** Across the short side, read. */
    width: number;

    /** Along the long side, read. */
    length: number;

    /** The board's thickness, estimated. */
    thickness: number;

    /** The card's mass, estimated. */
    mass: number;
  }
}

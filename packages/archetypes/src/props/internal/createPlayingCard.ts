import type { AutoMovieArchetypePlayingCard } from "../AutoMovieArchetypePlayingCard";
import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "../../core/index";
import { TabletopStack } from "./TabletopStack";

/*
 * One playing card lying flat, face down.
 *
 * The card lies in the `XZ` plane, its long side along `Z`, its origin the
 * centre of its underside. It stacks and is placed by the shared tabletop
 * contacts (`TabletopStack`): a pinch at its upper face, its `base` and its
 * `top`. A deck is cards stacked by their sockets, and a dealt card is put down
 * on a seat's place.
 * Parameter params: The optional scene id.
 * Returns: The inert card and its contact frames, metres.
 */
export function createPlayingCard(
  params: AutoMovieArchetypePlayingCard.IParams = {},
): AutoMovieArchetype<
  AutoMovieArchetypePlayingCard.Affordance,
  AutoMovieArchetypePlayingCard.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypePlayingCard.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "playingCard",
      { width: "m", length: "m", thickness: "m", mass: "kg" },
      undefined,
    );
  draw.derive("width", CARD.width);
  draw.derive("length", CARD.length);
  draw.derive("thickness", CARD.thickness);
  draw.derive("mass", CARD.mass);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypePlayingCard.Affordance,
    AutoMovieArchetypePlayingCard.Dimension
  > = new AutoMovieArchetypeBuilder({
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

/*
 * A poker-size playing card: 3½ × 2½ in, Bicycle's poker deck listed as 88 × 63
 * mm (English Wikipedia, Standard 52-card deck, card-size table, read
 * 2026-11-21). The board's thickness and the card's mass are not read, so they
 * are provisional estimates.
 */
const CARD: Readonly<AutoMovieArchetypePlayingCard.ICard> = {
  width: 2.5 * 0.0254,
  length: 3.5 * 0.0254,
  thickness: 0.0003,
  mass: 0.0018,
};

import { type AutoMovieArchetype } from "../core/index";
import { createPlayingCard as createPlayingCardImplementation } from "./internal/createPlayingCard";
import { TabletopStack } from "./internal/TabletopStack";

/** Constructs a flat red playing-card proxy with centered stacking sockets. */
export namespace AutoMovieArchetypePlayingCard {
  /**
   * Build one face-down paper card in the XZ plane with its long edge along Z.
   *
   * The red slab is 0.0635 by 0.0889 metres, 0.0003 metres thick.
   * Its upper precision pinch uses the slab thickness.
   *
   * @param params Optional scene ID, defaulting to `playingCard`.
   * @returns The paper card with a pinch and top and base stack sockets.
   */
  export function create(params?: AutoMovieArchetypePlayingCard.IParams): AutoMovieArchetype<
  AutoMovieArchetypePlayingCard.Affordance,
  AutoMovieArchetypePlayingCard.Dimension
> {
    return createPlayingCardImplementation(params);
  }

  /** Upper `grip` and `top` socket, with `base` at the underside centre. */
  export type Affordance = TabletopStack.Contact;

  /**
   * Width along X, length along Z and thickness along Y in metres. Mass is in kilograms.
   */
  export type Dimension = "width" | "length" | "thickness" | "mass";

  /** Optional scene ID for the fixed-size card. */
  export interface IParams {
    /** Scene object ID, defaulting to `playingCard`. */
    id?: string;
  }

  /** Fixed metric playing-card dimensions and estimated mass. */
  export interface ICard {
    /** Short-side width along X, 0.0635 metres. */
    width: number;

    /** Long-side length along Z, 0.0889 metres. */
    length: number;

    /** Estimated Y thickness of the card, 0.0003 metres. */
    thickness: number;

    /** Estimated whole card mass, 0.0018 kilograms. */
    mass: number;
  }}

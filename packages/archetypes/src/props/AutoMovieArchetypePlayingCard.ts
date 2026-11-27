import { type AutoMovieArchetype } from "../core/index";
import { createPlayingCard as createPlayingCardImplementation } from "./internal/createPlayingCard";
import { TabletopStack } from "./internal/TabletopStack";

/** Public operations for Auto Movie Archetype Playing Card. */
export namespace AutoMovieArchetypePlayingCard {
  /**
   * One playing card lying flat, face down.
   *
   * The card lies in the `XZ` plane, its long side along `Z`, its origin the
   * centre of its underside. It stacks and is placed by the shared tabletop
   * contacts (`TabletopStack`): a pinch at its upper face, its `base` and its
   * `top`. A deck is cards stacked by their sockets, and a dealt card is put down
   * on a seat's place.
   *
   * @param params The optional scene id.
   * @returns The inert card and its contact frames, metres.
   */
  export function create(params?: AutoMovieArchetypePlayingCard.IParams): AutoMovieArchetype<
  AutoMovieArchetypePlayingCard.Affordance,
  AutoMovieArchetypePlayingCard.Dimension
> {
    return createPlayingCardImplementation(params);
  }

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
  }}

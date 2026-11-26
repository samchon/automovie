import { type AutoMovieArchetype } from "../core/index";
import { createBanknote as createBanknoteImplementation } from "./internal/createBanknote";
import { TabletopStack } from "./TabletopStack";

/** Public operations for Auto Movie Archetype Banknote. */
export namespace AutoMovieArchetypeBanknote {
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
   */
  export function create(params?: AutoMovieArchetypeBanknote.IParams): AutoMovieArchetype<AutoMovieArchetypeBanknote.Affordance, AutoMovieArchetypeBanknote.Dimension> {
    return createBanknoteImplementation(params);
  }

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
  }}

import { type AutoMovieArchetype } from "../core/index";
import { createGamingChip as createGamingChipImplementation } from "./internal/createGamingChip";
import { TabletopStack } from "./TabletopStack";

/** Public operations for Auto Movie Archetype Gaming Chip. */
export namespace AutoMovieArchetypeGamingChip {
  /**
   * One gaming chip lying flat.
   *
   * The chip is a disc in the `XZ` plane, its origin the centre of its underside.
   * Chips stack by the shared tabletop contacts (`TabletopStack`): one chip's
   * `base` mounted on the next one's `top`, so a stack moves with the chip at its
   * bottom.
   *
   * @param params The optional scene id.
   * @returns The inert chip and its contact frames, metres.
   */
  export function create(params?: AutoMovieArchetypeGamingChip.IParams): AutoMovieArchetype<AutoMovieArchetypeGamingChip.Affordance, AutoMovieArchetypeGamingChip.Dimension> {
    return createGamingChipImplementation(params);
  }

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
  }}

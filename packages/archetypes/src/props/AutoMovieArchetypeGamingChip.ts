import { type AutoMovieArchetype } from "../core/index";
import { createGamingChip as createGamingChipImplementation } from "./internal/createGamingChip";
import { TabletopStack } from "./internal/TabletopStack";

/** Constructs a flat plastic gaming chip with centered stacking sockets. */
export namespace AutoMovieArchetypeGamingChip {
  /**
   * Build one plastic chip lying flat in the XZ plane.
   *
   * The disc is 0.039 metres across and 0.0033 metres thick. Its
   * diameter sets the upper precision pinch aperture.
   *
   * @param params Optional scene ID, defaulting to `gamingChip`.
   * @returns The disc with centered `base` and `top` sockets and an upper grip.
   */
  export function create(params?: AutoMovieArchetypeGamingChip.IParams): AutoMovieArchetype<AutoMovieArchetypeGamingChip.Affordance, AutoMovieArchetypeGamingChip.Dimension> {
    return createGamingChipImplementation(params);
  }

  /** Upper `grip` and `top` socket, and centered underside `base` socket. */
  export type Affordance = TabletopStack.Contact;

  /** Disc diameter and thickness in metres, and whole mass in kilograms. */
  export type Dimension = "diameter" | "thickness" | "mass";

  /** Optional scene ID for the fixed-size chip. */
  export interface IParams {
    /** Scene object ID, defaulting to `gamingChip`. */
    id?: string;
  }

  /** The fixed chip cross-section and mass. */
  export interface IChip {
    /** Estimated disc diameter, 0.039 metres. */
    diameter: number;

    /** Estimated disc height, 0.0033 metres. */
    thickness: number;

    /** Recorded whole-chip mass, 0.01 kilograms. */
    mass: number;
  }}

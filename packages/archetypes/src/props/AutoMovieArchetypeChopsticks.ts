import { type AutoMovieArchetype } from "../core/index";
import { createChopsticks as createChopsticksImplementation } from "./internal/createChopsticks";

/** Constructs a fixed lower chopstick and one hinged upper chopstick. */
export namespace AutoMovieArchetypeChopsticks {
  /**
   * Build two equal wooden sticks around the fixed lower stick's `+Z` axis.
   *
   * The upper stick pivots one third along its shaft around `+X`. It closes
   * through 12 degrees at `pinch`, when both rods meet at the fixed `tips`
   * socket. The grip stays one third along the lower stick.
   *
   * @param params Optional scene ID, defaulting to `chopsticks`.
   * @returns The articulated pair with its grip, hinge and tip contact.
   */
  export function create(params?: AutoMovieArchetypeChopsticks.IParams): AutoMovieArchetype<AutoMovieArchetypeChopsticks.Affordance, AutoMovieArchetypeChopsticks.Dimension> {
    return createChopsticksImplementation(params);
  }

  /**
   * Fixed `grip`, upper-stick `pinch` hinge and fixed `tips` contact socket.
   */
  export type Affordance = "pinch" | "grip" | "tips";

  /** Both rods' length and diameter in metres, and pair mass in kilograms. */
  export type Dimension = "length" | "diameter" | "mass";

  /** The scene ID of the fixed-size pair. */
  export interface IParams {
    /** Scene object ID, defaulting to `chopsticks`. */
    id?: string;
  }

  /** Recipe measurements for the pair's wooden rods and upper-stick travel. */
  export interface ISize {
    /** Length of each rod, 0.24 metres. */
    length: number;

    /** Diameter of both rods, 0.006 metres. */
    diameter: number;

    /** Upper-stick travel from rest toward the lower stick, 12 degrees. */
    spread: number;

    /** Total pair mass of 0.02 kilograms. */
    mass: number;
  }}

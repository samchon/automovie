import { type AutoMovieArchetype } from "../core/index";
import { createScissors as createScissorsImplementation } from "./internal/createScissors";

/** Public operations for Auto Movie Archetype Scissors. */
export namespace AutoMovieArchetypeScissors {
  /**
   * A pair of scissors lying flat, its two blades on one pivot.
   *
   * The pivot is at the origin, the blades running along `+Z` and the rings along
   * `-Z`, the flat of the blades in `XZ`. The lower blade and the finger ring are
   * the prop's own frame, held in the hand; the upper blade and the thumb ring
   * turn about the pivot's `+Y` on the `pivot` hinge, from closed at 0 to open at
   * `opening` degrees. `fingerRing` is the handle the fingers hold, `thumbRing`
   * the ring the thumb works; `cut` is the fixed blade's edge midway along it,
   * where a cut advances, and `tip` its point.
   *
   * @param params The optional scene id.
   * @returns The scissors and their contacts, metres.
   */
  export function create(params?: AutoMovieArchetypeScissors.IParams): AutoMovieArchetype<AutoMovieArchetypeScissors.Affordance, AutoMovieArchetypeScissors.Dimension> {
    return createScissorsImplementation(params);
  }

  /** The hinge, the two rings, the cutting point and the tip. */
  export type Affordance = "pivot" | "fingerRing" | "thumbRing" | "cut" | "tip";

  /** The overall length, the blade's and the mass. */
  export type Dimension = "length" | "blade" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `scissors` when absent. */
    id?: string;
  }

  /** The scissors' size, metres, degrees and kilograms. */
  export interface ISize {
    /** Overall, pivot ring to tip. */
    length: number;

    /** The blades from the pivot. */
    blade: number;

    /** A ring's bore. */
    ring: number;

    /** The widest opening, degrees. */
    opening: number;

    /** The mass. */
    mass: number;
  }}

import { type AutoMovieArchetype } from "../core/index";
import { createChopsticks as createChopsticksImplementation } from "./internal/createChopsticks";

/** Public operations for Auto Movie Archetype Chopsticks. */
export namespace AutoMovieArchetypeChopsticks {
  /**
   * A pair of chopsticks held in the conventional hold: the lower stick fixed
   * against the thumb's base and the ring finger, the upper stick moved by the
   * index and middle fingers.
   *
   * The lower stick is the prop's frame, running along `+Z` from its butt at the
   * origin to its tip. The upper stick lies above it (`+Y`) and turns about a
   * fulcrum a third of the way along, at the thumb's tip, on the `pinch` hinge:
   * open at 0, spread `spread` degrees, and closed at `spread`, its tip on the
   * lower one's. `grip` is the hold a third of the way along, `tips` the meeting
   * point of the two tips, where a morsel is pinched.
   *
   * @param params The optional scene id.
   * @returns The chopsticks and their contacts, metres.
   */
  export function create(params?: AutoMovieArchetypeChopsticks.IParams): AutoMovieArchetype<AutoMovieArchetypeChopsticks.Affordance, AutoMovieArchetypeChopsticks.Dimension> {
    return createChopsticksImplementation(params);
  }

  /** The upper stick's hinge, the hold and the tips. */
  export type Affordance = "pinch" | "grip" | "tips";

  /** The length, the diameter and the mass. */
  export type Dimension = "length" | "diameter" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `chopsticks` when absent. */
    id?: string;
  }

  /** The pair's size, metres, degrees and kilograms. */
  export interface ISize {
    /** Each stick's length. */
    length: number;

    /** Each stick's diameter. */
    diameter: number;

    /** The open spread between the sticks, degrees. */
    spread: number;

    /** The pair's mass. */
    mass: number;
  }}

import type { AutoMovieArchetype } from "../core";
import { createBowlingPin as createBowlingPinImplementation } from "./internal/createBowlingPin";

/** Public ten-pin bowling-pin producer. */
export namespace AutoMovieArchetypeBowlingPin {
  /**
   * A ten-pin bowling pin standing at its own base origin, so ten independent
   * instances can move after a hit.
   *
   * @param params Optional pin id, distinct across the rack.
   * @param seed Seed for mass.
   * @returns The pin, including its base and the widest part to use as targets.
   */
  export function create(
    params: { id?: string } = {},
    seed?: number,
  ): AutoMovieArchetype<"base" | "belly", "mass"> {
    return createBowlingPinImplementation(params, seed);
  }
}
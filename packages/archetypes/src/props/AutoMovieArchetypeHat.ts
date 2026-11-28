import { type AutoMovieArchetype } from "../core/index";
import { type WornPropDraw } from "./internal/WornPropDraw";
import { createHat as createHatImplementation } from "./internal/createHat";

/** Constructs a circular-brim hat with a crown socket. */
export namespace AutoMovieArchetypeHat {
  /**
   * Build a hat standing on a circular brim with its crown toward `+Y`.
   *
   * The `hold` pinches the brim near its right edge at `-X`. The `wear`
   * socket faces down from the inner crown.
   *
   * @param params Optional ID and finite brim and crown diameters, height or mass
   *   admitted by the bands. The default ID is `wearable`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   a 0.32738 metre brim
   *   diameter, 0.17181 metre crown diameter and 0.104775 metre height.
   * @returns The brim and crown with their grasp and wearing frames.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    WornPropDraw.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeHat.Affordance, AutoMovieArchetypeHat.Dimension> {
    return createHatImplementation(params, seed);
  }

  /** Right-side brim `hold` and downward crown `wear` socket. */
  export type Affordance = "hold" | "wear";

  /**
   * Brim diameter as width, crown diameter as depth and height in metres. Mass is in kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";}

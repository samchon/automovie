import type { AutoMovieArchetype } from "../core";
import { ScenicContainerConstruction } from "./internal/ScenicContainerConstruction";
import type { createScenicContainer } from "./internal/createScenicContainer";

/**
 * Constructs a faceted cargo pod with a supported cap and a lower mounting socket.
 */
export namespace AutoMovieArchetypeCargoPod {
  /**
   * Build a cargo pod with a bottom centre at the model origin.
   *
   * The cap narrows toward the upward `top` footprint. The bottom
   * `mount` socket faces up at Y zero for mounting above another contact.
   *
   * @param params Optional scene ID and finite width, depth, height and
   *   mass in their bands. The default ID is `scenicContainer`.
   * @param seed Numeric seed for omitted values. Seedless outer sizes
   *   are 0.91 by 0.60 by 0.56 metres in X/Z/Y order.
   * @returns The faceted pod with top support and bottom mounting frames.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(
  params: AutoMovieArchetypeCargoPod.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeCargoPod.Affordance, AutoMovieArchetypeCargoPod.Dimension> {
  return ScenicContainerConstruction.mountedPod(params, seed);
  }

  /* The authorable settings and local contact IDs of {@link AutoMovieArchetypeCargoPod}. */
  /**
   * Outer width, depth and height in metres, and estimated whole pod mass in kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** Supported upper `top` footprint and bottom-centre `mount` socket. */
  export type Affordance = "mount" | "top";

  /**
   * Optional scene ID and finite measurements admitted by the cargo-pod bands.
   */
  export type IParams = Pick<
    createScenicContainer.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >;
}

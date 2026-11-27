import { type AutoMovieEngineRigidCarrierSample } from "@automovie/engine";
import { type AutoMovieArchetype } from "../core/AutoMovieArchetype";
import { type AutoMovieArchetypeCart } from "./AutoMovieArchetypeCart";
import { type AutoMovieArchetypeRide } from "../core/AutoMovieArchetypeRide";
import { prepareTowedCartDriver as prepareTowedCartDriverImplementation } from "./internal/prepareTowedCartDriver";

/** Public operations for Auto Movie Archetype Towed Cart Driver. */
export namespace AutoMovieArchetypeTowedCartDriver {
  /**
   * Bind a towed cart's driver to its placement, footboard, seat and driving
   * lines. The nominal hand stations project to the live final segments between
   * the horse's terrets and the cart's material ends. Each palm uses the current
   * line tangent, so steering does not pull the hand off the rein.
   */
  export function prepareDriver(cart: AutoMovieArchetype<AutoMovieArchetypeCart.Affordance, AutoMovieArchetypeCart.Dimension>, ride: AutoMovieArchetypeRide.ITowedRide<
    AutoMovieArchetypeCart.Affordance,
    AutoMovieArchetypeCart.Dimension
  >): AutoMovieEngineRigidCarrierSample.IBinding {
    return prepareTowedCartDriverImplementation(cart, ride);
  }
}

import { type AutoMovieArchetype } from "../../core";
import { CartConstruction } from "../internal/CartConstruction";
import { CartPushed } from "../internal/CartPushed";
import type { AutoMovieArchetypeShoppingTrolley } from "../AutoMovieArchetypeShoppingTrolley";

/**
 * Shopping trolley.
 *
 * A four-castor basket carrier pushed from the rear bar at −Z. The basket floor
 * supports upright cargo.
 *
 * @param params The scene identity and the dimensions and catalogue choices
 *   this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createShoppingTrolley(
  params: AutoMovieArchetypeShoppingTrolley.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeShoppingTrolley.Affordance,
  AutoMovieArchetypeShoppingTrolley.Dimension
> {
  return CartConstruction("trolley", params, seed, CartPushed.trolley);
}

import { type AutoMovieArchetype } from "../../core";
import { CartConstruction } from "../internal/CartConstruction";
import { CartLimber } from "../internal/CartLimber";
import type { AutoMovieArchetypeLimber } from "../AutoMovieArchetypeLimber";

/*
 * Two-wheeled towing limber.
 *
 * The forward draw contact leads along +Z from the axle. The rear coupling and
 * placed chest move with its frame.
 * Parameter params: The scene identity and the dimensions and catalogue choices
 * this carrier admits.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createLimber(
  params: AutoMovieArchetypeLimber.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLimber.Affordance, AutoMovieArchetypeLimber.Dimension> {
  return CartConstruction("limber", params, seed, CartLimber.build);
}

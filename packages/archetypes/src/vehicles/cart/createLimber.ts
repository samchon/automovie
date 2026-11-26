import { type AutoMovieArchetype } from "../../core";
import { CartConstruction } from "../CartConstruction";
import { CartLimber } from "../CartLimber";
import type { AutoMovieArchetypeLimber } from "../AutoMovieArchetypeLimber";

/**
 * Two-wheeled towing limber.
 *
 * The forward draw contact leads along +Z from the axle. The rear coupling and
 * placed chest move with its frame.
 *
 * @param params The scene identity and the dimensions and catalogue choices
 *   this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createLimberImpl(
  params: AutoMovieArchetypeLimber.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLimber.Affordance, AutoMovieArchetypeLimber.Dimension> {
  return CartConstruction("limber", params, seed, CartLimber.build);
}

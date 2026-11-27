import { type AutoMovieArchetype } from "../../core";
import { CartConstruction } from "../internal/CartConstruction";
import { CartDrawn } from "../internal/CartDrawn";
import type { AutoMovieArchetypeRickshaw } from "../AutoMovieArchetypeRickshaw";

/*
 * Pedestrian-drawn rickshaw.
 *
 * Its shaft handles lead along +Z from the axle centre. The passenger sits over
 * the axle with a separate footboard.
 * Parameter params: The scene identity and the dimensions and catalogue choices
 * this carrier admits.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createRickshaw(
  params: AutoMovieArchetypeRickshaw.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeRickshaw.Affordance, AutoMovieArchetypeRickshaw.Dimension> {
  return CartConstruction("rickshaw", params, seed, CartDrawn.rickshaw);
}

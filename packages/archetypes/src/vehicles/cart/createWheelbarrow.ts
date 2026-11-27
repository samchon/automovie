import { type AutoMovieArchetype } from "../../core";
import { CartConstruction } from "../internal/CartConstruction";
import { CartPushed } from "../internal/CartPushed";
import type { AutoMovieArchetypeWheelbarrow } from "../AutoMovieArchetypeWheelbarrow";

/*
 * Wheelbarrow.
 *
 * A hand-pushed tray with a central wheel and distinct left and right grips. It
 * rests on the floor with its handles at −Z.
 * Parameter params: The scene identity and the dimensions and catalogue choices
 * this carrier admits.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createWheelbarrow(
  params: AutoMovieArchetypeWheelbarrow.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeWheelbarrow.Affordance,
  AutoMovieArchetypeWheelbarrow.Dimension
> {
  return CartConstruction("wheelbarrow", params, seed, CartPushed.wheelbarrow);
}

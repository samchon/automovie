import { type AutoMovieArchetype } from "../../core";
import { CartConstruction } from "../CartConstruction";
import { CartPushed } from "../CartPushed";
import type { AutoMovieArchetypeWheelbarrow } from "../AutoMovieArchetypeWheelbarrow";

/**
 * Wheelbarrow.
 *
 * A hand-pushed tray with a central wheel and distinct left and right grips. It
 * rests on the floor with its handles at −Z.
 *
 * @param params The scene identity and the dimensions and catalogue choices
 *   this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
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

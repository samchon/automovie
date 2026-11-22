import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Push a button through the rectangular clear opening of a fixed garment prop.
 *
 * The garment supplies a rigid straight slider carrying the button geometry
 * and a stationary opening and rim. The author supplies a sphere enclosing
 * the button and the thickness of the stationary panel. Those dimensions
 * bound the passage without cloth deformation or a geometry-specific solver.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the authored geometry, motion and dimensions used by the button law.
 * @evidence contracts/development/design.md#principled-representation Models passage as a bounded rigid envelope and finite-thickness opening on one articulated prop.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law consumes only named model contacts, the slide and passage dimensions, timing and preferred hand.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The model owns the geometry and bindings, and the law admits the passage from the authored dimensions.
 */
export interface IAutoMovieMotionHumanButton {
  /** Subject of the stationary garment prop. */
  garment: string;

  /** Stationary aperture id. Its plane is local XY at Z=0, with X centered and Y starting at the sill. */
  opening: string;

  /** Stationary site where the other hand braces the panel. */
  rim: string;

  /** Affordance at the center of the button's enclosing sphere, directly riding the button slider. */
  button: string;

  /** Affordance on the trailing surface of the button, directly riding the same slider. */
  contact: string;

  /** Signed change in slider travel, metres. */
  travel: number;

  /** Radius of the button's enclosing sphere, metres. */
  radius: number;

  /** Full panel thickness across the aperture plane, metres. */
  thickness: number;

  /** Duration of the push, seconds, at unit tempo. Required: no natural value is defined, so the author sets it (provisional: no timing study was read). */
  seconds: number;

  /** Hand pushing the button. Defaults to the right. */
  side?: AutoMovieHumanSide;
}

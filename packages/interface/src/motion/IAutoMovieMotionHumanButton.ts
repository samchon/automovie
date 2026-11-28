import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * Push a button through the rectangular clear opening of a fixed garment prop.
 *
 * The garment supplies a rigid straight slider carrying the button geometry and
 * a stationary opening and rim. The author supplies a sphere enclosing the
 * button and the thickness of the stationary panel. Those dimensions bound the
 * passage without cloth deformation or a geometry-specific solver.
 */
export interface IAutoMovieMotionHumanButton {
  /** Subject of the stationary garment prop. */
  garment: string;

  /**
   * Stationary aperture id. Its plane is local XY at Z=0, with X centered and Y
   * starting at the sill.
   */
  opening: string;

  /** Stationary site where the other hand braces the panel. */
  rim: string;

  /**
   * Affordance at the center of the button's enclosing sphere, directly riding
   * the button slider.
   */
  button: string;

  /**
   * Affordance on the trailing surface of the button, directly riding the same
   * slider.
   */
  contact: string;

  /**
   * Finite nonzero change in slider travel in metres. Either sign is valid.
   * Invalid input is refused on `travel`.
   */
  travel: number;

  /**
   * Finite positive radius of the button's enclosing sphere in metres. Invalid
   * input is refused on `radius`.
   */
  radius: number;

  /**
   * Finite positive panel thickness across the aperture plane in metres.
   * Invalid input is refused on `thickness`.
   */
  thickness: number;

  /**
   * Finite positive push duration in seconds at unit tempo. Supply a duration
   * for the action. Invalid input is refused on `duration`.
   */
  duration: number;

  /** Hand pushing the button. Defaults to the right. */
  hand?: AutoMovieHumanSide;
}

import { type AutoMovieArchetype } from "../core";
import { CartCoach } from "./CartCoach";
import { CartConstruction } from "./CartConstruction";
import type { createCart } from "./createCart";

/**
 * Enclosed passenger carriage.
 *
 * The front axle steers the forward pole and the doors articulate
 * independently. The interior seat and side apertures serve boarding.
 *
 * @param params The scene identity and the dimensions and catalogue choices
 *   this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createCarriage(
  params: createCarriage.IParams = {},
  seed?: number,
): AutoMovieArchetype<createCarriage.Affordance, createCarriage.Dimension> {
  return CartConstruction("carriage", params, seed, CartCoach.carriage);
}

/** Authoring options for {@link createCarriage}. */
export namespace createCarriage {
  /** The `model` choices this producer admits. */
  export type Model = "brewster" | "minerStevens" | "peters";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "frontWheelDiameter"
    | "height"
    | "length"
    | "mass"
    | "wheelDiameter"
    | "wheelbase"
    | "width";

  /**
   * The createCart contact set its shared construction types. This producer
   * builds box, coupling, drawbarPitch, frontAxle, frontLeftSpin,
   * frontRightSpin, leftAperture, leftDoor, rearLeftSpin, rearRightSpin,
   * rightAperture, rightDoor, seat.
   */
  export type Affordance = createCart.Affordance;

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createCart.IParams,
    "id" | "wheelbase" | "mass"
  > {
    /** A model from this form's catalogue. */
    model?: Model;
  }
}
